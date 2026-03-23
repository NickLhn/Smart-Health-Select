package com.zhijian.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.HealthArticleService;
import com.zhijian.pojo.medicine.entity.HealthArticle;
import com.zhijian.mapper.HealthArticleMapper;
import org.springframework.stereotype.Service;

/**
 * 健康资讯服务实现类。
 */
@Service
public class HealthArticleServiceImpl extends ServiceImpl<HealthArticleMapper, HealthArticle> implements HealthArticleService {
    // 当前健康资讯服务直接复用 MyBatis-Plus 通用 CRUD 能力。
}
