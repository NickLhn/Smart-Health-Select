package com.zhijian.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 阿里云短信配置属性类。
 */
@Data
@Component
@ConfigurationProperties(prefix = "aliyun.sms")
public class SmsProperties {

    /**
     * AccessKey ID。
     */
    private String accessKeyId;

    /**
     * AccessKey Secret。
     */
    private String accessKeySecret;

    /**
     * 短信签名名称。
     */
    private String signName;

    /**
     * 短信模板代码。
     */
    private String templateCode;
}
