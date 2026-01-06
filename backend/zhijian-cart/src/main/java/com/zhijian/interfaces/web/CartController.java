package com.zhijian.interfaces.web;

import com.zhijian.application.service.CartService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.interfaces.dto.cart.CartAddDTO;
import com.zhijian.interfaces.dto.cart.CartItemVO;
import com.zhijian.interfaces.dto.cart.CartUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 购物车控制器
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "购物车管理")
@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * 添加购物车
     * @param addDTO
     * @return
     */
    @Operation(summary = "添加购物车")
    @PostMapping("/add")
    public Result add(@Valid @RequestBody CartAddDTO addDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        cartService.add(addDTO, userId);
        return Result.success(null, "添加成功");
    }

    @Operation(summary = "更新购物车数量")
    @PutMapping("/update")
    public Result update(@Valid @RequestBody CartUpdateDTO updateDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        cartService.updateCount(updateDTO, userId);
        return Result.success(null, "更新成功");
    }

    @Operation(summary = "删除购物车项")
    @DeleteMapping("/delete")
    public Result delete(@RequestBody List<Long> ids) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        cartService.delete(ids, userId);
        return Result.success(null, "删除成功");
    }

    @Operation(summary = "获取我的购物车")
    @GetMapping("/list")
    public Result<List<CartItemVO>> list() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return Result.success(cartService.myList(userId));
    }
}
