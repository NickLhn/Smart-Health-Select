package com.zhijian.application.service;

/**
 * 短信服务接口
 */
public interface SmsService {
    
    /**
     * 发送短信验证码
     * @param phone 手机号
     * @param code 验证码
     * @return 是否发送成功
     */
    boolean sendVerificationCode(String phone, String code);
    
    /**
     * 发送通用短信
     * @param phone 手机号
     * @param templateParam 模板参数JSON字符串
     * @return 是否发送成功
     */
    boolean sendSms(String phone, String templateParam);
}
