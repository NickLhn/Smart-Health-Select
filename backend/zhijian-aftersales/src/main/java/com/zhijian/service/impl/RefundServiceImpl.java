package com.zhijian.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.event.NotificationEvent;
import com.zhijian.pojo.aftersales.entity.RefundApply;
import com.zhijian.pojo.Order;
import com.zhijian.pojo.user.entity.SysUser;
import com.zhijian.mapper.RefundApplyMapper;
import com.zhijian.dto.aftersales.RefundApplyDTO;
import com.zhijian.dto.aftersales.RefundAuditDTO;
import com.zhijian.service.OrderService;
import com.zhijian.service.RefundService;
import com.zhijian.service.UserService;
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
 * 退款服务实现类
 * 处理退款申请、审核及相关业务逻辑
 * @author Liuhaonan
 * @since 2025-12-28
 */
@Service
@RequiredArgsConstructor
public class RefundServiceImpl extends ServiceImpl<RefundApplyMapper, RefundApply> implements RefundService {

    // 依赖注入的服务组件
    private final OrderService orderService;           // 订单服务
    private final UserService userService;             // 用户服务
    private final ApplicationEventPublisher eventPublisher; // 事件发布器

    /**
     * 提交退款申请
     *
     * @param applyDTO 退款申请数据传输对象
     * @return 操作是否成功
     * @throws RuntimeException 当订单不存在、无权操作、状态不符或已存在处理中申请时抛出
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean applyRefund(RefundApplyDTO applyDTO) {
        // 获取当前用户ID
        Long userId = UserContext.getUserId();

        // 验证订单信息
        Order order = orderService.getById(applyDTO.getOrderId());
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作此订单");
        }

        // 验证订单状态：1-待发货、2-已发货、3-已完成 可以申请退款
        if (order.getStatus() < 1 || order.getStatus() > 3) {
            throw new RuntimeException("当前订单状态不可申请退款");
        }

        // 检查是否已存在处理中的退款申请（排除已拒绝的）
        long count = this.count(new LambdaQueryWrapper<RefundApply>()
                .eq(RefundApply::getOrderId, order.getId())
                .ne(RefundApply::getStatus, 2)); // 状态2为已拒绝
        if (count > 0) {
            throw new RuntimeException("已存在处理中的退款申请");
        }

        // 创建退款申请记录
        RefundApply refundApply = new RefundApply();
        BeanUtil.copyProperties(applyDTO, refundApply); // 复制DTO属性
        refundApply.setUserId(userId);
        refundApply.setAmount(order.getPayAmount());    // 暂定全额退款，实际可根据业务调整
        refundApply.setStatus(0);                       // 0-待审核状态
        refundApply.setCreateTime(LocalDateTime.now());
        refundApply.setUpdateTime(LocalDateTime.now());
        refundApply.setOriginalOrderStatus(order.getStatus()); // 记录原订单状态用于恢复

        this.save(refundApply);

        // 更新订单状态为4-售后中
        order.setStatus(4);
        order.setRefundReason(applyDTO.getReason());
        orderService.updateById(order);

        // 发布退款申请提交通知事件
        eventPublisher.publishEvent(new NotificationEvent(
                order.getUserId(),
                "您的退款申请已提交，请耐心等待审核",
                "REFUND_APPLIED",
                refundApply.getId()
        ));

        return true;
    }

    /**
     * 审核退款申请
     *
     * @param auditDTO 退款审核数据传输对象
     * @return 操作是否成功
     * @throws RuntimeException 当申请不存在、已处理或关联订单不存在时抛出
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean auditRefund(RefundAuditDTO auditDTO) {
        // 获取退款申请记录
        RefundApply refundApply = this.getById(auditDTO.getId());
        if (refundApply == null) {
            throw new RuntimeException("退款申请不存在");
        }
        if (refundApply.getStatus() != 0) {
            throw new RuntimeException("该申请已处理");
        }

        // 获取关联订单
        Order order = orderService.getById(refundApply.getOrderId());
        if (order == null) {
            throw new RuntimeException("关联订单不存在");
        }

        if (auditDTO.getPass()) {
            // 审核通过逻辑
            refundApply.setStatus(1); // 1-审核通过

            // 调用支付接口执行退款操作
            orderService.refundOrder(order.getId(), refundApply.getAmount(), refundApply.getReason());

            // 更新订单状态为5-已退款
            order.setStatus(5);
        } else {
            // 审核拒绝逻辑
            refundApply.setStatus(2); // 2-审核拒绝

            // 恢复订单到原始状态
            order.setStatus(refundApply.getOriginalOrderStatus());
        }

        // 更新审核信息
        refundApply.setAuditTime(LocalDateTime.now());
        refundApply.setAuditReason(auditDTO.getAuditReason());
        this.updateById(refundApply);
        orderService.updateById(order);

        // 发布审核结果通知事件
        String type = auditDTO.getPass() ? "REFUND_APPROVED" : "REFUND_REJECTED";
        eventPublisher.publishEvent(new NotificationEvent(
                refundApply.getUserId(),
                auditDTO.getPass() ?
                        "您的退款申请已通过" :
                        "您的退款申请已被拒绝，原因: " + auditDTO.getAuditReason(),
                type,
                refundApply.getId()
        ));

        return true;
    }

    /**
     * 分页查询退款申请（带详细信息）
     *
     * @param page 分页参数
     * @param status 退款状态（可选过滤条件）
     * @return 包含订单号和用户名的分页结果
     */
    @Override
    public IPage<RefundApply> pageWithDetail(IPage<RefundApply> page, Integer status) {
        // 构建查询条件
        LambdaQueryWrapper<RefundApply> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(RefundApply::getStatus, status);
        }
        wrapper.orderByDesc(RefundApply::getCreateTime); // 按创建时间倒序

        // 执行分页查询
        IPage<RefundApply> result = this.page(page, wrapper);

        // 如果查询结果为空，直接返回
        if (result.getRecords().isEmpty()) {
            return result;
        }

        // 提取所有订单ID和用户ID用于批量查询
        List<Long> orderIds = result.getRecords().stream()
                .map(RefundApply::getOrderId)
                .collect(Collectors.toList());
        List<Long> userIds = result.getRecords().stream()
                .map(RefundApply::getUserId)
                .collect(Collectors.toList());

        // 批量查询订单信息并建立映射
        Map<Long, Order> orderMap = new HashMap<>();
        if (!orderIds.isEmpty()) {
            List<Order> orders = orderService.listByIds(orderIds);
            orderMap = orders.stream().collect(Collectors.toMap(Order::getId, o -> o));
        }

        // 批量查询用户信息并建立映射
        Map<Long, SysUser> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<SysUser> users = userService.listByIds(userIds);
            userMap = users.stream().collect(Collectors.toMap(SysUser::getId, u -> u));
        }

        // 补充每条记录的订单号和用户名
        for (RefundApply apply : result.getRecords()) {
            Order order = orderMap.get(apply.getOrderId());
            if (order != null) {
                apply.setOrderNo(order.getOrderNo()); // 设置订单号
            }
            SysUser user = userMap.get(apply.getUserId());
            if (user != null) {
                apply.setUsername(user.getUsername()); // 设置用户名
            }
        }

        return result;
    }
}
