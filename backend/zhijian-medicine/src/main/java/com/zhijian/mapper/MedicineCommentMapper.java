package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.pojo.medicine.entity.MedicineComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 药品评价数据访问接口。
 */
@Mapper
public interface MedicineCommentMapper extends BaseMapper<MedicineComment> {

    /**
     * 根据商家 ID 分页查询评价。
     *
     * @param page 分页参数
     * @param sellerId 商家 ID
     * @return 评价分页结果
     */
    @Select("SELECT c.* FROM pms_medicine_comment c " +
            "LEFT JOIN pms_medicine m ON c.medicine_id = m.id " +
            "WHERE m.seller_id = #{sellerId} " +
            "ORDER BY c.create_time DESC")
    IPage<MedicineComment> selectPageBySellerId(IPage<MedicineComment> page, @Param("sellerId") Long sellerId);

    /**
     * 根据用户 ID 分页查询评价。
     *
     * @param page 分页参数
     * @param userId 用户 ID
     * @return 评价分页结果
     */
    @Select("SELECT c.*, m.name as medicine_name, m.main_image as medicine_image " +
            "FROM pms_medicine_comment c " +
            "LEFT JOIN pms_medicine m ON c.medicine_id = m.id " +
            "WHERE c.user_id = #{userId} " +
            "ORDER BY c.create_time DESC")
    IPage<MedicineComment> selectPageByUserId(IPage<MedicineComment> page, @Param("userId") Long userId);
}
