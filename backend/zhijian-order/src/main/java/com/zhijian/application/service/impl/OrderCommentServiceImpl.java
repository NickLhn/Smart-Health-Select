package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.OrderCommentService;
import com.zhijian.application.service.OrderService;
import com.zhijian.application.service.UserService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.order.entity.Order;
import com.zhijian.domain.order.entity.OrderComment;
import com.zhijian.domain.user.entity.SysUser;
import com.zhijian.infrastructure.persistence.mapper.OrderCommentMapper;
import com.zhijian.interfaces.dto.order.OrderCommentCreateDTO;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/**
 * 订单评价服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
public class OrderCommentServiceImpl extends ServiceImpl<OrderCommentMapper, OrderComment> implements OrderCommentService {

    @Resource
    private OrderService orderService;

    @Resource
    private UserService userService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result comment(OrderCommentCreateDTO createDTO, Long userId) {
        // 1. 获取订单
        Order order = orderService.getById(createDTO.getOrderId());
        if (order == null) {
            return Result.failed("订单不存在");
        }
        if (!order.getUserId().equals(userId)) {
            return Result.failed("无权评价该订单");
        }
        if (order.getStatus() != 3) {
            return Result.failed("订单未完成，无法评价");
        }
        if (order.getCommentStatus() != null && order.getCommentStatus() == 1) {
            return Result.failed("该订单已评价");
        }

        // 2. 获取用户信息
        SysUser user = userService.getById(userId);
        String userName = (user != null && user.getNickname() != null) ? user.getNickname() : "匿名用户";
        String userAvatar = (user != null) ? user.getAvatar() : null;

        // 3. 创建评价
        OrderComment comment = new OrderComment();
        comment.setOrderId(order.getId());
        comment.setUserId(userId);
        comment.setUserName(userName);
        comment.setUserAvatar(userAvatar);
        comment.setMedicineId(order.getMedicineId());
        comment.setRating(createDTO.getRating());
        comment.setContent(createDTO.getContent());
        comment.setImages(createDTO.getImages());
        comment.setStatus(0); // 默认显示

        this.save(comment);

        // 4. 更新订单评价状态
        order.setCommentStatus(1);
        orderService.updateById(order);

        return Result.success(null, "评价成功");
    }

    @Override
    public IPage<OrderComment> getMedicineComments(Long medicineId, Integer page, Integer size) {
        Page<OrderComment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<OrderComment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderComment::getMedicineId, medicineId)
                .eq(OrderComment::getStatus, 0) // 只显示状态正常的评价
                .orderByDesc(OrderComment::getCreateTime);
        return this.page(pageParam, wrapper);
    }

    @Override
    /**
     * 获取我的评价列表
     *
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页大小
     * @return 评价分页数据
     */
    public IPage<OrderComment> getMyComments(Long userId, Integer page, Integer size) {
        Page<OrderComment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<OrderComment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderComment::getUserId, userId)
                .orderByDesc(OrderComment::getCreateTime);
        return this.page(pageParam, wrapper);
    }
}
