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

@Slf4j
@Service
@RequiredArgsConstructor
public class AliyunSmsServiceImpl implements SmsService {

    private final SmsProperties smsProperties;
    private Client client;

    @PostConstruct
    public void init() {
        try {
            Config config = new Config()
                    .setAccessKeyId(smsProperties.getAccessKeyId())
                    .setAccessKeySecret(smsProperties.getAccessKeySecret());
            // 切换为 dypnsapi 端点，因为使用 SendSmsVerifyCodeRequest
            config.endpoint = "dypnsapi.aliyuncs.com";
            this.client = new Client(config);
            log.info("阿里云短信服务(Dypnsapi)初始化成功");
        } catch (Exception e) {
            log.error("阿里云短信服务(Dypnsapi)初始化失败", e);
        }
    }

    @Override
    public boolean sendVerificationCode(String phone, String code) {
        // 根据SDK示例，模板 100001 需要 code 和 min 参数
        String templateParam = "{\"code\":\"" + code + "\", \"min\":\"5\"}";
        return sendSms(phone, templateParam);
    }

    @Override
    public boolean sendSms(String phone, String templateParam) {
        if (client == null) {
            log.error("短信客户端未初始化，无法发送短信");
            return false;
        }

        SendSmsVerifyCodeRequest request = new SendSmsVerifyCodeRequest()
                .setPhoneNumber(phone)
                .setSignName(smsProperties.getSignName())
                .setTemplateCode(smsProperties.getTemplateCode())
                .setTemplateParam(templateParam)
                .setCountryCode("86"); // SDK示例中包含 CountryCode
        
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
