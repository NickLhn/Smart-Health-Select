package com.zhijian.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.common.result.Result;
import com.zhijian.dto.order.OrderCommentCreateDTO;
import com.zhijian.mapper.OrderCommentMapper;
import com.zhijian.pojo.Order;
import com.zhijian.pojo.OrderComment;
import com.zhijian.pojo.user.entity.SysUser;
import com.zhijian.service.OrderCommentService;
import com.zhijian.service.OrderService;
import com.zhijian.user.service.UserService;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 订单评价服务实现类。
 */
@Service
public class OrderCommentServiceImpl extends ServiceImpl<OrderCommentMapper, OrderComment> implements OrderCommentService {

    /**
     * 订单业务服务。
     */
    @Resource
    private OrderService orderService;

    /**
     * 用户业务服务。
     */
    @Resource
    private UserService userService;

    /**
     * 发表评论。
     *
     * @param createDTO 评价参数
     * @param userId 用户 ID
     * @return 操作结果
     */
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

        // 昵称和头像做冗余存储，前端展示评价列表时不需要再回查用户表。
        SysUser user = userService.getById(userId);
        String userName = (user != null && user.getNickname() != null) ? user.getNickname() : "匿名用户";
        String userAvatar = (user != null) ? user.getAvatar() : null;

        OrderComment comment = new OrderComment();
        comment.setOrderId(order.getId());
        comment.setUserId(userId);
        comment.setUserName(userName);
        comment.setUserAvatar(userAvatar);
        comment.setMedicineId(order.getMedicineId());
        comment.setRating(createDTO.getRating());
        comment.setContent(createDTO.getContent());
        comment.setImages(createDTO.getImages());
        comment.setStatus(0);

        this.save(comment);

        // 订单侧同步标记为已评价，防止重复发表评论。
        order.setCommentStatus(1);
        orderService.updateById(order);

        return Result.success(null, "评价成功");
    }

    /**
     * 获取药品评价列表。
     *
     * @param medicineId 药品 ID
     * @param page 页码
     * @param size 每页大小
     * @return 评价分页结果
     */
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

    /**
     * 获取我的评价列表。
     *
     * @param userId 用户 ID
     * @param page 页码
     * @param size 每页大小
     * @return 评价分页结果
     */
    @Override
    public IPage<OrderComment> getMyComments(Long userId, Integer page, Integer size) {
        Page<OrderComment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<OrderComment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderComment::getUserId, userId)
                .orderByDesc(OrderComment::getCreateTime);
        return this.page(pageParam, wrapper);
    }
}
