package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.medicine.entity.MedicineFootprint;
import com.zhijian.pojo.medicine.entity.Medicine;

/**
 * 药品足迹服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface MedicineFootprintService extends IService<MedicineFootprint> {

    /**
     * 记录足迹
     * @param userId 用户ID
     * @param medicineId 药品ID
     */
    void record(Long userId, Long medicineId);

    /**
     * 获取我的足迹列表
     * @param userId 用户ID
     * @param page 页码
     * @param size 每页大小
     * @return 包含药品信息的足迹列表
     */
    IPage<Medicine> myFootprints(Long userId, Integer page, Integer size);
}

