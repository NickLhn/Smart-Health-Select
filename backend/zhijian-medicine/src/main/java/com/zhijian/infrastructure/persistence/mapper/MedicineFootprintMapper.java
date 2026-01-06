package com.zhijian.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.medicine.entity.MedicineFootprint;
import org.apache.ibatis.annotations.Mapper;

/**
 * 药品足迹 Mapper 接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface MedicineFootprintMapper extends BaseMapper<MedicineFootprint> {
}
