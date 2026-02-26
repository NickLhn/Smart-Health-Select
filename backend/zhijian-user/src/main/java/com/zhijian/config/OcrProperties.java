package com.zhijian.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "aliyun.ocr")
public class OcrProperties {
    private String endpoint;
    private String accessKeyId;
    private String accessKeySecret;
    private double confidenceThreshold = 0.8;
}

