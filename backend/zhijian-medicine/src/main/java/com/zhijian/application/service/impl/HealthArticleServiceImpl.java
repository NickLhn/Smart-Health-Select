package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.HealthArticleService;
import com.zhijian.domain.medicine.entity.HealthArticle;
import com.zhijian.infrastructure.persistence.mapper.HealthArticleMapper;
import org.springframework.stereotype.Service;

@Service
public class HealthArticleServiceImpl extends ServiceImpl<HealthArticleMapper, HealthArticle> implements HealthArticleService {
}
