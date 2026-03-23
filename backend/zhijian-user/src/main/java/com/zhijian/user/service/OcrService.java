package com.zhijian.user.service;

import com.zhijian.dto.merchant.ocr.BusinessLicenseOcrResponseDTO;
import com.zhijian.dto.merchant.ocr.IdCardOcrResponseDTO;

/**
 * OCR 服务接口。
 */
public interface OcrService {
    BusinessLicenseOcrResponseDTO recognizeBusinessLicense(String imageUrl);

    IdCardOcrResponseDTO recognizeIdCardBundle(String frontImageUrl, String backImageUrl);
}
