package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.medicine.entity.Banner;
import org.apache.ibatis.annotations.Mapper;

/**
 * 轮播图数据访问接口。
 */
@Mapper
public interface BannerMapper extends BaseMapper<Banner> {
}
