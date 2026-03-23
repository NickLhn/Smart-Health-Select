package com.zhijian.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhijian.service.BannerService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.medicine.entity.Banner;
import com.zhijian.dto.medicine.BannerDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

/**
 * 轮播图管理控制器。
 */
@Tag(name = "轮播图管理")
@RestController
@RequestMapping("/admin/banner")
public class BannerController {

    @Resource
    private BannerService bannerService;

    /**
     * 校验管理员权限。
     */
    private void checkAdmin() {
        // 这里暂时保留为占位校验，后续可切到统一的管理员鉴权体系。
    }

    @Operation(summary = "分页查询轮播图")
    @GetMapping("/list")
    public Result<IPage<Banner>> list(@RequestParam(defaultValue = "1") Integer page,
                                      @RequestParam(defaultValue = "10") Integer size) {
        checkAdmin();
        Page<Banner> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Banner> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(Banner::getSort).orderByDesc(Banner::getCreateTime);
        return Result.success(bannerService.page(pageParam, wrapper));
    }

    @Operation(summary = "添加轮播图")
    @PostMapping
    public Result add(@Valid @RequestBody BannerDTO dto) {
        checkAdmin();
        Banner banner = new Banner();
        BeanUtils.copyProperties(dto, banner);
        bannerService.save(banner);
        return Result.success(null, "添加成功");
    }

    @Operation(summary = "修改轮播图")
    @PutMapping("/{id}")
    public Result update(@PathVariable Long id, @Valid @RequestBody BannerDTO dto) {
        checkAdmin();
        Banner banner = bannerService.getById(id);
        if (banner == null) {
            return Result.failed("轮播图不存在");
        }
        BeanUtils.copyProperties(dto, banner);
        banner.setId(id);
        bannerService.updateById(banner);
        return Result.success(null, "修改成功");
    }

    @Operation(summary = "删除轮播图")
    @DeleteMapping("/{id}")
    public Result delete(@PathVariable Long id) {
        checkAdmin();
        bannerService.removeById(id);
        return Result.success(null, "删除成功");
    }
}
