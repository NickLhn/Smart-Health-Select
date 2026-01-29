package com.zhijian.controller;

import com.zhijian.service.UserAddressService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.user.entity.UserAddress;
import com.zhijian.dto.user.AddressAddDTO;
import com.zhijian.dto.user.AddressUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户收货地址控制器
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "收货地址管理")
@RestController
@RequestMapping("/user/address")
@RequiredArgsConstructor
public class UserAddressController {

    private final UserAddressService userAddressService;

    @Operation(summary = "获取我的地址列表")
    @GetMapping("/list")
    public Result<List<UserAddress>> list() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return Result.success(userAddressService.myList(userId));
    }

    @Operation(summary = "添加地址")
    @PostMapping("/add")
    public Result add(@Valid @RequestBody AddressAddDTO addDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        UserAddress address = new UserAddress();
        BeanUtils.copyProperties(addDTO, address);
        address.setUserId(userId);
        userAddressService.addAddress(address);
        return Result.success(null, "添加成功");
    }

    @Operation(summary = "修改地址")
    @PutMapping("/update")
    public Result update(@Valid @RequestBody AddressUpdateDTO updateDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        UserAddress address = new UserAddress();
        BeanUtils.copyProperties(updateDTO, address);
        address.setUserId(userId);
        userAddressService.updateAddress(address);
        return Result.success(null, "修改成功");
    }

    @Operation(summary = "删除地址")
    @DeleteMapping("/delete/{id}")
    public Result delete(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        UserAddress address = userAddressService.getById(id);
        if (address == null || !address.getUserId().equals(userId)) {
            return Result.failed("地址不存在或无权操作");
        }
        userAddressService.removeById(id);
        return Result.success(null, "删除成功");
    }

    @Operation(summary = "设为默认地址")
    @PutMapping("/default/{id}")
    public Result setDefault(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        userAddressService.setDefault(id, userId);
        return Result.success(null, "设置成功");
    }
}

