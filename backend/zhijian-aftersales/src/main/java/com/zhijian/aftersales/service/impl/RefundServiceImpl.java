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

/**
 * 退款申请服务实现类。
 */
@Service
@RequiredArgsConstructor
public class RefundServiceImpl extends ServiceImpl<RefundApplyMapper, RefundApply> implements RefundService {

    /**
     * 订单业务服务。
     */
    private final OrderService orderService;

    /**
     * 用户业务服务。
     */
    private final UserService userService;

    /**
     * 应用事件发布器。
     */
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 提交退款申请。
     * <p>
     * 校验订单归属、订单状态和重复申请后，创建退款申请并同步更新订单状态。
     *
     * @param applyDTO 退款申请参数
     * @return 申请结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean applyRefund(RefundApplyDTO applyDTO) {
        Long userId = UserContext.getUserId();

        // 售后申请必须绑定当前用户自己的订单，避免越权提交退款。
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

        // 同一订单只允许存在一条处理中退款申请。
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

        // 提交申请后先把订单切到售后中，避免继续走正常履约流程。
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

    /**
     * 审核退款申请。
     * <p>
     * 审核通过时执行退款流程并更新订单状态，审核拒绝时恢复订单原始状态。
     *
     * @param auditDTO 退款审核参数
     * @return 审核结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean auditRefund(RefundAuditDTO auditDTO) {
        RefundApply refundApply = this.getById(auditDTO.getId());
        if (refundApply == null) {
            throw new RuntimeException("退款申请不存在");
        }

        // 只有待审核状态允许进入审核流转，防止重复处理。
        if (refundApply.getStatus() != 0) {
            throw new RuntimeException("该申请已处理");
        }

        Order order = orderService.getById(refundApply.getOrderId());
        if (order == null) {
            throw new RuntimeException("关联订单不存在");
        }

        if (auditDTO.getPass()) {
            // 审核通过后走退款逻辑，并把订单状态改成已退款。
            refundApply.setStatus(1);
            orderService.refundOrder(order.getId(), refundApply.getAmount(), refundApply.getReason());
            order.setStatus(5);
        } else {
            // 审核拒绝时恢复订单申请前的原始状态。
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

    /**
     * 分页查询退款申请详情。
     * <p>
     * 在分页结果中补充订单编号和申请用户名，便于管理端展示。
     *
     * @param page 分页参数
     * @param status 申请状态
     * @return 退款申请分页结果
     */
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

        // 批量查订单和用户，避免列表展示时逐条联查。
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
            // 列表接口额外补充订单号和用户名，便于管理端直接展示。
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
