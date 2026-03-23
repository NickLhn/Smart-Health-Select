package com.zhijian.marketing.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.marketing.dto.CouponCreateDTO;
import com.zhijian.marketing.pojo.Coupon;

import java.util.List;

/**
 * 优惠券服务接口。
 */
public interface CouponService extends IService<Coupon> {

    /**
     * 创建优惠券。
     *
     * @param createDTO 创建参数
     * @return 创建结果
     */
    Result create(CouponCreateDTO createDTO);

    /**
     * 查询可领取优惠券列表。
     *
     * @param userId 用户 ID
     * @return 优惠券列表
     */
    List<Coupon> listAvailable(Long userId);

    /**
     * 分页查询优惠券。
     *
     * @param page 页码
     * @param size 每页条数
     * @param name 优惠券名称
     * @param type 优惠券类型
     * @param status 优惠券状态
     * @return 分页结果
     */
    IPage<Coupon> pageList(Integer page, Integer size, String name, Integer type, Integer status);

    /**
     * 更新优惠券。
     *
     * @param id 优惠券 ID
     * @param createDTO 更新参数
     * @return 更新结果
     */
    Result update(Long id, CouponCreateDTO createDTO);

    /**
     * 删除优惠券。
     *
     * @param id 优惠券 ID
     * @return 删除结果
     */
    Result delete(Long id);

    /**
     * 更新优惠券状态。
     *
     * @param id 优惠券 ID
     * @param status 优惠券状态
     * @return 更新结果
     */
    Result updateStatus(Long id, Integer status);
}
