package com.zhijian.application.service.impl;

import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.dysmsapi20170525.models.SendSmsRequest;
import com.aliyun.dysmsapi20170525.models.SendSmsResponse;
import com.aliyun.teaopenapi.models.Config;
import com.zhijian.application.service.SmsService;
import com.zhijian.infrastructure.config.SmsProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 阿里云短信服务实现
 */
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
            config.endpoint = "dysmsapi.aliyuncs.com";
            this.client = new Client(config);
            log.info("阿里云短信服务初始化成功");
        } catch (Exception e) {
            log.error("阿里云短信服务初始化失败", e);
        }
    }

    @Override
    public boolean sendVerificationCode(String phone, String code) {
        // 假设模板中有一个名为 code 的变量
        String templateParam = "{\"code\":\"" + code + "\"}";
        return sendSms(phone, templateParam);
    }

    @Override
    public boolean sendSms(String phone, String templateParam) {
        if (client == null) {
            log.error("短信客户端未初始化，无法发送短信");
            return false;
        }
        
        SendSmsRequest sendSmsRequest = new SendSmsRequest()
                .setSignName(smsProperties.getSignName())
                .setTemplateCode(smsProperties.getTemplateCode())
                .setPhoneNumbers(phone)
                .setTemplateParam(templateParam);
        
        try {
            SendSmsResponse response = client.sendSms(sendSmsRequest);
            if (!"OK".equals(response.getBody().getCode())) {
                log.error("短信发送失败: code={}, message={}", response.getBody().getCode(), response.getBody().getMessage());
                return false;
            }
            log.info("短信发送成功: phone={}", phone);
            return true;
        } catch (Exception e) {
            log.error("短信发送异常", e);
            return false;
        }
    }
}
