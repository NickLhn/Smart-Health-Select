package com.zhijian.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.domain.medicine.entity.MedicineComment;
import com.zhijian.interfaces.dto.medicine.MedicineCommentCreateDTO;

/**
 * 药品评价服务接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface MedicineCommentService extends IService<MedicineComment> {
    
    /**
     * 发表评价
     * @param dto 评价信息
     * @return 是否成功
     */
    boolean createComment(MedicineCommentCreateDTO dto);

    /**
     * 分页查询药品评价
     * @param medicineId 药品ID
     * @param page 页码
     * @param size 大小
     * @return 分页结果
     */
    IPage<MedicineComment> pageList(Long medicineId, Integer page, Integer size);

    /**
     * 分页查询用户评价
     * @param userId 用户ID
     * @param page 页码
     * @param size 大小
     * @return 分页结果
     */
    IPage<MedicineComment> pageListByUserId(Long userId, Integer page, Integer size);

    /**
     * 分页查询商家评价
     * @param sellerId 商家ID
     * @param page 页码
     * @param size 大小
     * @return 分页结果
     */
    IPage<MedicineComment> pageListBySellerId(Long sellerId, Integer page, Integer size);

    /**
     * 商家回复评价
     * @param id 评价ID
     * @param content 回复内容
     * @return 是否成功
     */
    boolean replyComment(Long id, String content);
}
