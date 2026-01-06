package com.zhijian.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.marketing.entity.UserCoupon;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户优惠券 Mapper 接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface UserCouponMapper extends BaseMapper<UserCoupon> {
}
