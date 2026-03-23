package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.medicine.entity.HealthArticle;
import org.apache.ibatis.annotations.Mapper;

/**
 * 健康资讯数据访问接口。
 */
@Mapper
public interface HealthArticleMapper extends BaseMapper<HealthArticle> {
}
