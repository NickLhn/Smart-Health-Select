package com.zhijian.controller;

import com.zhijian.common.result.Result;
import com.zhijian.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传控制器
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "文件管理")
@RestController
@RequestMapping("/file")
public class FileController {

    @Resource
    private FileService fileService;

    @Operation(summary = "上传文件")
    @PostMapping("/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file) {
        return Result.success(fileService.upload(file));
    }
}

