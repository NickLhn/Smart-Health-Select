package com.zhijian.user.controller;

import com.zhijian.user.service.SysConfigService;
import com.zhijian.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 系统配置控制器
 *
 * @author TraeAI
 * @since 1.0.0
 */
@Tag(name = "系统配置")
@RestController
@RequestMapping("/sys/config")
@RequiredArgsConstructor
public class SysConfigController {

    private final SysConfigService sysConfigService;

    @Operation(summary = "获取所有配置")
    @GetMapping
    public Result<Map<String, String>> getAll() {
        return Result.success(sysConfigService.getAllConfigs());
    }

    @Operation(summary = "更新配置")
    @PostMapping
    public Result update(@RequestBody Map<String, String> configs) {
        sysConfigService.updateConfigs(configs);
        return Result.success(null, "配置更新成功");
    }
}
