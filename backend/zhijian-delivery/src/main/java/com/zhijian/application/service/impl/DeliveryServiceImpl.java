package com.zhijian.application.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.UserService;
import com.zhijian.interfaces.dto.delivery.DeliveryCreateDTO;
import com.zhijian.domain.delivery.entity.Delivery;
import com.zhijian.infrastructure.persistence.mapper.DeliveryMapper;
import com.zhijian.application.service.DeliveryService;
import com.zhijian.domain.user.entity.SysUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.zhijian.common.event.DeliveryStatusEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 配送服务实现类
 * 处理配送单的创建、接单、完成、异常上报等业务逻辑
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryServiceImpl extends ServiceImpl<DeliveryMapper, Delivery> implements DeliveryService {

    private final DeliveryMapper deliveryMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final UserService userService;

    /**
     * 创建配送单
     *
     * @param createDTO 配送单创建参数
     * @return 配送单ID
     */
    @Override
    public Long createDelivery(DeliveryCreateDTO createDTO) {
        // 检查是否已存在相同订单的配送单
        Delivery exist = deliveryMapper.selectOne(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getOrderId, createDTO.getOrderId()));
        if (exist != null) {
            return exist.getId(); // 已存在则返回现有ID
        }

        // 创建新的配送单
        Delivery delivery = new Delivery();
        BeanUtil.copyProperties(createDTO, delivery);
        delivery.setStatus(0); // 0:待接单

        // 生成4位数字签收码
        delivery.setVerifyCode(String.format("%04d", cn.hutool.core.util.RandomUtil.randomInt(10000)));

        // 设置急单状态
        delivery.setIsUrgent(createDTO.getIsUrgent() != null ? createDTO.getIsUrgent() : 0);

        deliveryMapper.insert(delivery);
        return delivery.getId();
    }

    /**
     * 骑手接单
     *
     * @param deliveryId 配送单ID
     * @param courierId 骑手ID
     * @return 接单是否成功
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean acceptDelivery(Long deliveryId, Long courierId) {
        Delivery delivery = deliveryMapper.selectById(deliveryId);
        if (delivery == null) {
            throw new RuntimeException("配送单不存在");
        }
        if (delivery.getStatus() != 0) {
            throw new RuntimeException("该配送单已被接单或已取消");
        }

        // 获取骑手信息
        SysUser rider = userService.getById(courierId);
        String courierName = rider != null ? (rider.getNickname() != null ? rider.getNickname() : rider.getUsername()) : "骑手" + courierId;
        String courierPhone = rider != null ? rider.getMobile() : "";

        // 更新配送单信息
        delivery.setCourierId(courierId);
        delivery.setCourierName(courierName);
        delivery.setCourierPhone(courierPhone);
        delivery.setStatus(1); // 1:配送中

        boolean success = deliveryMapper.updateById(delivery) > 0;
        if (success) {
            // 发布配送状态变更事件
            eventPublisher.publishEvent(new DeliveryStatusEvent(delivery.getOrderId(), delivery.getId(), 1));
        }
        return success;
    }

    /**
     * 完成配送
     *
     * @param deliveryId 配送单ID
     * @param courierId 骑手ID
     * @param proofImage 配送证明图片URL
     * @param verifyCode 签收码（可选）
     * @return 完成是否成功
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean completeDelivery(Long deliveryId, Long courierId, String proofImage, String verifyCode) {
        Delivery delivery = deliveryMapper.selectById(deliveryId);
        if (delivery == null) {
            throw new RuntimeException("配送单不存在");
        }
        if (!delivery.getCourierId().equals(courierId)) {
            throw new RuntimeException("无权操作此配送单");
        }
        if (delivery.getStatus() != 1) {
            throw new RuntimeException("配送单状态不正确");
        }

        // 签收码校验（当前已移除强制校验，可选择性启用）
        // if (delivery.getVerifyCode() != null && !delivery.getVerifyCode().equals(verifyCode)) {
        //     throw new RuntimeException("签收码错误");
        // }

        // 更新配送状态为已送达
        delivery.setStatus(2); // 2:已送达
        if (proofImage != null && !proofImage.isEmpty()) {
            delivery.setProofImage(proofImage);
        }

        boolean success = deliveryMapper.updateById(delivery) > 0;
        if (success) {
            // 发布配送完成事件
            eventPublisher.publishEvent(new DeliveryStatusEvent(delivery.getOrderId(), delivery.getId(), 2));
        }
        return success;
    }

    /**
     * 上报配送异常
     *
     * @param deliveryId 配送单ID
     * @param courierId 骑手ID
     * @param reason 异常原因
     * @return 上报是否成功
     */
    @Override
    public boolean reportException(Long deliveryId, Long courierId, String reason) {
        Delivery delivery = deliveryMapper.selectById(deliveryId);
        if (delivery == null) {
            throw new RuntimeException("配送单不存在");
        }
        if (!delivery.getCourierId().equals(courierId)) {
            throw new RuntimeException("无权操作此配送单");
        }

        // 标记异常状态
        delivery.setExceptionStatus(1);
        delivery.setExceptionReason(reason);

        return deliveryMapper.updateById(delivery) > 0;
    }

    /**
     * 获取骑手统计数据
     *
     * @param courierId 骑手ID
     * @return 包含今日、本月、总计的订单量和收入
     */
    @Override
    public Map<String, Object> getRiderStats(Long courierId) {
        Map<String, Object> stats = new HashMap<>();

        // 今日开始时间
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        // 查询今日已完成订单
        List<Delivery> todayDeliveries = deliveryMapper.selectList(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(Delivery::getStatus, 2)
                .ge(Delivery::getUpdateTime, startOfDay));

        // 计算今日收入
        BigDecimal todayIncome = todayDeliveries.stream()
                .map(d -> d.getDeliveryFee() != null ? d.getDeliveryFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int todayCount = todayDeliveries.size();

        // 计算月收入
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        List<Delivery> monthDeliveries = deliveryMapper.selectList(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(Delivery::getStatus, 2)
                .ge(Delivery::getUpdateTime, startOfMonth));
        BigDecimal monthIncome = monthDeliveries.stream()
                .map(d -> d.getDeliveryFee() != null ? d.getDeliveryFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int monthCount = monthDeliveries.size();

        // 计算总收入
        List<Delivery> allDeliveries = deliveryMapper.selectList(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(Delivery::getStatus, 2));
        BigDecimal totalIncome = allDeliveries.stream()
                .map(d -> d.getDeliveryFee() != null ? d.getDeliveryFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalCount = allDeliveries.size();

        // 组装统计结果
        stats.put("todayIncome", todayIncome);
        stats.put("todayCount", todayCount);
        stats.put("monthIncome", monthIncome);
        stats.put("monthCount", monthCount);
        stats.put("totalIncome", totalIncome);
        stats.put("totalCount", totalCount);

        return stats;
    }

    /**
     * 分页查询待接单配送列表
     *
     * @param page 页码
     * @param size 每页大小
     * @return 配送单分页列表
     */
    @Override
    public IPage<Delivery> listPendingDeliveries(int page, int size) {
        // 查询状态为0（待接单）的配送单
        LambdaQueryWrapper<Delivery> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Delivery::getStatus, 0);
        wrapper.orderByDesc(Delivery::getIsUrgent); // 急单优先
        wrapper.orderByDesc(Delivery::getCreateTime); // 时间倒序

        IPage<Delivery> result = deliveryMapper.selectPage(new Page<>(page, size), wrapper);
        log.info("查询待接单列表: page={}, size={}, count={}", page, size, result.getRecords().size());

        // 地址脱敏处理
        if (result.getRecords() != null) {
            result.getRecords().forEach(d -> {
                // 姓名脱敏
                if (d.getReceiverName() != null && d.getReceiverName().length() > 1) {
                    d.setReceiverName(d.getReceiverName().charAt(0) + "**");
                }
                // 手机号脱敏
                if (d.getReceiverPhone() != null && d.getReceiverPhone().length() > 7) {
                    d.setReceiverPhone(d.getReceiverPhone().replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2"));
                }
            });
        }
        return result;
    }

    /**
     * 分页查询骑手的配送单
     *
     * @param courierId 骑手ID
     * @param status 配送状态（可选）
     * @param page 页码
     * @param size 每页大小
     * @return 配送单分页列表
     */
    @Override
    public IPage<Delivery> listMyDeliveries(Long courierId, Integer status, int page, int size) {
        return deliveryMapper.selectPage(new Page<>(page, size), new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(status != null, Delivery::getStatus, status)
                .orderByDesc(Delivery::getCreateTime));
    }
}