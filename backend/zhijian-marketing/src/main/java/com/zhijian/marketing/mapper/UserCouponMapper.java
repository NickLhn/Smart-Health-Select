package com.zhijian.marketing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.marketing.pojo.UserCoupon;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户优惠券数据访问接口。
 */
@Mapper
public interface UserCouponMapper extends BaseMapper<UserCoupon> {
}
