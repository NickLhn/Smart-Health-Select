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

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryServiceImpl extends ServiceImpl<DeliveryMapper, Delivery> implements DeliveryService {

    private final DeliveryMapper deliveryMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final UserService userService;

    @Override
    public Long createDelivery(DeliveryCreateDTO createDTO) {
        // 一个订单只创建一张配送单，避免重复派单。
        Delivery exist = deliveryMapper.selectOne(new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getOrderId, createDTO.getOrderId()));
        if (exist != null) {
            return exist.getId();
        }

        Delivery delivery = new Delivery();
        BeanUtil.copyProperties(createDTO, delivery);
        delivery.setStatus(0);
        // 配送核销码用于配送完成时校验收货。
        delivery.setVerifyCode(String.format("%04d", RandomUtil.randomInt(10000)));
        delivery.setIsUrgent(createDTO.getIsUrgent() != null ? createDTO.getIsUrgent() : 0);

        deliveryMapper.insert(delivery);
        return delivery.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean acceptDelivery(Long deliveryId, Long courierId) {
        // 只有待接单的配送单才能被骑手接单。
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
            // 接单成功后发事件，供订单侧同步状态。
            eventPublisher.publishEvent(new DeliveryStatusEvent(delivery.getOrderId(), delivery.getId(), 1));
        }
        return success;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean completeDelivery(Long deliveryId, Long courierId, String proofImage, String verifyCode) {
        // 只有接单骑手本人且配送中状态，才能完成配送。
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
            // 配送完成后通知订单模块更新状态。
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

        return deliveryMapper.updateById(delivery) > 0;
    }

    @Override
    public Map<String, Object> getRiderStats(Long courierId) {
        Map<String, Object> stats = new HashMap<>();

        // 分别统计今日、当月和累计配送收入与单量。
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

    @Override
    public IPage<Delivery> listPendingDeliveries(int page, int size) {
        LambdaQueryWrapper<Delivery> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Delivery::getStatus, 0);
        wrapper.orderByDesc(Delivery::getIsUrgent);
        wrapper.orderByDesc(Delivery::getCreateTime);

        IPage<Delivery> result = deliveryMapper.selectPage(new Page<>(page, size), wrapper);
        log.info("查询待接单列表: page={}, size={}, count={}", page, size, result.getRecords().size());

        if (result.getRecords() != null) {
            // 待接单列表里对收件人姓名和手机号做脱敏。
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

    @Override
    public IPage<Delivery> listMyDeliveries(Long courierId, Integer status, int page, int size) {
        // 骑手自己的配送列表支持按状态筛选。
        return deliveryMapper.selectPage(new Page<>(page, size), new LambdaQueryWrapper<Delivery>()
                .eq(Delivery::getCourierId, courierId)
                .eq(status != null, Delivery::getStatus, status)
                .orderByDesc(Delivery::getCreateTime));
    }
}
