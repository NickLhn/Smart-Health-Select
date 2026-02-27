package com.zhijian.cart.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.cart.dto.CartAddDTO;
import com.zhijian.cart.dto.CartItemVO;
import com.zhijian.cart.dto.CartUpdateDTO;
import com.zhijian.cart.pojo.CartItem;

import java.util.List;

public interface CartService extends IService<CartItem> {
    void add(CartAddDTO addDTO, Long userId);

    void updateCount(CartUpdateDTO updateDTO, Long userId);

    void delete(List<Long> ids, Long userId);

    List<CartItemVO> myList(Long userId);

    void clear(Long userId);
}
