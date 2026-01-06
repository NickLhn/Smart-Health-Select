package com.zhijian.application.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.domain.cart.entity.CartItem;
import com.zhijian.interfaces.dto.cart.CartAddDTO;
import com.zhijian.interfaces.dto.cart.CartItemVO;
import com.zhijian.interfaces.dto.cart.CartUpdateDTO;

import java.util.List;

/**
 * 购物车服务接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface CartService extends IService<CartItem> {

    /**
     * 添加购物车
     */
    void add(CartAddDTO addDTO, Long userId);

    /**
     * 更新购物车数量
     */
    void updateCount(CartUpdateDTO updateDTO, Long userId);

    /**
     * 删除购物车项
     */
    void delete(List<Long> ids, Long userId);

    /**
     * 获取我的购物车列表
     */
    List<CartItemVO> myList(Long userId);
    
    /**
     * 清空购物车 (下单后调用)
     */
    void clear(Long userId);
}
