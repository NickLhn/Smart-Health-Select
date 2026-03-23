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

/**
 * 购物车控制器。
 * <p>
 * 所有购物车接口都绑定当前登录用户，避免出现跨用户购物车数据。
 */
@Tag(name = "购物车管理", description = "购物车相关操作接口")
@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    /**
     * 购物车业务服务。
     */
    private final CartService cartService;

    /**
     * 添加购物车。
     *
     * @param addDTO 加购参数
     * @return 添加结果
     */
    @Operation(summary = "添加购物车", description = "将指定药品添加到当前用户的购物车中")
    @PostMapping("/add")
    public Result add(@Valid @RequestBody CartAddDTO addDTO) {
        // 购物车接口全部绑定当前登录用户，不接受前端显式传 userId。
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        cartService.add(addDTO, userId);
        return Result.success(null, "添加成功");
    }

    /**
     * 更新购物车商品数量。
     *
     * @param updateDTO 更新参数
     * @return 更新结果
     */
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

    /**
     * 删除购物车项。
     *
     * @param ids 购物车项 ID 列表
     * @return 删除结果
     */
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

    /**
     * 查询当前用户的购物车列表。
     *
     * @return 购物车列表
     */
    @Operation(summary = "获取我的购物车", description = "查询当前用户购物车中的所有商品")
    @GetMapping("/list")
    public Result<List<CartItemVO>> list() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        // 我的购物车直接按当前登录用户查询，避免出现跨账号数据串读。
        List<CartItemVO> cartItems = cartService.myList(userId);
        return Result.success(cartItems);
    }
}
