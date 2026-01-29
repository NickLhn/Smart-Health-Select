package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.cart.entity.CartItem;
import org.apache.ibatis.annotations.Mapper;

/**
 * 购物车 Mapper 接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface CartItemMapper extends BaseMapper<CartItem> {
}

