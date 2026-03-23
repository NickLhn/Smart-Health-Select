package com.zhijian.cart.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.cart.dto.CartAddDTO;
import com.zhijian.cart.dto.CartItemVO;
import com.zhijian.cart.dto.CartUpdateDTO;
import com.zhijian.cart.pojo.CartItem;

import java.util.List;

/**
 * 购物车服务接口。
 */
public interface CartService extends IService<CartItem> {

    /**
     * 添加购物车项。
     *
     * @param addDTO 加购参数
     * @param userId 用户 ID
     */
    void add(CartAddDTO addDTO, Long userId);

    /**
     * 更新购物车商品数量。
     *
     * @param updateDTO 更新参数
     * @param userId 用户 ID
     */
    void updateCount(CartUpdateDTO updateDTO, Long userId);

    /**
     * 删除购物车项。
     *
     * @param ids 购物车项 ID 列表
     * @param userId 用户 ID
     */
    void delete(List<Long> ids, Long userId);

    /**
     * 查询当前用户的购物车列表。
     *
     * @param userId 用户 ID
     * @return 购物车列表
     */
    List<CartItemVO> myList(Long userId);

    /**
     * 清空当前用户的购物车。
     *
     * @param userId 用户 ID
     */
    void clear(Long userId);
}
