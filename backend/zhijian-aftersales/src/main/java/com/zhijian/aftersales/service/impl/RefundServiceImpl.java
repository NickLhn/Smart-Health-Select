package com.zhijian.aftersales.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.aftersales.dto.RefundApplyDTO;
import com.zhijian.aftersales.dto.RefundAuditDTO;
import com.zhijian.aftersales.mapper.RefundApplyMapper;
import com.zhijian.aftersales.pojo.RefundApply;
import com.zhijian.aftersales.service.RefundService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.event.NotificationEvent;
import com.zhijian.pojo.Order;
import com.zhijian.pojo.user.entity.SysUser;
import com.zhijian.service.OrderService;
import com.zhijian.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RefundServiceImpl extends ServiceImpl<RefundApplyMapper, RefundApply> implements RefundService {

    private final OrderService orderService;
    private final UserService userService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean applyRefund(RefundApplyDTO applyDTO) {
        Long userId = UserContext.getUserId();

        Order order = orderService.getById(applyDTO.getOrderId());
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作此订单");
        }

        if (order.getStatus() < 1 || order.getStatus() > 3) {
            throw new RuntimeException("当前订单状态不可申请退款");
        }

        long count = this.count(new LambdaQueryWrapper<RefundApply>()
                .eq(RefundApply::getOrderId, order.getId())
                .ne(RefundApply::getStatus, 2));
        if (count > 0) {
            throw new RuntimeException("已存在处理中的退款申请");
        }

        RefundApply refundApply = new RefundApply();
        BeanUtil.copyProperties(applyDTO, refundApply);
        refundApply.setUserId(userId);
        refundApply.setAmount(order.getPayAmount());
        refundApply.setStatus(0);
        refundApply.setCreateTime(LocalDateTime.now());
        refundApply.setUpdateTime(LocalDateTime.now());
        refundApply.setOriginalOrderStatus(order.getStatus());

        this.save(refundApply);

        order.setStatus(4);
        order.setRefundReason(applyDTO.getReason());
        orderService.updateById(order);

        eventPublisher.publishEvent(new NotificationEvent(
                order.getUserId(),
                "您的退款申请已提交，请耐心等待审核",
                "REFUND_APPLIED",
                refundApply.getId()
        ));

        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean auditRefund(RefundAuditDTO auditDTO) {
        RefundApply refundApply = this.getById(auditDTO.getId());
        if (refundApply == null) {
            throw new RuntimeException("退款申请不存在");
        }
        if (refundApply.getStatus() != 0) {
            throw new RuntimeException("该申请已处理");
        }

        Order order = orderService.getById(refundApply.getOrderId());
        if (order == null) {
            throw new RuntimeException("关联订单不存在");
        }

        if (auditDTO.getPass()) {
            refundApply.setStatus(1);
            orderService.refundOrder(order.getId(), refundApply.getAmount(), refundApply.getReason());
            order.setStatus(5);
        } else {
            refundApply.setStatus(2);
            order.setStatus(refundApply.getOriginalOrderStatus());
        }

        refundApply.setAuditTime(LocalDateTime.now());
        refundApply.setAuditReason(auditDTO.getAuditReason());
        this.updateById(refundApply);
        orderService.updateById(order);

        String type = auditDTO.getPass() ? "REFUND_APPROVED" : "REFUND_REJECTED";
        eventPublisher.publishEvent(new NotificationEvent(
                refundApply.getUserId(),
                auditDTO.getPass() ? "您的退款申请已通过" : "您的退款申请已被拒绝，原因: " + auditDTO.getAuditReason(),
                type,
                refundApply.getId()
        ));

        return true;
    }

    @Override
    public IPage<RefundApply> pageWithDetail(IPage<RefundApply> page, Integer status) {
        LambdaQueryWrapper<RefundApply> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(RefundApply::getStatus, status);
        }
        wrapper.orderByDesc(RefundApply::getCreateTime);

        IPage<RefundApply> result = this.page(page, wrapper);
        if (result.getRecords().isEmpty()) {
            return result;
        }

        List<Long> orderIds = result.getRecords().stream()
                .map(RefundApply::getOrderId)
                .collect(Collectors.toList());
        List<Long> userIds = result.getRecords().stream()
                .map(RefundApply::getUserId)
                .collect(Collectors.toList());

        Map<Long, Order> orderMap = new HashMap<>();
        if (!orderIds.isEmpty()) {
            List<Order> orders = orderService.listByIds(orderIds);
            orderMap = orders.stream().collect(Collectors.toMap(Order::getId, o -> o));
        }

        Map<Long, SysUser> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<SysUser> users = userService.listByIds(userIds);
            userMap = users.stream().collect(Collectors.toMap(SysUser::getId, u -> u));
        }

        for (RefundApply apply : result.getRecords()) {
            Order order = orderMap.get(apply.getOrderId());
            if (order != null) {
                apply.setOrderNo(order.getOrderNo());
            }
            SysUser user = userMap.get(apply.getUserId());
            if (user != null) {
                apply.setUsername(user.getUsername());
            }
        }

        return result;
    }
}
