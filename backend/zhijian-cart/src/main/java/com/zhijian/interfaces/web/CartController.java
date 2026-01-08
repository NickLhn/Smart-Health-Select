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
 * 提供购物车相关功能的REST API接口，包括添加商品、更新数量、删除商品、查询列表等操作
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "购物车管理", description = "购物车相关操作接口")
@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    // 购物车服务，处理业务逻辑
    private final CartService cartService;

    /**
     * 添加商品到购物车
     * 用户可以将药品添加到自己的购物车中，系统会自动校验库存和药品状态
     *
     * @param addDTO 添加购物车参数，包含药品ID和购买数量，通过@Valid注解自动验证参数有效性
     * @return 操作结果，包含成功/失败信息和数据
     * @apiNote 需要用户登录后才能调用，系统会从UserContext获取当前用户ID
     */
    @Operation(summary = "添加购物车", description = "将指定药品添加到当前用户的购物车中")
    @PostMapping("/add")
    public Result add(@Valid @RequestBody CartAddDTO addDTO) {
        // 从用户上下文获取当前用户ID
        Long userId = UserContext.getUserId();
        // 检查用户是否登录
        if (userId == null) {
            return Result.failed("请先登录");
        }
        // 调用服务层添加购物车
        cartService.add(addDTO, userId);
        return Result.success(null, "添加成功");
    }

    /**
     * 更新购物车商品数量
     * 修改购物车中指定商品的数量，系统会校验库存是否足够
     *
     * @param updateDTO 更新参数，包含购物车项ID和新的数量
     * @return 操作结果
     * @apiNote 只能更新自己购物车中的商品数量
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
     * 删除购物车项
     * 批量删除购物车中的商品，支持删除单个或多个商品
     *
     * @param ids 要删除的购物车项ID列表
     * @return 操作结果
     * @apiNote 只能删除自己购物车中的商品
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
     * 获取我的购物车列表
     * 查询当前用户购物车中的所有商品，包含药品的详细信息（名称、图片、价格、库存等）
     *
     * @return 购物车项列表，每个项包含药品详细信息
     */
    @Operation(summary = "获取我的购物车", description = "查询当前用户购物车中的所有商品")
    @GetMapping("/list")
    public Result<List<CartItemVO>> list() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        // 调用服务层获取购物车列表
        List<CartItemVO> cartItems = cartService.myList(userId);
        return Result.success(cartItems);
    }
}