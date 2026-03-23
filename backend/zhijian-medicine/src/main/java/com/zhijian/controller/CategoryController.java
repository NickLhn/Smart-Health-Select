package com.zhijian.controller;

import com.zhijian.service.CategoryService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.medicine.entity.Category;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 药品分类控制器。
 */
@Tag(name = "分类管理")
@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "获取分类列表")
    @GetMapping("/list")
    public Result<List<Category>> list() {
        return Result.success(categoryService.listTree());
    }

    @Operation(summary = "添加分类 (管理员/商家)")
    @PostMapping
    public Result add(@RequestBody Category category) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        // 这里暂时只做登录校验，后续可以再收敛到管理员权限。
        categoryService.addCategory(category);
        return Result.success(null, "添加成功");
    }

    @Operation(summary = "修改分类 (管理员/商家)")
    @PutMapping
    public Result update(@RequestBody Category category) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        categoryService.updateById(category);
        return Result.success(null, "修改成功");
    }

    @Operation(summary = "删除分类 (管理员/商家)")
    @DeleteMapping("/{id}")
    public Result delete(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        categoryService.removeById(id);
        return Result.success(null, "删除成功");
    }
}
