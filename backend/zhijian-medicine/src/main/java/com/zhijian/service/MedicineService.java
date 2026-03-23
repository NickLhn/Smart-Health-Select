package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.dto.medicine.MedicineDTO;
import com.zhijian.dto.medicine.MedicineQueryDTO;
import com.zhijian.pojo.medicine.entity.Medicine;

import java.util.List;

/**
 * 药品服务接口。
 */
public interface MedicineService extends IService<Medicine> {

    /**
     * 创建药品。
     *
     * @param dto 药品参数
     * @param sellerId 商家 ID
     * @return 是否成功
     */
    boolean createMedicine(MedicineDTO dto, Long sellerId);

    /**
     * 更新药品。
     *
     * @param id 药品 ID
     * @param dto 药品参数
     * @param sellerId 商家 ID
     * @return 是否成功
     */
    boolean updateMedicine(Long id, MedicineDTO dto, Long sellerId);

    /**
     * 分页查询药品列表。
     *
     * @param query 查询参数
     * @return 分页结果
     */
    IPage<Medicine> pageList(MedicineQueryDTO query);

    /**
     * 获取药品详情。
     *
     * @param id 药品 ID
     * @return 药品详情
     */
    Medicine getDetail(Long id);

    /**
     * 更新上下架状态。
     *
     * @param id 药品 ID
     * @param status 状态
     * @param sellerId 商家 ID
     * @return 是否成功
     */
    boolean updateStatus(Long id, Integer status, Long sellerId);

    /**
     * 管理端分页查询药品列表。
     *
     * @param query 查询参数
     * @return 分页结果
     */
    IPage<Medicine> pageListAdmin(MedicineQueryDTO query);

    /**
     * 管理端更新药品状态。
     *
     * @param id 药品 ID
     * @param status 状态
     * @return 是否成功
     */
    boolean updateStatusByAdmin(Long id, Integer status);

    /**
     * 批量更新药品状态。
     *
     * @param ids 药品 ID 列表
     * @param status 状态
     * @return 是否成功
     */
    boolean batchUpdateStatus(List<Long> ids, Integer status);

    /**
     * 管理端删除药品。
     *
     * @param id 药品 ID
     * @return 是否成功
     */
    boolean deleteByAdmin(Long id);

    /**
     * 商家删除药品。
     *
     * @param id 药品 ID
     * @param sellerId 商家 ID
     * @return 是否成功
     */
    boolean deleteBySeller(Long id, Long sellerId);

    /**
     * 扣减库存。
     *
     * @param medicineId 药品 ID
     * @param count 扣减数量
     * @return 是否成功
     */
    boolean deductStock(Long medicineId, Integer count);

    /**
     * 恢复库存。
     *
     * @param medicineId 药品 ID
     * @param count 恢复数量
     * @return 是否成功
     */
    boolean restoreStock(Long medicineId, Integer count);
}
