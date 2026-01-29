package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.medicine.entity.Medicine;
import org.apache.ibatis.annotations.Mapper;

/**
 * 药品表 Mapper 接口
 * 
 * @author TraeAI
 * @since 1.0.0
 */
@Mapper
public interface MedicineMapper extends BaseMapper<Medicine> {
}

