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
 * 文件管理控制器。
 * <p>
 * 前端统一通过该接口上传图片、证件照和其他附件。
 */
@Tag(name = "文件管理")
@RestController
@RequestMapping("/file")
public class FileController {

    /**
     * 文件业务服务。
     */
    @Resource
    private FileService fileService;

    /**
     * 上传文件。
     *
     * @param file 文件
     * @return 文件访问地址
     */
    @Operation(summary = "上传文件")
    @PostMapping("/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file) {
        // 图片、证件照和其他附件都复用同一个上传入口。
        return Result.success(fileService.upload(file));
    }
}
