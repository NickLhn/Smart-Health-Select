package com.zhijian.marketing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.marketing.pojo.Coupon;
import org.apache.ibatis.annotations.Mapper;

/**
 * 优惠券数据访问接口。
 */
@Mapper
public interface CouponMapper extends BaseMapper<Coupon> {
}
