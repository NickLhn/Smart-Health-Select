package com.zhijian.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.marketing.entity.Coupon;
import com.zhijian.dto.CouponCreateDTO;

import com.baomidou.mybatisplus.core.metadata.IPage;

import java.util.List;

/**
 * 优惠券服务接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface CouponService extends IService<Coupon> {

    /**
     * 创建优惠券
     */
    Result create(CouponCreateDTO createDTO);

    /**
     * 获取可领取的优惠券列表
     */
    List<Coupon> listAvailable(Long userId);

    /**
     * 分页查询优惠券 (管理端)
     */
    IPage<Coupon> pageList(Integer page, Integer size, String name, Integer type, Integer status);

    /**
     * 更新优惠券
     */
    Result update(Long id, CouponCreateDTO createDTO);

    /**
     * 删除优惠券
     */
    Result delete(Long id);

    /**
     * 更新状态
     */
    Result updateStatus(Long id, Integer status);
}

