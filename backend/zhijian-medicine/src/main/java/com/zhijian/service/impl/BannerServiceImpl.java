package com.zhijian.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.BannerService;
import com.zhijian.pojo.medicine.entity.Banner;
import com.zhijian.mapper.BannerMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BannerServiceImpl extends ServiceImpl<BannerMapper, Banner> implements BannerService {

    @Override
    public List<Banner> listEnabled() {
        // 首页只展示启用状态的轮播图，并按排序字段升序排列。
        return this.list(new LambdaQueryWrapper<Banner>()
                .eq(Banner::getStatus, 1)
                .orderByAsc(Banner::getSort));
    }
}
