package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.CartService;
import com.zhijian.application.service.MedicineService;
import com.zhijian.domain.cart.entity.CartItem;
import com.zhijian.domain.medicine.entity.Medicine;
import com.zhijian.infrastructure.persistence.mapper.CartItemMapper;
import com.zhijian.interfaces.dto.cart.CartAddDTO;
import com.zhijian.interfaces.dto.cart.CartItemVO;
import com.zhijian.interfaces.dto.cart.CartUpdateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 购物车服务实现类
 * 提供购物车相关的业务逻辑实现，包括添加商品、更新数量、删除商品、查询列表、清空购物车等功能
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
@RequiredArgsConstructor
public class CartServiceImpl extends ServiceImpl<CartItemMapper, CartItem> implements CartService {

    // 药品服务，用于校验药品信息和库存
    private final MedicineService medicineService;

    /**
     * 添加商品到购物车
     * 执行流程：1.校验药品信息 2.检查购物车是否已有该商品 3.存在则累加数量，不存在则新增记录
     *
     * @param addDTO 添加购物车参数，包含药品ID和数量
     * @param userId 当前用户ID
     * @throws RuntimeException 当药品不存在、已下架、库存不足时抛出异常
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(CartAddDTO addDTO, Long userId) {
        // 1. 校验药品是否存在且状态正常
        Medicine medicine = medicineService.getById(addDTO.getMedicineId());
        if (medicine == null) {
            throw new RuntimeException("药品不存在");
        }
        // 检查药品上架状态（1为上架）
        if (medicine.getStatus() != 1) {
            throw new RuntimeException("药品已下架");
        }
        // 检查库存是否足够
        if (medicine.getStock() < addDTO.getCount()) {
            throw new RuntimeException("库存不足");
        }

        // 2. 查询购物车是否已存在该药品
        CartItem existItem = this.getOne(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .eq(CartItem::getMedicineId, addDTO.getMedicineId()));

        if (existItem != null) {
            // 3. 已存在则累加数量
            existItem.setCount(existItem.getCount() + addDTO.getCount());
            this.updateById(existItem);
        } else {
            // 4. 不存在则新增购物车项
            CartItem cartItem = new CartItem();
            cartItem.setUserId(userId);
            cartItem.setMedicineId(addDTO.getMedicineId());
            cartItem.setCount(addDTO.getCount());
            this.save(cartItem);
        }
    }

    /**
     * 更新购物车商品数量
     *
     * @param updateDTO 更新参数，包含购物车项ID和新的数量
     * @param userId 当前用户ID
     * @throws RuntimeException 当购物车项不存在、无权操作、库存不足时抛出异常
     */
    @Override
    public void updateCount(CartUpdateDTO updateDTO, Long userId) {
        // 获取购物车项
        CartItem cartItem = this.getById(updateDTO.getId());
        if (cartItem == null) {
            throw new RuntimeException("购物车项不存在");
        }
        // 权限校验：只能操作自己的购物车
        if (!cartItem.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作");
        }

        // 校验库存是否足够
        Medicine medicine = medicineService.getById(cartItem.getMedicineId());
        if (medicine != null && medicine.getStock() < updateDTO.getCount()) {
            throw new RuntimeException("库存不足");
        }

        // 更新数量
        cartItem.setCount(updateDTO.getCount());
        this.updateById(cartItem);
    }

    /**
     * 删除购物车项
     * 支持批量删除，当ID列表为空时直接返回
     *
     * @param ids 要删除的购物车项ID列表
     * @param userId 当前用户ID，用于权限验证
     */
    @Override
    public void delete(List<Long> ids, Long userId) {
        // 参数检查：如果ID列表为空则直接返回
        if (ids == null || ids.isEmpty()) {
            return;
        }
        // 删除指定用户下的购物车项
        this.remove(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .in(CartItem::getId, ids));
    }

    /**
     * 查询当前用户的购物车列表
     * 返回购物车项及对应的药品详细信息（名称、图片、价格、库存等）
     *
     * @param userId 当前用户ID
     * @return 购物车项VO列表，包含药品详细信息
     */
    @Override
    public List<CartItemVO> myList(Long userId) {
        // 1. 查询当前用户的购物车列表，按创建时间倒序排列
        List<CartItem> cartItems = this.list(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .orderByDesc(CartItem::getCreateTime));

        // 如果购物车为空，返回空列表
        if (cartItems.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. 批量查询药品信息，减少数据库访问次数
        List<Long> medicineIds = cartItems.stream()
                .map(CartItem::getMedicineId)
                .collect(Collectors.toList());

        List<Medicine> medicines = medicineService.listByIds(medicineIds);
        // 将药品列表转换为Map，便于快速查找
        Map<Long, Medicine> medicineMap = medicines.stream()
                .collect(Collectors.toMap(Medicine::getId, Function.identity()));

        // 3. 组装VO对象，将购物车项和药品信息合并
        return cartItems.stream().map(item -> {
            CartItemVO vo = new CartItemVO();
            // 复制购物车项基本属性
            BeanUtils.copyProperties(item, vo);

            // 补充药品详细信息
            Medicine medicine = medicineMap.get(item.getMedicineId());
            if (medicine != null) {
                vo.setMedicineName(medicine.getName());
                vo.setMedicineImage(medicine.getMainImage());
                vo.setPrice(medicine.getPrice());
                vo.setStock(medicine.getStock());
            }
            return vo;
        }).collect(Collectors.toList());
    }

    /**
     * 清空当前用户的购物车
     *
     * @param userId 当前用户ID
     */
    @Override
    public void clear(Long userId) {
        this.remove(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId));
    }
}