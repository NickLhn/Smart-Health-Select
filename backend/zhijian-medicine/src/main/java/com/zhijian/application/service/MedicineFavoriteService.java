package com.zhijian.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.medicine.entity.MedicineFavorite;
import com.zhijian.interfaces.dto.medicine.MedicineDTO;

/**
 * 药品收藏服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface MedicineFavoriteService extends IService<MedicineFavorite> {

    /**
     * 收藏/取消收藏
     * @param medicineId 药品ID
     * @param userId 用户ID
     * @return 结果
     */
    Result toggle(Long medicineId, Long userId);

    /**
     * 是否已收藏
     * @param medicineId 药品ID
     * @param userId 用户ID
     * @return 结果
     */
    boolean isFavorite(Long medicineId, Long userId);

    /**
     * 获取我的收藏列表
     * @param userId 用户ID
     * @param page 页码
     * @param size 每页大小
     * @return 收藏列表
     */
    IPage<Object> myList(Long userId, Integer page, Integer size);
}
