package com.zhijian.application.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.domain.medicine.entity.Banner;

import java.util.List;

/**
 * 轮播图服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface BannerService extends IService<Banner> {

    /**
     * 获取启用状态的轮播图列表
     * @return 轮播图列表
     */
    List<Banner> listEnabled();
}
