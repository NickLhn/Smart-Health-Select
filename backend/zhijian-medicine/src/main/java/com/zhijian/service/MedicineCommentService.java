package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.dto.medicine.MedicineCommentCreateDTO;
import com.zhijian.pojo.medicine.entity.MedicineComment;

/**
 * 药品评价服务接口。
 */
public interface MedicineCommentService extends IService<MedicineComment> {

    /**
     * 创建评价。
     *
     * @param dto 评价参数
     * @return 是否成功
     */
    boolean createComment(MedicineCommentCreateDTO dto);

    /**
     * 分页查询药品评价。
     *
     * @param medicineId 药品 ID
     * @param page 页码
     * @param size 每页大小
     * @return 分页结果
     */
    IPage<MedicineComment> pageList(Long medicineId, Integer page, Integer size);

    /**
     * 分页查询用户评价。
     *
     * @param userId 用户 ID
     * @param page 页码
     * @param size 每页大小
     * @return 分页结果
     */
    IPage<MedicineComment> pageListByUserId(Long userId, Integer page, Integer size);

    /**
     * 分页查询商家评价。
     *
     * @param sellerId 商家 ID
     * @param page 页码
     * @param size 每页大小
     * @return 分页结果
     */
    IPage<MedicineComment> pageListBySellerId(Long sellerId, Integer page, Integer size);

    /**
     * 回复评价。
     *
     * @param id 评价 ID
     * @param content 回复内容
     * @return 是否成功
     */
    boolean replyComment(Long id, String content);
}
