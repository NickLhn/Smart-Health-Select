package com.zhijian.cart.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.cart.dto.CartAddDTO;
import com.zhijian.cart.dto.CartItemVO;
import com.zhijian.cart.dto.CartUpdateDTO;
import com.zhijian.cart.mapper.CartItemMapper;
import com.zhijian.cart.pojo.CartItem;
import com.zhijian.cart.service.CartService;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.service.MedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl extends ServiceImpl<CartItemMapper, CartItem> implements CartService {

    private final MedicineService medicineService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(CartAddDTO addDTO, Long userId) {
        // 加购前先校验药品是否存在、是否上架、库存是否足够。
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

        CartItem existItem = this.getOne(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .eq(CartItem::getMedicineId, addDTO.getMedicineId()));

        if (existItem != null) {
            // 已存在相同商品时直接累加数量。
            existItem.setCount(existItem.getCount() + addDTO.getCount());
            this.updateById(existItem);
            return;
        }

        CartItem cartItem = new CartItem();
        cartItem.setUserId(userId);
        cartItem.setMedicineId(addDTO.getMedicineId());
        cartItem.setCount(addDTO.getCount());
        this.save(cartItem);
    }

    @Override
    public void updateCount(CartUpdateDTO updateDTO, Long userId) {
        // 修改数量时必须校验购物车项归属和最新库存。
        CartItem cartItem = this.getById(updateDTO.getId());
        if (cartItem == null) {
            throw new RuntimeException("购物车项不存在");
        }
        if (!cartItem.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作");
        }

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
        List<CartItem> cartItems = this.list(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .orderByDesc(CartItem::getCreateTime));

        if (cartItems.isEmpty()) {
            return new ArrayList<>();
        }

        // 批量查药品信息，再映射成前端展示用的购物车 VO。
        List<Long> medicineIds = cartItems.stream()
                .map(CartItem::getMedicineId)
                .collect(Collectors.toList());

        List<Medicine> medicines = medicineService.listByIds(medicineIds);
        Map<Long, Medicine> medicineMap = medicines.stream()
                .collect(Collectors.toMap(Medicine::getId, Function.identity()));

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
        // 清空购物车本质上是删除当前用户全部购物车项。
        this.remove(new LambdaQueryWrapper<CartItem>().eq(CartItem::getUserId, userId));
    }
}
