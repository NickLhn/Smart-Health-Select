package com.zhijian.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.medicine.entity.Category;
import org.apache.ibatis.annotations.Mapper;

/**
 * 药品分类Mapper接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface CategoryMapper extends BaseMapper<Category> {
}
