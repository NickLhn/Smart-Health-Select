package com.zhijian.application.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 文件服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface FileService {
    
    /**
     * 上传文件
     * @param file 文件
     * @return 文件URL
     */
    String upload(MultipartFile file);
}
