package com.zhijian.user.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.user.service.UserService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.user.entity.SysUser;
import com.zhijian.dto.user.PasswordUpdateDTO;
import com.zhijian.dto.user.UserQueryDTO;
import com.zhijian.dto.user.UserUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "个人中心")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ========================= 个人中心接口 =========================

    @Operation(summary = "获取个人信息")
    @GetMapping("/profile")
    public Result<SysUser> profile() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        SysUser user = userService.getById(userId);
        user.setPassword(null); // 脱敏
        return Result.success(user);
    }

    @Operation(summary = "修改个人资料")
    @PutMapping("/profile")
    public Result updateProfile(@RequestBody UserUpdateDTO updateDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return userService.updateInfo(userId, updateDTO);
    }

    @Operation(summary = "修改密码")
    @PostMapping("/password")
    public Result updatePassword(@RequestBody PasswordUpdateDTO updateDTO) {
        // 修改密码依赖当前登录用户，不允许通过参数指定其他用户 ID。
        return userService.updatePassword(UserContext.getUserId(), updateDTO.getOldPassword(), updateDTO.getNewPassword());
    }

    // ========================= 管理端用户管理接口 =========================
    @Operation(summary = "管理端-用户列表")
    @GetMapping("/admin/list")
    public Result<IPage<SysUser>> pageList(UserQueryDTO query) {
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role)) {
            return Result.failed("无权访问");
        }
        return Result.success(userService.pageList(query));
    }

    @Operation(summary = "管理端-用户详情")
    @GetMapping("/admin/{id}")
    public Result<SysUser> adminDetail(@PathVariable Long id) {
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role)) {
            return Result.failed("无权访问");
        }
        SysUser user = userService.getById(id);
        if (user == null) {
            return Result.failed("用户不存在");
        }
        user.setPassword(null);
        return Result.success(user);
    }

    // 管理端可以直接调整用户状态，用于禁用异常账号或恢复账号。
    @Operation(summary = "管理端-更新状态")
    @PatchMapping("/admin/{id}/status")
    public Result updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role)) {
            return Result.failed("无权访问");
        }
        userService.updateStatus(id, status);
        return Result.success();
    }
}
