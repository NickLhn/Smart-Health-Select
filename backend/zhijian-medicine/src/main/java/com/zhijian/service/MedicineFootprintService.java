package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.pojo.medicine.entity.MedicineFootprint;

/**
 * 药品足迹服务接口。
 */
public interface MedicineFootprintService extends IService<MedicineFootprint> {

    /**
     * 记录足迹。
     *
     * @param userId 用户 ID
     * @param medicineId 药品 ID
     */
    void record(Long userId, Long medicineId);

    /**
     * 查询我的足迹列表。
     *
     * @param userId 用户 ID
     * @param page 页码
     * @param size 每页大小
     * @return 足迹分页结果
     */
    IPage<Medicine> myFootprints(Long userId, Integer page, Integer size);
}
