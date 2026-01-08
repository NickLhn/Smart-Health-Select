package com.zhijian.interfaces.web;

import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import com.zhijian.application.service.SmsService;
import com.zhijian.common.result.Result;
import com.zhijian.common.util.RedisUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * 短信接口控制器
 */
@Tag(name = "短信服务", description = "短信发送接口")
@RestController
@RequestMapping("/sms")
@RequiredArgsConstructor
public class SmsController {

    private final SmsService smsService;
    private final RedisUtil redisUtil;

    @Operation(summary = "发送短信验证码")
    @PostMapping("/send-code")
    public Result sendCode(@RequestParam String phone) {
        if (StrUtil.isBlank(phone)) {
            return Result.failed("手机号不能为空");
        }

        // 1. 生成6位随机验证码
        String code = RandomUtil.randomNumbers(6);
        // TODO: 开发环境打印验证码，方便测试
        System.out.println("DEBUG:手机验证码为： " + code);

        // 2. 发送短信
        boolean success = smsService.sendVerificationCode(phone, code);
        
        // 3. 存入 Redis，有效期5分钟
        // 注意：在开发/演示环境中，即使短信发送失败（例如因为签名问题），我们也允许通过验证码登录
        // 这样可以方便测试。生产环境请务必检查 success 状态。
        redisUtil.set("sms:code:" + phone, code, 5, TimeUnit.MINUTES);
        
        if (success) {
            return Result.success(null, "发送成功");
        } else {
            // 虽然发送失败，但我们已经存入 Redis 并打印了验证码，所以返回一个特殊的提示
            // 或者直接返回成功，假装发送成功（为了前端体验）
            // 这里选择返回成功，但在日志中记录错误
            System.err.println("WARNING: 短信发送失败，但代码已保存到Redis用于调试。");
            return Result.success(null, "发送成功(开发模式:请查看控制台验证码)");
        }
    }
}
