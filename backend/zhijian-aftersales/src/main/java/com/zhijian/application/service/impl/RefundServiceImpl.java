package com.zhijian.application.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.interfaces.dto.aftersales.RefundApplyDTO;
import com.zhijian.interfaces.dto.aftersales.RefundAuditDTO;
import com.zhijian.domain.aftersales.entity.RefundApply;
import com.zhijian.infrastructure.persistence.mapper.RefundApplyMapper;
import com.zhijian.application.service.RefundService;
import com.zhijian.application.service.OrderService;
import com.zhijian.application.service.UserService;
import com.zhijian.common.context.UserContext;
import com.zhijian.domain.order.entity.Order;
import com.zhijian.domain.user.entity.SysUser;
import lombok.RequiredArgsConstructor;
import com.zhijian.common.event.NotificationEvent;
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
        // 检查订单状态 (1:待发货 2:已发货 3:已完成) 可以申请
        if (order.getStatus() < 1 || order.getStatus() > 3) {
            throw new RuntimeException("当前订单状态不可申请退款");
        }

        // 检查是否已存在处理中的申请
        long count = this.count(new LambdaQueryWrapper<RefundApply>()
                .eq(RefundApply::getOrderId, order.getId())
                .ne(RefundApply::getStatus, 2)); // 排除已拒绝的
        if (count > 0) {
            throw new RuntimeException("已存在处理中的退款申请");
        }

        RefundApply refundApply = new RefundApply();
        BeanUtil.copyProperties(applyDTO, refundApply);
        refundApply.setUserId(userId);
        // 暂时全额退款
        refundApply.setAmount(order.getPayAmount()); 
        refundApply.setStatus(0); // 待审核
        refundApply.setCreateTime(LocalDateTime.now());
        refundApply.setUpdateTime(LocalDateTime.now());
        refundApply.setOriginalOrderStatus(order.getStatus());

        this.save(refundApply);

        // 更新订单状态为 4:售后中
        order.setStatus(4);
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
            // 通过
            refundApply.setStatus(1); // 审核通过
            
            // 调用支付接口退款
            orderService.refundOrder(order.getId(), refundApply.getAmount(), refundApply.getReason());
            
            // 更新订单状态为 5:已退款
            order.setStatus(5);
        } else {
            // 拒绝
            refundApply.setStatus(2); // 审核拒绝
            // 恢复原订单状态
            order.setStatus(refundApply.getOriginalOrderStatus());
        }

        refundApply.setAuditTime(LocalDateTime.now());
        refundApply.setAuditReason(auditDTO.getAuditReason());
        this.updateById(refundApply);
        orderService.updateById(order);

        // 发布通知事件
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
