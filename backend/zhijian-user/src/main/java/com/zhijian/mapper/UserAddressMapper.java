package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.user.entity.UserAddress;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户收货地址Mapper接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface UserAddressMapper extends BaseMapper<UserAddress> {
}

