package com.zhijian.user.controller;

import com.zhijian.user.service.UserService;
import com.zhijian.common.result.Result;
import com.zhijian.dto.user.UserLoginDTO;
import com.zhijian.dto.user.UserRegisterDTO;
import com.zhijian.dto.user.UserResetPasswordDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "认证管理", description = "用户注册与登录")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public Result login(@RequestBody @Valid UserLoginDTO loginDTO) {
        return userService.login(loginDTO);
    }

    // 注册接口为多个端共用，具体身份由 role 或前端入口控制。
    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public Result register(@RequestBody @Valid UserRegisterDTO registerDTO) {
        return userService.register(registerDTO);
    }

    @Operation(summary = "重置密码")
    @PostMapping("/reset-password")
    public Result resetPassword(@RequestBody @Valid UserResetPasswordDTO resetPasswordDTO) {
        return userService.resetPassword(resetPasswordDTO);
    }
}
