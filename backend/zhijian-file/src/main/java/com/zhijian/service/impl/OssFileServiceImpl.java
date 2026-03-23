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
 * 基于阿里云 OSS 的文件服务实现类。
 */
@Slf4j
@Service
public class OssFileServiceImpl implements FileService {

    /**
     * OSS 配置对象。
     */
    @Resource
    private OssConfig ossConfig;

    /**
     * 上传文件到阿里云 OSS。
     * <p>
     * 上传时会按日期分目录生成对象路径，并返回外部可访问地址。
     *
     * @param file 文件
     * @return 文件访问地址
     */
    @Override
    public String upload(MultipartFile file) {
        // 每次上传都从配置对象读取参数，避免把 OSS 信息写死在实现里。
        String endpoint = ossConfig.getEndpoint();
        String accessKeyId = ossConfig.getAccessKeyId();
        String accessKeySecret = ossConfig.getAccessKeySecret();
        String bucketName = ossConfig.getBucketName();

        if (endpoint == null || accessKeyId == null) {
            throw new RuntimeException("OSS配置缺失");
        }

        try {
            // OSS 客户端按次创建，并在 finally 中释放，避免连接资源泄漏。
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

                // 按日期分目录，后续排查文件和归档都会更方便。
                String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
                String objectName = ossConfig.getDirPrefix() + datePath + "/" + fileName;

                ossClient.putObject(bucketName, objectName, inputStream);

                // 统一拼出前端可直接访问的外链地址。
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
