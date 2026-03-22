package com.zhijian.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.OrderCommentService;
import com.zhijian.service.OrderService;
import com.zhijian.user.service.UserService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.Order;
import com.zhijian.pojo.OrderComment;
import com.zhijian.pojo.user.entity.SysUser;
import com.zhijian.mapper.OrderCommentMapper;
import com.zhijian.dto.order.OrderCommentCreateDTO;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderCommentServiceImpl extends ServiceImpl<OrderCommentMapper, OrderComment> implements OrderCommentService {

    @Resource
    private OrderService orderService;

    @Resource
    private UserService userService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result comment(OrderCommentCreateDTO createDTO, Long userId) {
        // 只有订单本人且订单已完成时，才允许发表评论。
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

        // 评价里冗余存储昵称和头像，方便前端直接展示评论列表。
        SysUser user = userService.getById(userId);
        String userName = (user != null && user.getNickname() != null) ? user.getNickname() : "匿名用户";
        String userAvatar = (user != null) ? user.getAvatar() : null;

        // 创建评价记录。
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

        // 订单侧同步标记为“已评价”，避免重复评价。
        order.setCommentStatus(1);
        orderService.updateById(order);

        return Result.success(null, "评价成功");
    }

    @Override
    public IPage<OrderComment> getMedicineComments(Long medicineId, Integer page, Integer size) {
        Page<OrderComment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<OrderComment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderComment::getMedicineId, medicineId)
                // 仅展示正常状态的评价。
                .eq(OrderComment::getStatus, 0)
                .orderByDesc(OrderComment::getCreateTime);
        return this.page(pageParam, wrapper);
    }

    @Override
    public IPage<OrderComment> getMyComments(Long userId, Integer page, Integer size) {
        Page<OrderComment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<OrderComment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderComment::getUserId, userId)
                .orderByDesc(OrderComment::getCreateTime);
        return this.page(pageParam, wrapper);
    }
}
