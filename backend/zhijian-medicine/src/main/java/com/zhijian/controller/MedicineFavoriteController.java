package com.zhijian.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.service.MedicineFavoriteService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.dto.medicine.FavoriteAddDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * 药品收藏控制器。
 */
@Tag(name = "药品收藏管理")
@RestController
@RequestMapping("/api/favorite")
public class MedicineFavoriteController {

    @Resource
    private MedicineFavoriteService favoriteService;

    @Operation(summary = "收藏/取消收藏")
    @PostMapping("/toggle")
    public Result toggle(@Valid @RequestBody FavoriteAddDTO addDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        // 收藏和取消收藏统一走 toggle，减少前端额外分支判断。
        return favoriteService.toggle(addDTO.getMedicineId(), userId);
    }

    @Operation(summary = "查询是否已收藏")
    @GetMapping("/check/{medicineId}")
    public Result<Boolean> check(@PathVariable Long medicineId) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.success(false);
        }
        return Result.success(favoriteService.isFavorite(medicineId, userId));
    }

    @Operation(summary = "获取我的收藏列表")
    @GetMapping("/list")
    public Result<IPage<Object>> list(@RequestParam(defaultValue = "1") Integer page,
                                      @RequestParam(defaultValue = "10") Integer size) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        // 我的收藏列表最终直接返回药品信息，前端不需要再补查一次详情。
        return Result.success(favoriteService.myList(userId, page, size));
    }
}
