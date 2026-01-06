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
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
@RequiredArgsConstructor
public class CartServiceImpl extends ServiceImpl<CartItemMapper, CartItem> implements CartService {

    private final MedicineService medicineService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(CartAddDTO addDTO, Long userId) {
        // 1. 校验药品是否存在
        Medicine medicine = medicineService.getById(addDTO.getMedicineId());
        if (medicine == null) {
            throw new RuntimeException("药品不存在");
        }
        if (medicine.getStatus() != 1) {
            throw new RuntimeException("药品已下架");
        }
        if (medicine.getStock() < addDTO.getCount()) {
            throw new RuntimeException("库存不足");
        }

        // 2. 查询购物车是否已存在该商品
        CartItem existItem = this.getOne(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .eq(CartItem::getMedicineId, addDTO.getMedicineId()));

        if (existItem != null) {
            // 3. 存在则累加数量
            existItem.setCount(existItem.getCount() + addDTO.getCount());
            this.updateById(existItem);
        } else {
            // 4. 不存在则新增
            CartItem cartItem = new CartItem();
            cartItem.setUserId(userId);
            cartItem.setMedicineId(addDTO.getMedicineId());
            cartItem.setCount(addDTO.getCount());
            this.save(cartItem);
        }
    }

    @Override
    public void updateCount(CartUpdateDTO updateDTO, Long userId) {
        CartItem cartItem = this.getById(updateDTO.getId());
        if (cartItem == null) {
            throw new RuntimeException("购物车项不存在");
        }
        if (!cartItem.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作");
        }
        
        // 校验库存
        Medicine medicine = medicineService.getById(cartItem.getMedicineId());
        if (medicine != null && medicine.getStock() < updateDTO.getCount()) {
            throw new RuntimeException("库存不足");
        }

        cartItem.setCount(updateDTO.getCount());
        this.updateById(cartItem);
    }

    @Override
    public void delete(List<Long> ids, Long userId) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        this.remove(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .in(CartItem::getId, ids));
    }

    @Override
    public List<CartItemVO> myList(Long userId) {
        // 1. 查询购物车列表
        List<CartItem> cartItems = this.list(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .orderByDesc(CartItem::getCreateTime));
        
        if (cartItems.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. 批量查询药品信息
        List<Long> medicineIds = cartItems.stream()
                .map(CartItem::getMedicineId)
                .collect(Collectors.toList());
        
        List<Medicine> medicines = medicineService.listByIds(medicineIds);
        Map<Long, Medicine> medicineMap = medicines.stream()
                .collect(Collectors.toMap(Medicine::getId, Function.identity()));

        // 3. 组装 VO
        return cartItems.stream().map(item -> {
            CartItemVO vo = new CartItemVO();
            BeanUtils.copyProperties(item, vo);
            
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

    @Override
    public void clear(Long userId) {
        this.remove(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId));
    }
}
