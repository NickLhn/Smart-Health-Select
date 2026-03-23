package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.medicine.entity.MedicineFootprint;
import org.apache.ibatis.annotations.Mapper;

/**
 * 药品足迹数据访问接口。
 */
@Mapper
public interface MedicineFootprintMapper extends BaseMapper<MedicineFootprint> {
}
