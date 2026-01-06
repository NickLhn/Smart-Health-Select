package com.zhijian.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.medicine.entity.HealthArticle;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HealthArticleMapper extends BaseMapper<HealthArticle> {
}
