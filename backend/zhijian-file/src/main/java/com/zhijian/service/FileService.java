package com.zhijian.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 文件服务接口。
 */
public interface FileService {

    /**
     * 上传文件。
     *
     * @param file 文件
     * @return 文件访问地址
     */
    String upload(MultipartFile file);
}
