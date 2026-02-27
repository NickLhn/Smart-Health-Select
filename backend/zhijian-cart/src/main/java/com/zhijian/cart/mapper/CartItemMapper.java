package com.zhijian.cart.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.cart.pojo.CartItem;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CartItemMapper extends BaseMapper<CartItem> {
}
