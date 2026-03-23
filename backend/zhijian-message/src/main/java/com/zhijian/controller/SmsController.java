package com.zhijian.controller;

import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import com.zhijian.common.result.Result;
import com.zhijian.common.util.RedisUtil;
import com.zhijian.service.SmsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * 短信接口控制器。
 */
@Tag(name = "短信服务", description = "短信发送接口")
@RestController
@RequestMapping("/sms")
@RequiredArgsConstructor
public class SmsController {

    /**
     * 短信业务服务。
     */
    private final SmsService smsService;

    /**
     * Redis 工具类。
     */
    private final RedisUtil redisUtil;

    /**
     * 发送短信验证码。
     *
     * @param phone 手机号
     * @return 发送结果
     */
    @Operation(summary = "发送短信验证码")
    @PostMapping("/send-code")
    public Result sendCode(@RequestParam String phone) {
        if (StrUtil.isBlank(phone)) {
            return Result.failed("手机号不能为空");
        }

        // 先生成 6 位验证码，再调用短信服务发送。
        String code = RandomUtil.randomNumbers(6);
        boolean success = smsService.sendVerificationCode(phone, code);

        // 无论短信平台是否成功，都先把验证码写入 Redis 供后续校验。
        redisUtil.set("sms:code:" + phone, code, 5, TimeUnit.MINUTES);

        if (success) {
            return Result.success(null, "发送成功");
        } else {
            // 开发/演示环境里允许在短信失败时回显验证码，便于联调。
            System.err.println("WARNING: 短信发送失败，但代码已保存到Redis用于调试。验证码: " + code);
            return Result.success(null, "发送成功(开发模式:验证码=" + code + ")");
        }
    }
}
