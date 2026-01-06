package com.zhijian.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.order.entity.OrderComment;
import com.zhijian.interfaces.dto.order.OrderCommentCreateDTO;

/**
 * 订单评价服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface OrderCommentService extends IService<OrderComment> {

    /**
     * 发表评价
     * @param createDTO 评价信息
     * @param userId 用户ID
     * @return 结果
     */
    Result comment(OrderCommentCreateDTO createDTO, Long userId);

    /**
     * 获取药品评价列表
     * @param medicineId 药品ID
     * @param page 页码
     * @param size 每页大小
     * @return 评价列表
     */
    IPage<OrderComment> getMedicineComments(Long medicineId, Integer page, Integer size);

    /**
     * 获取我的评价列表
     * @param userId 用户ID
     * @param page 页码
     * @param size 每页大小
     * @return 评价列表
     */
    IPage<OrderComment> getMyComments(Long userId, Integer page, Integer size);
}
