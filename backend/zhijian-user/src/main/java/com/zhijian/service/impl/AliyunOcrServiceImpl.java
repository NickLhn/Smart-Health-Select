package com.zhijian.service.impl;

import com.aliyun.ocr_api20210707.Client;
import com.aliyun.ocr_api20210707.models.RecognizeAllTextRequest;
import com.aliyun.ocr_api20210707.models.RecognizeAllTextResponse;
import com.aliyun.teaopenapi.models.Config;
import com.aliyun.teautil.models.RuntimeOptions;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhijian.config.OcrProperties;
import com.zhijian.dto.merchant.ocr.BusinessLicenseOcrResponseDTO;
import com.zhijian.dto.merchant.ocr.IdCardOcrResponseDTO;
import com.zhijian.dto.merchant.ocr.OcrFieldDTO;
import com.zhijian.service.OcrService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AliyunOcrServiceImpl implements OcrService {

    private final OcrProperties ocrProperties;
    private final ObjectMapper objectMapper;
    private Client client;

    @PostConstruct
    public void init() {
        try {
            Config config = new Config()
                    .setAccessKeyId(ocrProperties.getAccessKeyId())
                    .setAccessKeySecret(ocrProperties.getAccessKeySecret());
            config.endpoint = (ocrProperties.getEndpoint() == null || ocrProperties.getEndpoint().isBlank())
                    ? "ocr-api.cn-hangzhou.aliyuncs.com"
                    : ocrProperties.getEndpoint();
            this.client = new Client(config);
        } catch (Exception e) {
            this.client = null;
        }
    }

    @Override
    public BusinessLicenseOcrResponseDTO recognizeBusinessLicense(String imageUrl) {
        Map<String, Object> kvData = recognizeKvData(imageUrl, "BusinessLicense");
        Map<String, Map<String, Object>> kvDetails = recognizeKvDetails(imageUrl, "BusinessLicense");

        BusinessLicenseOcrResponseDTO resp = new BusinessLicenseOcrResponseDTO();
        resp.setCreditCode(extract(kvData, kvDetails, "creditCode", "socialCreditCode", "unifiedSocialCreditCode", "UnifiedSocialCreditCode"));
        resp.setAddress(extract(kvData, kvDetails, "businessAddress", "address", "registeredAddress", "domicile"));
        resp.setEntityName(extract(kvData, kvDetails, "companyName", "name", "unitName", "enterpriseName"));
        return resp;
    }

    @Override
    public IdCardOcrResponseDTO recognizeIdCardBundle(String frontImageUrl, String backImageUrl) {
        Map<String, Object> frontKvData = recognizeKvData(frontImageUrl, "IdCard");
        Map<String, Map<String, Object>> frontKvDetails = recognizeKvDetails(frontImageUrl, "IdCard");

        Map<String, Object> backKvData = recognizeKvData(backImageUrl, "IdCard");
        Map<String, Map<String, Object>> backKvDetails = recognizeKvDetails(backImageUrl, "IdCard");

        IdCardOcrResponseDTO resp = new IdCardOcrResponseDTO();
        resp.setName(firstNonEmpty(
                extract(frontKvData, frontKvDetails, "name"),
                extract(backKvData, backKvDetails, "name")
        ));
        resp.setIdNumber(firstNonEmpty(
                extract(frontKvData, frontKvDetails, "idNumber", "id_number"),
                extract(backKvData, backKvDetails, "idNumber", "id_number")
        ));
        resp.setAddress(firstNonEmpty(
                extract(frontKvData, frontKvDetails, "address"),
                extract(backKvData, backKvDetails, "address")
        ));
        resp.setAuthority(firstNonEmpty(
                extract(backKvData, backKvDetails, "authority", "issuingAuthority"),
                extract(frontKvData, frontKvDetails, "authority", "issuingAuthority")
        ));
        resp.setValidDate(firstNonEmpty(
                extract(backKvData, backKvDetails, "validDate", "validPeriod"),
                extract(frontKvData, frontKvDetails, "validDate", "validPeriod")
        ));
        return resp;
    }

    private OcrFieldDTO firstNonEmpty(OcrFieldDTO a, OcrFieldDTO b) {
        if (a != null && a.getValue() != null && !a.getValue().isBlank()) return a;
        if (b != null && b.getValue() != null && !b.getValue().isBlank()) return b;
        return a != null ? a : b;
    }

    private Map<String, Object> recognizeKvData(String imageUrl, String type) {
        KvPayload payload = recognizeKvPayload(imageUrl, type);
        return payload.kvData;
    }

    private Map<String, Map<String, Object>> recognizeKvDetails(String imageUrl, String type) {
        KvPayload payload = recognizeKvPayload(imageUrl, type);
        return payload.kvDetails;
    }

    private KvPayload recognizeKvPayload(String imageUrl, String type) {
        if (client == null) {
            return new KvPayload(Collections.emptyMap(), Collections.emptyMap());
        }
        try {
            RecognizeAllTextRequest request = new RecognizeAllTextRequest()
                    .setUrl(imageUrl)
                    .setType(type);
            RecognizeAllTextResponse response = client.recognizeAllTextWithOptions(request, new RuntimeOptions());

            Object dataObj = response.getBody() == null ? null : response.getBody().getData();
            Map<String, Object> dataMap = parseAnyToMap(dataObj);
            Object subImagesObj = dataMap.get("SubImages");
            List<Map<String, Object>> subImages = parseAnyToListOfMap(subImagesObj);
            if (subImages.isEmpty()) {
                return new KvPayload(Collections.emptyMap(), Collections.emptyMap());
            }

            Map<String, Object> picked = pickSubImage(subImages, type);
            Object kvInfoObj = picked.get("KvInfo");
            Map<String, Object> kvInfo = parseAnyToMap(kvInfoObj);
            Map<String, Object> kvData = parseAnyToMap(kvInfo.get("Data"));

            Map<String, Map<String, Object>> kvDetails = parseAnyToMapOfMap(kvInfo.get("KvDetails"));
            return new KvPayload(kvData, kvDetails);
        } catch (Exception e) {
            return new KvPayload(Collections.emptyMap(), Collections.emptyMap());
        }
    }

    private Map<String, Object> pickSubImage(List<Map<String, Object>> subImages, String type) {
        if (!Objects.equals(type, "IdCard")) {
            return subImages.get(0);
        }
        for (Map<String, Object> si : subImages) {
            Object t = si.get("Type");
            if (t != null && t.toString().contains("身份证")) {
                return si;
            }
        }
        return subImages.get(0);
    }

    private OcrFieldDTO extract(Map<String, Object> kvData, Map<String, Map<String, Object>> kvDetails, String... keys) {
        if (kvData == null) kvData = Collections.emptyMap();
        if (kvDetails == null) kvDetails = Collections.emptyMap();
        for (String k : keys) {
            Object v = kvData.get(k);
            if (v == null) continue;
            String value = v.toString().trim();
            if (value.isBlank()) continue;
            Integer conf = null;
            Map<String, Object> detail = kvDetails.get(k);
            if (detail != null) {
                Object c = detail.get("ValueConfidence");
                if (c == null) c = detail.get("valueConfidence");
                if (c instanceof Number) conf = ((Number) c).intValue();
                if (conf == null && c != null) {
                    try {
                        conf = Integer.parseInt(c.toString());
                    } catch (Exception ignored) {
                    }
                }
            }
            return new OcrFieldDTO(value, conf);
        }
        return null;
    }

    private Map<String, Object> parseAnyToMap(Object value) {
        if (value == null) return Collections.emptyMap();
        try {
            if (value instanceof String s) {
                if (s.isBlank()) return Collections.emptyMap();
                return objectMapper.readValue(s, new TypeReference<Map<String, Object>>() {});
            }
            return objectMapper.convertValue(value, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private Map<String, Map<String, Object>> parseAnyToMapOfMap(Object value) {
        if (value == null) return Collections.emptyMap();
        try {
            if (value instanceof String s) {
                if (s.isBlank()) return Collections.emptyMap();
                return objectMapper.readValue(s, new TypeReference<Map<String, Map<String, Object>>>() {});
            }
            return objectMapper.convertValue(value, new TypeReference<Map<String, Map<String, Object>>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private List<Map<String, Object>> parseAnyToListOfMap(Object value) {
        if (value == null) return Collections.emptyList();
        try {
            if (value instanceof String s) {
                if (s.isBlank()) return Collections.emptyList();
                return objectMapper.readValue(s, new TypeReference<List<Map<String, Object>>>() {});
            }
            return objectMapper.convertValue(value, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private record KvPayload(Map<String, Object> kvData, Map<String, Map<String, Object>> kvDetails) {}
}

