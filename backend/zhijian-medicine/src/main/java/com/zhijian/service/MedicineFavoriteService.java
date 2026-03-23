package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.medicine.entity.MedicineFavorite;

/**
 * 药品收藏服务接口。
 */
public interface MedicineFavoriteService extends IService<MedicineFavorite> {

    /**
     * 收藏或取消收藏。
     *
     * @param medicineId 药品 ID
     * @param userId 用户 ID
     * @return 操作结果
     */
    Result toggle(Long medicineId, Long userId);

    /**
     * 判断是否已收藏。
     *
     * @param medicineId 药品 ID
     * @param userId 用户 ID
     * @return 是否已收藏
     */
    boolean isFavorite(Long medicineId, Long userId);

    /**
     * 查询我的收藏列表。
     *
     * @param userId 用户 ID
     * @param page 页码
     * @param size 每页大小
     * @return 收藏分页结果
     */
    IPage<Object> myList(Long userId, Integer page, Integer size);
}
