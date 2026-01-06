package com.zhijian.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.medicine.entity.MedicineFavorite;
import org.apache.ibatis.annotations.Mapper;

/**
 * 药品收藏 Mapper 接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface MedicineFavoriteMapper extends BaseMapper<MedicineFavorite> {
}
