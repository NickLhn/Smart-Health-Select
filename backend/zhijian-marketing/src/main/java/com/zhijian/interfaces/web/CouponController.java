package com.zhijian.interfaces.web;

import com.zhijian.application.service.CouponService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.marketing.entity.Coupon;
import com.zhijian.interfaces.dto.CouponCreateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import com.baomidou.mybatisplus.core.metadata.IPage;

import java.util.List;

/**
 * 优惠券管理控制器
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "优惠券管理")
@RestController
@RequestMapping("/marketing/coupon")
public class CouponController {

    @Resource
    private CouponService couponService;

    @Operation(summary = "创建优惠券")
    @PostMapping("/create")
    public Result create(@RequestBody CouponCreateDTO createDTO) {
        return couponService.create(createDTO);
    }

    @Operation(summary = "获取可领取列表")
    @GetMapping("/list")
    public Result<List<Coupon>> list() {
        // 暂不传入userId，后续可优化
        return Result.success(couponService.listAvailable(null));
    }

    @Operation(summary = "分页查询 (管理端)")
    @GetMapping("/page")
    public Result<IPage<Coupon>> page(@RequestParam(defaultValue = "1") Integer page,
                                      @RequestParam(defaultValue = "10") Integer size,
                                      @RequestParam(required = false) String name,
                                      @RequestParam(required = false) Integer type,
                                      @RequestParam(required = false) Integer status) {
        return Result.success(couponService.pageList(page, size, name, type, status));
    }

    @Operation(summary = "更新优惠券")
    @PutMapping("/update/{id}")
    public Result update(@PathVariable Long id, @RequestBody CouponCreateDTO createDTO) {
        return couponService.update(id, createDTO);
    }

    @Operation(summary = "删除优惠券")
    @DeleteMapping("/delete/{id}")
    public Result delete(@PathVariable Long id) {
        return couponService.delete(id);
    }

    @Operation(summary = "更新状态")
    @PutMapping("/status/{id}")
    public Result updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        return couponService.updateStatus(id, status);
    }
}
