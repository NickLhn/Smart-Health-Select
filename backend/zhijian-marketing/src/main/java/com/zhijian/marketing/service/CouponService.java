package com.zhijian.marketing.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.marketing.dto.CouponCreateDTO;
import com.zhijian.marketing.pojo.Coupon;

import java.util.List;

public interface CouponService extends IService<Coupon> {
    Result create(CouponCreateDTO createDTO);

    List<Coupon> listAvailable(Long userId);

    IPage<Coupon> pageList(Integer page, Integer size, String name, Integer type, Integer status);

    Result update(Long id, CouponCreateDTO createDTO);

    Result delete(Long id);

    Result updateStatus(Long id, Integer status);
}
