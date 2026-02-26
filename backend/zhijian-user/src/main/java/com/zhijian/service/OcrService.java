package com.zhijian.service;

import com.zhijian.dto.merchant.ocr.BusinessLicenseOcrResponseDTO;
import com.zhijian.dto.merchant.ocr.IdCardOcrResponseDTO;

public interface OcrService {
    BusinessLicenseOcrResponseDTO recognizeBusinessLicense(String imageUrl);

    IdCardOcrResponseDTO recognizeIdCardBundle(String frontImageUrl, String backImageUrl);
}

