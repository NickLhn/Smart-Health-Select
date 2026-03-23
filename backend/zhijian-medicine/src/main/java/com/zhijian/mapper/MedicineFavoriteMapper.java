package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.medicine.entity.MedicineFavorite;
import org.apache.ibatis.annotations.Mapper;

/**
 * 药品收藏数据访问接口。
 */
@Mapper
public interface MedicineFavoriteMapper extends BaseMapper<MedicineFavorite> {
}
