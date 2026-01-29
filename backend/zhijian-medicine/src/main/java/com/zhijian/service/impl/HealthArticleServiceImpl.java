package com.zhijian.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.HealthArticleService;
import com.zhijian.pojo.medicine.entity.HealthArticle;
import com.zhijian.mapper.HealthArticleMapper;
import org.springframework.stereotype.Service;

@Service
public class HealthArticleServiceImpl extends ServiceImpl<HealthArticleMapper, HealthArticle> implements HealthArticleService {
}

