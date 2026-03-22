package com.zhijian.user.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.user.service.MerchantService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.user.entity.Merchant;
import com.zhijian.dto.merchant.MerchantApplyDTO;
import com.zhijian.dto.merchant.MerchantAuditDTO;
import com.zhijian.dto.merchant.MerchantQueryDTO;
import com.zhijian.dto.merchant.MerchantSettingDTO;
import com.zhijian.dto.merchant.ocr.BusinessLicenseOcrRequestDTO;
import com.zhijian.dto.merchant.ocr.BusinessLicenseOcrResponseDTO;
import com.zhijian.dto.merchant.ocr.IdCardBundleOcrRequestDTO;
import com.zhijian.dto.merchant.ocr.IdCardOcrResponseDTO;
import com.zhijian.user.service.OcrService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Tag(name = "商家管理")
@RestController
@RequestMapping("/merchant")
@RequiredArgsConstructor
@Slf4j
public class MerchantController {

    private final MerchantService merchantService;
    private final OcrService ocrService;

    // ========================= 管理端查询与审核 =========================

    @Operation(summary = "商家列表 (管理端)")
    @GetMapping("/list")
    public Result<IPage<Merchant>> list(MerchantQueryDTO query) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!UserContext.isAdmin()) {
            return Result.failed("无权访问");
        }
        return Result.success(merchantService.pageList(query));
    }

    @Operation(summary = "获取我的店铺信息")
    @GetMapping("/my-store")
    public Result<Merchant> getMyStore() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        Merchant merchant = merchantService.getByUserId(userId);
        return Result.success(merchant);
    }

    // ========================= 商家入驻与 OCR =========================

    @Operation(summary = "商家入驻/更新信息")
    @PostMapping("/apply")
    public Result apply(@RequestBody @Valid MerchantApplyDTO applyDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return merchantService.apply(userId, applyDTO);
    }

    // 同一个 OCR 能力同时提供 GET 版本，便于联调或浏览器直接测试。
    @Operation(summary = "营业执照OCR识别(用于自动填表)")
    @PostMapping("/ocr/business-license")
    public Result<BusinessLicenseOcrResponseDTO> ocrBusinessLicense(@RequestBody @Valid BusinessLicenseOcrRequestDTO req) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        try {
            BusinessLicenseOcrResponseDTO data = ocrService.recognizeBusinessLicense(req.getImageUrl());
            if (data == null || (data.getCreditCode() == null && data.getAddress() == null && data.getEntityName() == null)) {
                return Result.failed("识别失败");
            }
            return Result.success(data);
        } catch (Exception e) {
            return Result.failed(e.getMessage() == null || e.getMessage().isBlank() ? "识别失败" : e.getMessage());
        }
    }

    @Operation(summary = "营业执照OCR识别(用于自动填表)")
    @GetMapping("/ocr/business-license")
    public Result<BusinessLicenseOcrResponseDTO> ocrBusinessLicenseGet(@RequestParam(value = "imageUrl", required = false) String imageUrl) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            return Result.failed("imageUrl不能为空");
        }
        try {
            BusinessLicenseOcrResponseDTO data = ocrService.recognizeBusinessLicense(imageUrl);
            if (data == null || (data.getCreditCode() == null && data.getAddress() == null && data.getEntityName() == null)) {
                return Result.failed("识别失败");
            }
            return Result.success(data);
        } catch (Exception e) {
            return Result.failed(e.getMessage() == null || e.getMessage().isBlank() ? "识别失败" : e.getMessage());
        }
    }

    // GET 版本主要服务于联调或需要手工传 URL 的场景。
    @Operation(summary = "身份证OCR识别(正反面合并弹窗)")
    @PostMapping("/ocr/idcard-bundle")
    public Result<IdCardOcrResponseDTO> ocrIdCardBundle(@RequestBody @Valid IdCardBundleOcrRequestDTO req) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        try {
            IdCardOcrResponseDTO data = ocrService.recognizeIdCardBundle(req.getFrontImageUrl(), req.getBackImageUrl());
            if (data == null || (data.getName() == null && data.getIdNumber() == null && data.getAddress() == null && data.getAuthority() == null && data.getValidDate() == null)) {
                log.warn("身份证OCR识别结果为空: frontUrl={}, backUrl={}", req.getFrontImageUrl(), req.getBackImageUrl());
                return Result.failed("识别结果为空，请确认上传的是身份证正反面且图片清晰");
            }
            return Result.success(data);
        } catch (Exception e) {
            return Result.failed(e.getMessage() == null || e.getMessage().isBlank() ? "识别失败" : e.getMessage());
        }
    }

    @Operation(summary = "身份证OCR识别(正反面合并弹窗)")
    @GetMapping("/ocr/idcard-bundle")
    public Result<IdCardOcrResponseDTO> ocrIdCardBundleGet(
            @RequestParam(value = "frontImageUrl", required = false) String frontImageUrl,
            @RequestParam(value = "backImageUrl", required = false) String backImageUrl
    ) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (frontImageUrl == null || frontImageUrl.isBlank()) {
            return Result.failed("frontImageUrl不能为空");
        }
        if (backImageUrl == null || backImageUrl.isBlank()) {
            return Result.failed("backImageUrl不能为空");
        }
        try {
            IdCardOcrResponseDTO data = ocrService.recognizeIdCardBundle(frontImageUrl, backImageUrl);
            if (data == null || (data.getName() == null && data.getIdNumber() == null && data.getAddress() == null && data.getAuthority() == null && data.getValidDate() == null)) {
                log.warn("身份证OCR识别结果为空: frontUrl={}, backUrl={}", frontImageUrl, backImageUrl);
                return Result.failed("识别结果为空，请确认上传的是身份证正反面且图片清晰");
            }
            return Result.success(data);
        } catch (Exception e) {
            return Result.failed(e.getMessage() == null || e.getMessage().isBlank() ? "识别失败" : e.getMessage());
        }
    }

    // ========================= 管理端详情与审核、商家端运营设置 =========================

    @Operation(summary = "获取商家详情 (管理端)")
    @GetMapping("/{id}")
    public Result<Merchant> getDetail(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!UserContext.isAdmin()) {
            return Result.failed("无权访问");
        }
        return Result.success(merchantService.getById(id));
    }
    
    @Operation(summary = "获取商家详情 By UserId (管理端)")
    @GetMapping("/user/{userId}")
    public Result<Merchant> getDetailByUserId(@PathVariable Long userId) {
        return Result.success(merchantService.getByUserId(userId));
    }

    @Operation(summary = "商家审核 (管理端)")
    @PutMapping("/audit")
    public Result audit(@RequestBody @Valid MerchantAuditDTO auditDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!UserContext.isAdmin()) {
            return Result.failed("无权访问");
        }
        return merchantService.audit(auditDTO);
    }

    @Operation(summary = "更新商家运营设置")
    @PutMapping("/settings")
    public Result updateSettings(@RequestBody MerchantSettingDTO settingDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return merchantService.updateSettings(userId, settingDTO);
    }
}
