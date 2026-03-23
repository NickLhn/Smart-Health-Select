package com.zhijian.service.impl;

import com.aliyun.dypnsapi20170525.Client;
import com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeRequest;
import com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeResponse;
import com.aliyun.teaopenapi.models.Config;
import com.aliyun.teautil.models.RuntimeOptions;
import com.zhijian.config.SmsProperties;
import com.zhijian.service.SmsService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 阿里云短信服务实现类。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AliyunSmsServiceImpl implements SmsService {

    /**
     * 短信配置属性。
     */
    private final SmsProperties smsProperties;

    /**
     * 阿里云短信客户端。
     */
    private Client client;

    /**
     * 初始化短信客户端。
     */
    @PostConstruct
    public void init() {
        try {
            // 启动时初始化阿里云短信客户端。
            Config config = new Config()
                    .setAccessKeyId(smsProperties.getAccessKeyId())
                    .setAccessKeySecret(smsProperties.getAccessKeySecret());
            config.endpoint = "dypnsapi.aliyuncs.com";
            this.client = new Client(config);
            log.info("阿里云短信服务(Dypnsapi)初始化成功");
        } catch (Exception e) {
            log.error("阿里云短信服务(Dypnsapi)初始化失败", e);
        }
    }

    /**
     * 发送短信验证码。
     *
     * @param phone 手机号
     * @param code 验证码
     * @return 是否发送成功
     */
    @Override
    public boolean sendVerificationCode(String phone, String code) {
        // 验证码模板固定传入 code 和有效分钟数。
        String templateParam = "{\"code\":\"" + code + "\", \"min\":\"5\"}";
        return sendSms(phone, templateParam);
    }

    /**
     * 发送通用短信。
     *
     * @param phone 手机号
     * @param templateParam 模板参数
     * @return 是否发送成功
     */
    @Override
    public boolean sendSms(String phone, String templateParam) {
        if (client == null) {
            log.error("短信客户端未初始化，无法发送短信");
            return false;
        }

        // 组装阿里云短信请求参数。
        SendSmsVerifyCodeRequest request = new SendSmsVerifyCodeRequest()
                .setPhoneNumber(phone)
                .setSignName(smsProperties.getSignName())
                .setTemplateCode(smsProperties.getTemplateCode())
                .setTemplateParam(templateParam)
                .setCountryCode("86");

        RuntimeOptions runtime = new RuntimeOptions();

        try {
            SendSmsVerifyCodeResponse response = client.sendSmsVerifyCodeWithOptions(request, runtime);
            if (!"OK".equals(response.getBody().getCode())) {
                log.error("短信发送失败: code={}, message={}",
                        response.getBody().getCode(), response.getBody().getMessage());
                return false;
            }
            log.info("短信发送成功: phone={}, requestId={}",
                    phone, response.getBody().getRequestId());
            return true;
        } catch (Exception e) {
            log.error("短信发送异常", e);
            return false;
        }
    }
}
