package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.marketing.entity.Coupon;
import org.apache.ibatis.annotations.Mapper;

/**
 * 优惠券 Mapper 接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface CouponMapper extends BaseMapper<Coupon> {
}

