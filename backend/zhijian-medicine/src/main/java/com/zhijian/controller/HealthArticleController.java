package com.zhijian.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhijian.service.HealthArticleService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.medicine.entity.HealthArticle;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 健康资讯控制器。
 */
@Tag(name = "健康资讯管理")
@RestController
@RequestMapping("/health/article")
public class HealthArticleController {

    @Autowired
    private HealthArticleService healthArticleService;

    @Operation(summary = "分页查询资讯列表")
    @GetMapping("/page")
    public Result<Page<HealthArticle>> getPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer status) {

        // 资讯列表支持标题、分类、状态三个维度组合筛选。
        Page<HealthArticle> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<HealthArticle> wrapper = new LambdaQueryWrapper<>();
        if (title != null && !title.isEmpty()) {
            wrapper.like(HealthArticle::getTitle, title);
        }
        if (category != null && !category.isEmpty()) {
            wrapper.eq(HealthArticle::getCategory, category);
        }
        if (status != null) {
            wrapper.eq(HealthArticle::getStatus, status);
        }
        wrapper.orderByDesc(HealthArticle::getCreateTime);

        return Result.success(healthArticleService.page(pageParam, wrapper));
    }

    @Operation(summary = "获取资讯详情")
    @GetMapping("/{id}")
    public Result<HealthArticle> getById(@PathVariable Long id) {
        HealthArticle article = healthArticleService.getById(id);
        if (article != null) {
            // 详情页每次打开都累加一次浏览量。
            article.setViews(article.getViews() + 1);
            healthArticleService.updateById(article);
        }
        return Result.success(article);
    }

    @Operation(summary = "新增资讯")
    @PostMapping
    public Result<Boolean> save(@RequestBody HealthArticle article) {
        // 新建资讯默认从 0 浏览量开始。
        article.setViews(0);
        return Result.success(healthArticleService.save(article));
    }

    @Operation(summary = "修改资讯")
    @PutMapping
    public Result<Boolean> update(@RequestBody HealthArticle article) {
        return Result.success(healthArticleService.updateById(article));
    }

    @Operation(summary = "删除资讯")
    @DeleteMapping("/{id}")
    public Result<Boolean> remove(@PathVariable Long id) {
        return Result.success(healthArticleService.removeById(id));
    }
}
