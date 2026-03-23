package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.medicine.entity.Medicine;
import org.apache.ibatis.annotations.Mapper;

/**
 * 药品数据访问接口。
 */
@Mapper
public interface MedicineMapper extends BaseMapper<Medicine> {
}
