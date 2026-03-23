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

/**
 * 购物车服务实现类。
 */
@Service
@RequiredArgsConstructor
public class CartServiceImpl extends ServiceImpl<CartItemMapper, CartItem> implements CartService {

    /**
     * 药品业务服务。
     */
    private final MedicineService medicineService;

    /**
     * 添加购物车项。
     * <p>
     * 添加前会校验药品状态和库存，并对已存在的购物车项执行数量累加。
     *
     * @param addDTO 加购参数
     * @param userId 用户 ID
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(CartAddDTO addDTO, Long userId) {
        // 加购前要同时校验药品是否存在、是否上架以及库存是否充足。
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
            // 购物车里已有同商品时直接累加数量，避免插入重复行。
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

    /**
     * 更新购物车商品数量。
     * <p>
     * 更新时会校验购物车项归属关系以及最新库存。
     *
     * @param updateDTO 更新参数
     * @param userId 用户 ID
     */
    @Override
    public void updateCount(CartUpdateDTO updateDTO, Long userId) {
        // 改数量时必须校验购物车项归属，避免跨用户修改数据。
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

    /**
     * 删除购物车项。
     *
     * @param ids 购物车项 ID 列表
     * @param userId 用户 ID
     */
    @Override
    public void delete(List<Long> ids, Long userId) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        // 删除时附带 userId 条件，确保只能删掉自己的购物车项。
        this.remove(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .in(CartItem::getId, ids));
    }

    /**
     * 查询当前用户的购物车列表。
     * <p>
     * 该方法会补充药品名称、图片、价格和库存等展示字段。
     *
     * @param userId 用户 ID
     * @return 购物车列表
     */
    @Override
    public List<CartItemVO> myList(Long userId) {
        List<CartItem> cartItems = this.list(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .orderByDesc(CartItem::getCreateTime));

        if (cartItems.isEmpty()) {
            return new ArrayList<>();
        }

        // 先批量查药品，再回填展示字段，避免前端为每一项重复联查。
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

    /**
     * 清空当前用户的购物车。
     *
     * @param userId 用户 ID
     */
    @Override
    public void clear(Long userId) {
        // 清空购物车本质上就是删除当前用户的全部购物车项。
        this.remove(new LambdaQueryWrapper<CartItem>().eq(CartItem::getUserId, userId));
    }
}
