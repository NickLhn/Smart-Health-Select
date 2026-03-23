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

/**
 * 优惠券管理控制器。
 * <p>
 * 同时提供管理端维护能力和用户端可领取列表查询能力。
 */
@Tag(name = "优惠券管理")
@RestController
@RequestMapping("/marketing/coupon")
@RequiredArgsConstructor
public class CouponController {

    /**
     * 优惠券业务服务。
     */
    private final CouponService couponService;

    /**
     * 创建优惠券。
     *
     * @param createDTO 创建参数
     * @return 创建结果
     */
    @Operation(summary = "创建优惠券")
    @PostMapping("/create")
    public Result create(@RequestBody CouponCreateDTO createDTO) {
        return couponService.create(createDTO);
    }

    /**
     * 查询可领取优惠券列表。
     *
     * @return 优惠券列表
     */
    @Operation(summary = "获取可领取列表")
    @GetMapping("/list")
    public Result<List<Coupon>> list() {
        // 用户端领券页直接复用同一套优惠券查询接口。
        return Result.success(couponService.listAvailable(null));
    }

    /**
     * 分页查询优惠券。
     *
     * @param page 页码
     * @param size 每页条数
     * @param name 优惠券名称
     * @param type 优惠券类型
     * @param status 优惠券状态
     * @return 分页结果
     */
    @Operation(summary = "分页查询 (管理端)")
    @GetMapping("/page")
    public Result<IPage<Coupon>> page(@RequestParam(defaultValue = "1") Integer page,
                                      @RequestParam(defaultValue = "10") Integer size,
                                      @RequestParam(required = false) String name,
                                      @RequestParam(required = false) Integer type,
                                      @RequestParam(required = false) Integer status) {
        return Result.success(couponService.pageList(page, size, name, type, status));
    }

    /**
     * 更新优惠券。
     *
     * @param id 优惠券 ID
     * @param createDTO 更新参数
     * @return 更新结果
     */
    @Operation(summary = "更新优惠券")
    @PutMapping("/update/{id}")
    public Result update(@PathVariable Long id, @RequestBody CouponCreateDTO createDTO) {
        return couponService.update(id, createDTO);
    }

    /**
     * 删除优惠券。
     *
     * @param id 优惠券 ID
     * @return 删除结果
     */
    @Operation(summary = "删除优惠券")
    @DeleteMapping("/delete/{id}")
    public Result delete(@PathVariable Long id) {
        return couponService.delete(id);
    }

    /**
     * 更新优惠券状态。
     *
     * @param id 优惠券 ID
     * @param status 优惠券状态
     * @return 更新结果
     */
    @Operation(summary = "更新状态")
    @PutMapping("/status/{id}")
    public Result updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        return couponService.updateStatus(id, status);
    }
}
