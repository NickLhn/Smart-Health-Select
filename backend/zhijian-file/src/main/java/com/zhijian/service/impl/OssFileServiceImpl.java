package com.zhijian.service.impl;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.zhijian.config.OssConfig;
import com.zhijian.service.FileService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * OSS文件服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Slf4j
@Service
public class OssFileServiceImpl implements FileService {

    @Resource
    private OssConfig ossConfig;

    @Override
    public String upload(MultipartFile file) {
        String endpoint = ossConfig.getEndpoint();
        String accessKeyId = ossConfig.getAccessKeyId();
        String accessKeySecret = ossConfig.getAccessKeySecret();
        String bucketName = ossConfig.getBucketName();

        if (endpoint == null || accessKeyId == null) {
            throw new RuntimeException("OSS配置缺失");
        }

        try {
            // 创建OSSClient实例
            OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);

            try {
                InputStream inputStream = file.getInputStream();
                String originalFilename = file.getOriginalFilename();
                if (originalFilename == null) {
                    originalFilename = "unknown.tmp";
                }
                String suffix = originalFilename.contains(".") ? 
                        originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
                String fileName = UUID.randomUUID().toString().replaceAll("-", "") + suffix;
                
                // 按日期分组
                String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
                String objectName = ossConfig.getDirPrefix() + datePath + "/" + fileName;

                // 上传文件
                ossClient.putObject(bucketName, objectName, inputStream);
                
                String protocol = "https://";
                String domain = endpoint;
                if (endpoint.startsWith("http://")) {
                    protocol = "http://";
                    domain = endpoint.substring(7);
                } else if (endpoint.startsWith("https://")) {
                    domain = endpoint.substring(8);
                }
                
                return protocol + bucketName + "." + domain + "/" + objectName;
                
            } catch (IOException e) {
                log.error("文件上传失败", e);
                throw new RuntimeException("文件上传失败: " + e.getMessage());
            } finally {
                if (ossClient != null) {
                    ossClient.shutdown();
                }
            }
        } catch (Exception e) {
            log.error("OSS服务异常", e);
            throw new RuntimeException("文件上传服务异常: " + e.getMessage());
        }
    }
}

