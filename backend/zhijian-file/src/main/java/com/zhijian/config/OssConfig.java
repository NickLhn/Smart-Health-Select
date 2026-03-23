package com.zhijian.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * OSS 配置类。
 */
@Data
@Component
@ConfigurationProperties(prefix = "aliyun.oss")
public class OssConfig {

    /**
     * OSS 服务端点。
     */
    private String endpoint;

    /**
     * AccessKey ID。
     */
    private String accessKeyId;

    /**
     * AccessKey Secret。
     */
    private String accessKeySecret;

    /**
     * 存储桶名称。
     */
    private String bucketName;

    /**
     * 上传目录前缀。
     */
    private String dirPrefix = "zhijian/";
}
