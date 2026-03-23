package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.dto.order.OrderCommentCreateDTO;
import com.zhijian.pojo.OrderComment;

/**
 * 订单评价服务接口。
 */
public interface OrderCommentService extends IService<OrderComment> {

    /**
     * 发表评论。
     *
     * @param createDTO 评价参数
     * @param userId 用户 ID
     * @return 操作结果
     */
    Result comment(OrderCommentCreateDTO createDTO, Long userId);

    /**
     * 获取药品评价列表。
     *
     * @param medicineId 药品 ID
     * @param page 页码
     * @param size 每页大小
     * @return 评价分页结果
     */
    IPage<OrderComment> getMedicineComments(Long medicineId, Integer page, Integer size);

    /**
     * 获取我的评价列表。
     *
     * @param userId 用户 ID
     * @param page 页码
     * @param size 每页大小
     * @return 评价分页结果
     */
    IPage<OrderComment> getMyComments(Long userId, Integer page, Integer size);
}
