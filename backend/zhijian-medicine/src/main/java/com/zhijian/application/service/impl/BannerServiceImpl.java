package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.BannerService;
import com.zhijian.domain.medicine.entity.Banner;
import com.zhijian.infrastructure.persistence.mapper.BannerMapper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 轮播图服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
public class BannerServiceImpl extends ServiceImpl<BannerMapper, Banner> implements BannerService {

    @Override
    public List<Banner> listEnabled() {
        return this.list(new LambdaQueryWrapper<Banner>()
                .eq(Banner::getStatus, 1)
                .orderByAsc(Banner::getSort));
    }
}
