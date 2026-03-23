package com.zhijian.delivery.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.RandomUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.common.event.DeliveryStatusEvent;
import com.zhijian.delivery.dto.DeliveryCreateDTO;
import com.zhijian.delivery.mapper.DeliveryMapper;
import com.zhijian.delivery.pojo.Delivery;
import com.zhijian.delivery.service.DeliveryService;
import com.zhijian.pojo.user.entity.SysUser;
import com.zhijian.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * 配送服务实现类。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryServiceImpl extends ServiceImpl<DeliveryMapper, Delivery> implements DeliveryService {

    /**
     * 配送单数据访问对象。
     */
    private final DeliveryMapper deliveryMapper;

    /**
     * 应用事件发布器。
     */
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 用户业务服务。
     */
    private final UserService userService;

    /**
     * 创建配送单。
     * <p>
     * 同一订单只会创建一张配送单，并自动生成配送核销码。
     *
     * @param createDTO 创建参数
     * @return 配送单 ID
     */
    @Override
    public Long createDelivery(DeliveryCreateDTO createDTO) {
        // 一个订单只保留一张配送单，避免重复派单。
        Delivery exist = deliveryMapper.selectOne(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getOrderId, createDTO.getOrderId()));
        if (exist != null) {
            return exist.getId();
        }

        Delivery delivery = new Delivery();
        BeanUtil.copyProperties(createDTO, delivery);
        delivery.setStatus(0);
        // 配送核销码用于骑手送达后和收货方做确认。
        delivery.setVerifyCode(String.format("%04d", RandomUtil.randomInt(10000)));
        delivery.setIsUrgent(createDTO.getIsUrgent() != null ? createDTO.getIsUrgent() : 0);

        deliveryMapper.insert(delivery);
        return delivery.getId();
    }

    /**
     * 骑手接单。
     * <p>
     * 仅待接单状态的配送单允许被骑手接单，并在成功后发布配送状态变更事件。
     *
     * @param deliveryId 配送单 ID
     * @param courierId 骑手 ID
     * @return 接单结果
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

        SysUser rider = userService.getById(courierId);
        String courierName = rider != null ? (rider.getNickname() != null ? rider.getNickname() : rider.getUsername()) : "骑手" + courierId;
        String courierPhone = rider != null ? rider.getMobile() : "";

        delivery.setCourierId(courierId);
        delivery.setCourierName(courierName);
        delivery.setCourierPhone(courierPhone);
        delivery.setStatus(1);

        boolean success = deliveryMapper.updateById(delivery) > 0;
        if (success) {
            // 接单成功后通知订单侧同步配送状态。
            eventPublisher.publishEvent(new DeliveryStatusEvent(delivery.getOrderId(), delivery.getId(), 1));
        }
        return success;
    }

    /**
     * 完成配送。
     * <p>
     * 仅接单骑手本人且配送中状态的配送单允许完成，并在成功后发布配送完成事件。
     *
     * @param deliveryId 配送单 ID
     * @param courierId 骑手 ID
     * @param proofImage 配送凭证图片
     * @param verifyCode 核销码
     * @return 完成结果
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

        delivery.setStatus(2);
        if (proofImage != null && !proofImage.isEmpty()) {
            delivery.setProofImage(proofImage);
        }

        boolean success = deliveryMapper.updateById(delivery) > 0;
        if (success) {
            // 配送完成后通知订单侧推进到已送达状态。
            eventPublisher.publishEvent(new DeliveryStatusEvent(delivery.getOrderId(), delivery.getId(), 2));
        }
        return success;
    }

    /**
     * 上报配送异常。
     *
     * @param deliveryId 配送单 ID
     * @param courierId 骑手 ID
     * @param reason 异常原因
     * @return 上报结果
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

        delivery.setExceptionStatus(1);
        delivery.setExceptionReason(reason);

        return deliveryMapper.updateById(delivery) > 0;
    }

    /**
     * 获取骑手统计数据。
     * <p>
     * 分别统计今日、当月和累计配送收入与单量。
     *
     * @param courierId 骑手 ID
     * @return 统计数据
     */
    @Override
    public Map<String, Object> getRiderStats(Long courierId) {
        Map<String, Object> stats = new HashMap<>();

        // 这里按今日、当月、累计三个口径分别统计收入和单量。
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<Delivery> todayDeliveries = deliveryMapper.selectList(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(Delivery::getStatus, 2)
                .ge(Delivery::getUpdateTime, startOfDay));

        BigDecimal todayIncome = todayDeliveries.stream()
                .map(d -> d.getDeliveryFee() != null ? d.getDeliveryFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int todayCount = todayDeliveries.size();

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        List<Delivery> monthDeliveries = deliveryMapper.selectList(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(Delivery::getStatus, 2)
                .ge(Delivery::getUpdateTime, startOfMonth));
        BigDecimal monthIncome = monthDeliveries.stream()
                .map(d -> d.getDeliveryFee() != null ? d.getDeliveryFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int monthCount = monthDeliveries.size();

        List<Delivery> allDeliveries = deliveryMapper.selectList(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(Delivery::getStatus, 2));
        BigDecimal totalIncome = allDeliveries.stream()
                .map(d -> d.getDeliveryFee() != null ? d.getDeliveryFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalCount = allDeliveries.size();

        stats.put("todayIncome", todayIncome);
        stats.put("todayCount", todayCount);
        stats.put("monthIncome", monthIncome);
        stats.put("monthCount", monthCount);
        stats.put("totalIncome", totalIncome);
        stats.put("totalCount", totalCount);

        return stats;
    }

    /**
     * 分页查询待接单列表。
     * <p>
     * 查询结果会对收件人姓名和手机号做脱敏处理。
     *
     * @param page 页码
     * @param size 每页条数
     * @return 配送单分页结果
     */
    @Override
    public IPage<Delivery> listPendingDeliveries(int page, int size) {
        LambdaQueryWrapper<Delivery> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Delivery::getStatus, 0);
        wrapper.orderByDesc(Delivery::getIsUrgent);
        wrapper.orderByDesc(Delivery::getCreateTime);

        IPage<Delivery> result = deliveryMapper.selectPage(new Page<>(page, size), wrapper);
        log.info("查询待接单列表: page={}, size={}, count={}", page, size, result.getRecords().size());

        if (result.getRecords() != null) {
            // 待接单页面只需要骑手判断可接单，不应该暴露完整收件信息。
            result.getRecords().forEach(d -> {
                if (d.getReceiverName() != null && d.getReceiverName().length() > 1) {
                    d.setReceiverName(d.getReceiverName().charAt(0) + "**");
                }
                if (d.getReceiverPhone() != null && d.getReceiverPhone().length() > 7) {
                    d.setReceiverPhone(d.getReceiverPhone().replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2"));
                }
            });
        }
        return result;
    }

    /**
     * 分页查询骑手自己的配送单。
     *
     * @param courierId 骑手 ID
     * @param status 配送状态
     * @param page 页码
     * @param size 每页条数
     * @return 配送单分页结果
     */
    @Override
    public IPage<Delivery> listMyDeliveries(Long courierId, Integer status, int page, int size) {
        // 骑手自己的列表允许按状态筛选，方便区分进行中和已完成任务。
        return deliveryMapper.selectPage(new Page<>(page, size), new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(status != null, Delivery::getStatus, status)
                .orderByDesc(Delivery::getCreateTime));
    }
}
