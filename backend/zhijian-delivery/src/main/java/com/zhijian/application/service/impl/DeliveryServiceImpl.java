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

/**
 * 配送服务实现
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

    @Override
    public Long createDelivery(DeliveryCreateDTO createDTO) {
        // 检查是否已存在
        Delivery exist = deliveryMapper.selectOne(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getOrderId, createDTO.getOrderId()));
        if (exist != null) {
            return exist.getId();
        }

        Delivery delivery = new Delivery();
        BeanUtil.copyProperties(createDTO, delivery);
        delivery.setStatus(0); // 待接单
        
        // 生成签收码 (4位随机数字)
        delivery.setVerifyCode(String.format("%04d", cn.hutool.core.util.RandomUtil.randomInt(10000)));
        
        // 设置急单状态
        if (createDTO.getIsUrgent() != null) {
            delivery.setIsUrgent(createDTO.getIsUrgent());
        } else {
            delivery.setIsUrgent(0);
        }
        
        deliveryMapper.insert(delivery);
        return delivery.getId();
    }

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

        delivery.setCourierId(courierId);
        delivery.setCourierName(courierName);
        delivery.setCourierPhone(courierPhone);
        delivery.setStatus(1); // 配送中
        
        boolean success = deliveryMapper.updateById(delivery) > 0;
        if (success) {
            eventPublisher.publishEvent(new DeliveryStatusEvent(delivery.getOrderId(), delivery.getId(), 1));
        }
        return success;
    }

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
        
        // 校验签收码 (已移除强制校验)
        // if (delivery.getVerifyCode() != null && !delivery.getVerifyCode().equals(verifyCode)) {
        //     throw new RuntimeException("签收码错误");
        // }

        delivery.setStatus(2); // 已送达
        if (proofImage != null && !proofImage.isEmpty()) {
            delivery.setProofImage(proofImage);
        }
        
        boolean success = deliveryMapper.updateById(delivery) > 0;
        if (success) {
            eventPublisher.publishEvent(new DeliveryStatusEvent(delivery.getOrderId(), delivery.getId(), 2));
        }
        return success;
    }

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
        // 不一定改变主状态，或者可以设为"异常"状态，视业务而定。这里仅标记异常。
        return deliveryMapper.updateById(delivery) > 0;
    }

    @Override
    public java.util.Map<String, Object> getRiderStats(Long courierId) {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        
        // 今日开始时间
        java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        
        // 查询今日已完成订单
        java.util.List<Delivery> todayDeliveries = deliveryMapper.selectList(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(Delivery::getStatus, 2)
                .ge(Delivery::getUpdateTime, startOfDay));
                
        // 计算今日收入
        java.math.BigDecimal todayIncome = todayDeliveries.stream()
                .map(d -> d.getDeliveryFee() != null ? d.getDeliveryFee() : java.math.BigDecimal.ZERO)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        
        // 计算今日单量
        int todayCount = todayDeliveries.size();
        
        // 计算月收入
        java.time.LocalDateTime startOfMonth = java.time.LocalDate.now().withDayOfMonth(1).atStartOfDay();
        java.util.List<Delivery> monthDeliveries = deliveryMapper.selectList(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(Delivery::getStatus, 2)
                .ge(Delivery::getUpdateTime, startOfMonth));
        java.math.BigDecimal monthIncome = monthDeliveries.stream()
                .map(d -> d.getDeliveryFee() != null ? d.getDeliveryFee() : java.math.BigDecimal.ZERO)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        int monthCount = monthDeliveries.size();

        // 计算总收入
        java.util.List<Delivery> allDeliveries = deliveryMapper.selectList(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(Delivery::getStatus, 2));
        java.math.BigDecimal totalIncome = allDeliveries.stream()
                .map(d -> d.getDeliveryFee() != null ? d.getDeliveryFee() : java.math.BigDecimal.ZERO)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        int totalCount = allDeliveries.size();
                
        stats.put("todayIncome", todayIncome);
        stats.put("todayCount", todayCount);
        stats.put("monthIncome", monthIncome);
        stats.put("monthCount", monthCount);
        stats.put("totalIncome", totalIncome);
        stats.put("totalCount", totalCount);
        
        return stats;
    }

    @Override
    public IPage<Delivery> listPendingDeliveries(int page, int size) {
        // 确保查询状态为0 (待接单) 的配送单
        // 如果有其他逻辑 (如距离过滤)，应在此处添加
        LambdaQueryWrapper<Delivery> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Delivery::getStatus, 0);
        wrapper.orderByDesc(Delivery::getIsUrgent); // 急单优先
        wrapper.orderByDesc(Delivery::getCreateTime);

        IPage<Delivery> result = deliveryMapper.selectPage(new Page<>(page, size), wrapper);
        log.info("查询待接单列表: page={}, size={}, count={}", page, size, result.getRecords().size());
        
        // 地址脱敏处理
        if (result.getRecords() != null) {
            result.getRecords().forEach(d -> {
                // 简单脱敏，实际业务可能更复杂
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

    @Override
    public IPage<Delivery> listMyDeliveries(Long courierId, Integer status, int page, int size) {
        return deliveryMapper.selectPage(new Page<>(page, size), new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(status != null, Delivery::getStatus, status)
                .orderByDesc(Delivery::getCreateTime));
    }
}
