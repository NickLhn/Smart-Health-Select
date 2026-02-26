package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.dto.medicine.MedicineDTO;
import com.zhijian.dto.medicine.MedicineQueryDTO;

import java.util.List;

/**
 * 药品服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface MedicineService extends IService<Medicine> {

    /**
     * 商家发布药品
     * @param dto 药品信息
     * @param sellerId 商家ID
     * @return 成功/失败
     */
    boolean createMedicine(MedicineDTO dto, Long sellerId);

    /**
     * 商家更新药品
     * @param id 药品ID
     * @param dto 药品信息
     * @param sellerId 商家ID (用于鉴权)
     * @return 成功/失败
     */
    boolean updateMedicine(Long id, MedicineDTO dto, Long sellerId);

    /**
     * 分页查询药品列表
     * @param query 查询参数
     * @return 分页结果
     */
    IPage<Medicine> pageList(MedicineQueryDTO query);

    /**
     * 获取药品详情
     * @param id 药品ID
     * @return 药品实体
     */
    Medicine getDetail(Long id);
    
    /**
     * 上下架操作
     * @param id 药品ID
     * @param status 状态 1上架 0下架
     * @param sellerId 商家ID
     * @return 成功/失败
     */
    boolean updateStatus(Long id, Integer status, Long sellerId);

    /**
     * 管理员分页查询药品列表 (不过滤状态)
     * @param query 查询参数
     * @return 分页结果
     */
    IPage<Medicine> pageListAdmin(MedicineQueryDTO query);

    /**
     * 管理员强制上下架
     * @param id 药品ID
     * @param status 状态
     * @return 成功/失败
     */
    boolean updateStatusByAdmin(Long id, Integer status);

    /**
     * 批量上下架 (管理员)
     * @param ids 药品ID列表
     * @param status 状态
     * @return 成功/失败
     */
    boolean batchUpdateStatus(List<Long> ids, Integer status);

    /**
     * 管理员删除药品
     * @param id 药品ID
     * @return 成功/失败
     */
    boolean deleteByAdmin(Long id);

    /**
     * 商家删除药品（逻辑删除）
     *
     * @param id 药品ID
     * @param sellerId 商家ID (用于鉴权)
     * @return 成功/失败
     */
    boolean deleteBySeller(Long id, Long sellerId);

    /**
     * 扣减库存 (Redis Lua 脚本原子操作)
     * @param medicineId 药品ID
     * @param count 扣减数量
     * @return 是否扣减成功
     */
    boolean deductStock(Long medicineId, Integer count);

    /**
     * 恢复库存 (取消订单时调用)
     * @param medicineId 药品ID
     * @param count 恢复数量
     * @return 是否成功
     */
    boolean restoreStock(Long medicineId, Integer count);
}

