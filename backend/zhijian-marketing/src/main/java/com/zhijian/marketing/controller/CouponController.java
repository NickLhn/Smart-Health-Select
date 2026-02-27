package com.zhijian.marketing.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.common.result.Result;
import com.zhijian.marketing.dto.CouponCreateDTO;
import com.zhijian.marketing.pojo.Coupon;
import com.zhijian.marketing.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "优惠券管理")
@RestController
@RequestMapping("/marketing/coupon")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @Operation(summary = "创建优惠券")
    @PostMapping("/create")
    public Result create(@RequestBody CouponCreateDTO createDTO) {
        return couponService.create(createDTO);
    }

    @Operation(summary = "获取可领取列表")
    @GetMapping("/list")
    public Result<List<Coupon>> list() {
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
