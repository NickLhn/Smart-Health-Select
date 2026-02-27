package com.zhijian.cart.controller;

import com.zhijian.cart.dto.CartAddDTO;
import com.zhijian.cart.dto.CartItemVO;
import com.zhijian.cart.dto.CartUpdateDTO;
import com.zhijian.cart.service.CartService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "购物车管理", description = "购物车相关操作接口")
@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @Operation(summary = "添加购物车", description = "将指定药品添加到当前用户的购物车中")
    @PostMapping("/add")
    public Result add(@Valid @RequestBody CartAddDTO addDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        cartService.add(addDTO, userId);
        return Result.success(null, "添加成功");
    }

    @Operation(summary = "更新购物车数量", description = "修改购物车中指定商品的数量")
    @PutMapping("/update")
    public Result update(@Valid @RequestBody CartUpdateDTO updateDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        cartService.updateCount(updateDTO, userId);
        return Result.success(null, "更新成功");
    }

    @Operation(summary = "删除购物车项", description = "批量删除购物车中的商品")
    @DeleteMapping("/delete")
    public Result delete(@RequestBody List<Long> ids) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        cartService.delete(ids, userId);
        return Result.success(null, "删除成功");
    }

    @Operation(summary = "获取我的购物车", description = "查询当前用户购物车中的所有商品")
    @GetMapping("/list")
    public Result<List<CartItemVO>> list() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        List<CartItemVO> cartItems = cartService.myList(userId);
        return Result.success(cartItems);
    }
}
