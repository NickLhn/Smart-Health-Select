package com.zhijian.user.service.impl;

import com.aliyun.ocr_api20210707.Client;
import com.aliyun.ocr_api20210707.models.RecognizeAllTextRequest;
import com.aliyun.ocr_api20210707.models.RecognizeAllTextResponse;
import com.aliyun.ocr_api20210707.models.RecognizeBusinessLicenseRequest;
import com.aliyun.ocr_api20210707.models.RecognizeBusinessLicenseResponse;
import com.aliyun.teaopenapi.models.Config;
import com.aliyun.teautil.models.RuntimeOptions;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhijian.user.config.OcrProperties;
import com.zhijian.dto.merchant.ocr.BusinessLicenseOcrResponseDTO;
import com.zhijian.dto.merchant.ocr.IdCardOcrResponseDTO;
import com.zhijian.dto.merchant.ocr.OcrFieldDTO;
import com.zhijian.user.service.OcrService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class AliyunOcrServiceImpl implements OcrService {

    private final OcrProperties ocrProperties;
    private final ObjectMapper objectMapper;
    private Client client;

    private static final Pattern CREDIT_CODE_PATTERN = Pattern.compile("\\b[0-9A-Z]{18}\\b");
    private static final Pattern ID_NUMBER_PATTERN = Pattern.compile("\\b\\d{17}[0-9Xx]\\b");
    private static final Pattern NAME_LABEL_PATTERN = Pattern.compile("(?:姓名|Name)[:：]?([\\p{IsHan}]{2,6})");
    private static final Pattern ADDRESS_LABEL_PATTERN = Pattern.compile("(?:住址|地址|Address)[:：]?([^\\n]{4,80})");
    private static final Pattern AUTHORITY_LABEL_PATTERN = Pattern.compile("(?:签发机关|签发机构|Authority)[:：]?([^\\n]{2,80})");
    private static final Pattern VALID_LABEL_PATTERN = Pattern.compile("(?:有效期限|有效期|Valid)[:：]?([^\\n]{4,80})");
    private static final Pattern DATE_PATTERN = Pattern.compile("(\\d{4})[\\.\\-/](\\d{2})[\\.\\-/](\\d{2})");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @PostConstruct
    public void init() {
        try {
            if (ocrProperties.getAccessKeyId() == null || ocrProperties.getAccessKeyId().isBlank()
                    || ocrProperties.getAccessKeySecret() == null || ocrProperties.getAccessKeySecret().isBlank()) {
                this.client = null;
                log.warn("阿里云OCR未配置AccessKey，OCR功能不可用");
                return;
            }
            Config config = new Config()
                    .setAccessKeyId(ocrProperties.getAccessKeyId())
                    .setAccessKeySecret(ocrProperties.getAccessKeySecret());
            config.endpoint = (ocrProperties.getEndpoint() == null || ocrProperties.getEndpoint().isBlank())
                    ? "ocr-api.cn-hangzhou.aliyuncs.com"
                    : ocrProperties.getEndpoint();
            this.client = new Client(config);
        } catch (Exception e) {
            this.client = null;
            log.error("阿里云OCR初始化失败", e);
        }
    }

    @Override
    public BusinessLicenseOcrResponseDTO recognizeBusinessLicense(String imageUrl) {
        if (client == null) {
            throw new IllegalStateException("OCR服务未配置，请配置ALIYUN_OCR_ACCESS_KEY_ID/ALIYUN_OCR_ACCESS_KEY_SECRET");
        }
        KvPayload payload = recognizeAllTextKvPayload(imageUrl, "BusinessLicense");

        BusinessLicenseOcrResponseDTO resp = new BusinessLicenseOcrResponseDTO();
        resp.setCreditCode(extract(payload.kvData, payload.kvDetails, "creditCode", "socialCreditCode", "unifiedSocialCreditCode", "UnifiedSocialCreditCode"));
        resp.setAddress(extract(payload.kvData, payload.kvDetails, "businessAddress", "address", "registeredAddress", "domicile"));
        resp.setEntityName(extract(payload.kvData, payload.kvDetails, "companyName", "name", "unitName", "enterpriseName"));

        if (resp.getCreditCode() == null || resp.getCreditCode().getValue() == null || resp.getCreditCode().getValue().isBlank()) {
            String code = tryExtractCreditCodeFromContent(payload.content);
            if (code != null) {
                resp.setCreditCode(new OcrFieldDTO(code, null));
            }
        }

        if (resp.getCreditCode() == null && resp.getAddress() == null && resp.getEntityName() == null) {
            BusinessLicenseOcrResponseDTO fallback = recognizeBusinessLicenseByDedicatedApi(imageUrl);
            if (fallback != null) {
                if (resp.getCreditCode() == null) resp.setCreditCode(fallback.getCreditCode());
                if (resp.getAddress() == null) resp.setAddress(fallback.getAddress());
                if (resp.getEntityName() == null) resp.setEntityName(fallback.getEntityName());
            }
        }

        if (resp.getCreditCode() == null && resp.getAddress() == null && resp.getEntityName() == null) {
            log.warn("营业执照OCR无可用字段: url={}, kvKeys={}, contentLen={}", imageUrl, payload.kvData.keySet(), payload.content == null ? 0 : payload.content.length());
        }
        return resp;
    }

    @Override
    public IdCardOcrResponseDTO recognizeIdCardBundle(String frontImageUrl, String backImageUrl) {
        if (client == null) {
            throw new IllegalStateException("OCR服务未配置，请配置ALIYUN_OCR_ACCESS_KEY_ID/ALIYUN_OCR_ACCESS_KEY_SECRET");
        }
        KvPayload frontPayload = recognizeAllTextKvPayload(frontImageUrl, "IdCard");

        KvPayload backPayload = recognizeAllTextKvPayload(backImageUrl, "IdCard");

        IdCardOcrResponseDTO resp = new IdCardOcrResponseDTO();
        resp.setName(firstNonEmpty(
                extract(frontPayload.kvData, frontPayload.kvDetails, "name", "Name", "姓名"),
                extract(backPayload.kvData, backPayload.kvDetails, "name", "Name", "姓名")
        ));
        OcrFieldDTO rawIdNumber = firstNonEmpty(
                extract(frontPayload.kvData, frontPayload.kvDetails, "idNumber", "id_number", "IdNumber", "IDNumber", "公民身份号码", "身份证号码", "身份证号", "号码"),
                extract(backPayload.kvData, backPayload.kvDetails, "idNumber", "id_number", "IdNumber", "IDNumber", "公民身份号码", "身份证号码", "身份证号", "号码")
        );
        if (rawIdNumber != null && rawIdNumber.getValue() != null && !rawIdNumber.getValue().isBlank()) {
            String normalizedId = rawIdNumber.getValue().replace(" ", "").toUpperCase();
            resp.setIdNumberLast4(extractLast4(normalizedId));
            resp.setIdNumberHash(sha256Hex(normalizedId));
            resp.setIdNumber(new OcrFieldDTO(maskIdNumber(normalizedId), rawIdNumber.getConfidence()));
        } else {
            resp.setIdNumber(rawIdNumber);
        }
        resp.setAddress(firstNonEmpty(
                extract(frontPayload.kvData, frontPayload.kvDetails, "address", "Address", "住址", "地址"),
                extract(backPayload.kvData, backPayload.kvDetails, "address", "Address", "住址", "地址")
        ));
        resp.setAuthority(firstNonEmpty(
                extract(backPayload.kvData, backPayload.kvDetails, "authority", "issuingAuthority", "Authority", "签发机关", "签发机构"),
                extract(frontPayload.kvData, frontPayload.kvDetails, "authority", "issuingAuthority", "Authority", "签发机关", "签发机构")
        ));
        OcrFieldDTO rawValidDate = firstNonEmpty(
                extract(backPayload.kvData, backPayload.kvDetails, "validDate", "validPeriod", "ValidDate", "ValidPeriod", "有效期限", "有效期"),
                extract(frontPayload.kvData, frontPayload.kvDetails, "validDate", "validPeriod", "ValidDate", "ValidPeriod", "有效期限", "有效期")
        );
        resp.setValidDate(rawValidDate);
        if (rawValidDate != null && rawValidDate.getValue() != null && !rawValidDate.getValue().isBlank()) {
            ValidPeriod period = parseValidPeriod(rawValidDate.getValue());
            resp.setValidFrom(period.validFrom);
            resp.setValidTo(period.validTo);
            resp.setValidLongTerm(period.validLongTerm);
        }

        String content = normalizeContent(frontPayload.content) + "\n" + normalizeContent(backPayload.content);
        if (resp.getName() == null) {
            resp.setName(tryExtractNameFromContent(content));
        }
        if (resp.getIdNumberHash() == null) {
            String idNumber = tryExtractIdNumberFromContent(content);
            if (idNumber != null) {
                String normalizedId = idNumber.replace(" ", "").toUpperCase();
                resp.setIdNumberLast4(extractLast4(normalizedId));
                resp.setIdNumberHash(sha256Hex(normalizedId));
                resp.setIdNumber(new OcrFieldDTO(maskIdNumber(normalizedId), null));
            }
        }
        if (resp.getAddress() == null) {
            OcrFieldDTO address = tryExtractLabeledValueFromContent(content, ADDRESS_LABEL_PATTERN);
            if (address != null) resp.setAddress(address);
        }
        if (resp.getAuthority() == null) {
            OcrFieldDTO authority = tryExtractLabeledValueFromContent(content, AUTHORITY_LABEL_PATTERN);
            if (authority != null) resp.setAuthority(authority);
        }
        if (resp.getValidDate() == null) {
            OcrFieldDTO valid = tryExtractLabeledValueFromContent(content, VALID_LABEL_PATTERN);
            if (valid != null) {
                resp.setValidDate(valid);
                ValidPeriod period = parseValidPeriod(valid.getValue());
                resp.setValidFrom(period.validFrom);
                resp.setValidTo(period.validTo);
                resp.setValidLongTerm(period.validLongTerm);
            }
        }

        if (resp.getName() == null && resp.getIdNumber() == null && resp.getAddress() == null && resp.getAuthority() == null && resp.getValidDate() == null) {
            log.warn(
                    "身份证OCR无可用字段: frontUrl={}, backUrl={}, frontKvKeys={}, backKvKeys={}, contentLen={}",
                    frontImageUrl,
                    backImageUrl,
                    frontPayload.kvData.keySet(),
                    backPayload.kvData.keySet(),
                    content.length()
            );
        }
        return resp;
    }

    private OcrFieldDTO firstNonEmpty(OcrFieldDTO a, OcrFieldDTO b) {
        if (a != null && a.getValue() != null && !a.getValue().isBlank()) return a;
        if (b != null && b.getValue() != null && !b.getValue().isBlank()) return b;
        return a != null ? a : b;
    }

    private KvPayload recognizeAllTextKvPayload(String imageUrl, String type) {
        if (client == null) {
            return new KvPayload(Collections.emptyMap(), Collections.emptyMap(), "");
        }
        try {
            RecognizeAllTextRequest request = new RecognizeAllTextRequest()
                    .setUrl(imageUrl)
                    .setType(type);
            RecognizeAllTextResponse response = client.recognizeAllTextWithOptions(request, new RuntimeOptions());

            Object dataObj = response.getBody() == null ? null : response.getBody().getData();
            Map<String, Object> dataMap = parseAnyToMap(dataObj);
            String content = firstNonBlank(toStr(dataMap.get("Content")), toStr(dataMap.get("content")));
            Object subImagesObj = dataMap.get("SubImages");
            if (subImagesObj == null) subImagesObj = dataMap.get("subImages");
            List<Map<String, Object>> subImages = parseAnyToListOfMap(subImagesObj);
            if (subImages.isEmpty()) {
                return new KvPayload(Collections.emptyMap(), Collections.emptyMap(), content == null ? "" : content);
            }

            Map<String, Object> picked = pickSubImage(subImages, type);
            Object kvInfoObj = picked.get("KvInfo");
            if (kvInfoObj == null) kvInfoObj = picked.get("kvInfo");
            Map<String, Object> kvInfo = parseAnyToMap(kvInfoObj);
            Object kvDataObj = kvInfo.get("Data");
            if (kvDataObj == null) kvDataObj = kvInfo.get("data");
            Map<String, Object> kvData = parseAnyToMap(kvDataObj);

            Object kvDetailsObj = kvInfo.get("KvDetails");
            if (kvDetailsObj == null) kvDetailsObj = kvInfo.get("kvDetails");
            Map<String, Map<String, Object>> kvDetails = parseAnyToMapOfMap(kvDetailsObj);
            return new KvPayload(kvData, kvDetails, content == null ? "" : content);
        } catch (Exception e) {
            log.warn("阿里云OCR调用失败: type={}, url={}", type, imageUrl, e);
            return new KvPayload(Collections.emptyMap(), Collections.emptyMap(), "");
        }
    }

    private Map<String, Object> pickSubImage(List<Map<String, Object>> subImages, String type) {
        if (!Objects.equals(type, "IdCard")) {
            return subImages.get(0);
        }
        for (Map<String, Object> si : subImages) {
            Object t = si.get("Type");
            if (t == null) t = si.get("type");
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

    private String tryExtractCreditCodeFromContent(String content) {
        if (content == null || content.isBlank()) return null;
        Matcher m = CREDIT_CODE_PATTERN.matcher(content.replace(" ", "").toUpperCase());
        if (m.find()) return m.group();
        return null;
    }

    private String normalizeContent(String content) {
        if (content == null) return "";
        return content.replace("\r\n", "\n").replace("\r", "\n").trim();
    }

    private OcrFieldDTO tryExtractNameFromContent(String content) {
        if (content == null || content.isBlank()) return null;
        Matcher m = NAME_LABEL_PATTERN.matcher(content.replace(" ", ""));
        if (m.find()) {
            String v = m.group(1);
            if (v != null && !v.isBlank()) return new OcrFieldDTO(v.trim(), null);
        }
        return null;
    }

    private String tryExtractIdNumberFromContent(String content) {
        if (content == null || content.isBlank()) return null;
        Matcher m = ID_NUMBER_PATTERN.matcher(content.replace(" ", ""));
        if (m.find()) return m.group();
        return null;
    }

    private OcrFieldDTO tryExtractLabeledValueFromContent(String content, Pattern p) {
        if (content == null || content.isBlank()) return null;
        Matcher m = p.matcher(content.replace(" ", ""));
        if (m.find()) {
            String v = m.group(1);
            if (v != null) {
                String s = v.trim();
                if (!s.isBlank()) return new OcrFieldDTO(s, null);
            }
        }
        return null;
    }

    private String extractLast4(String idNumber) {
        if (idNumber == null) return null;
        String s = idNumber.trim();
        if (s.length() < 4) return null;
        return s.substring(s.length() - 4);
    }

    private String maskIdNumber(String idNumber) {
        if (idNumber == null) return null;
        String s = idNumber.trim();
        if (s.length() <= 4) return s;
        String last4 = s.substring(s.length() - 4);
        return "*".repeat(Math.max(0, s.length() - 4)) + last4;
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception e) {
            return null;
        }
    }

    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private ValidPeriod parseValidPeriod(String raw) {
        if (raw == null || raw.isBlank()) return new ValidPeriod(null, null, null);
        String normalized = raw.replace("至", "-").replace("—", "-").replace("－", "-").replace("~", "-").replace(" ", "");
        boolean longTerm = normalized.contains("长期");
        Matcher m = DATE_PATTERN.matcher(normalized);
        LocalDate first = null;
        LocalDate second = null;
        if (m.find()) {
            first = parseLocalDate(m.group(1), m.group(2), m.group(3));
            if (m.find()) {
                second = parseLocalDate(m.group(1), m.group(2), m.group(3));
            }
        }
        if (first == null && second == null && !longTerm) return new ValidPeriod(null, null, null);
        return new ValidPeriod(first, longTerm ? null : second, longTerm);
    }

    private LocalDate parseLocalDate(String y, String m, String d) {
        try {
            return LocalDate.parse(y + "-" + m + "-" + d, DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private BusinessLicenseOcrResponseDTO recognizeBusinessLicenseByDedicatedApi(String imageUrl) {
        try {
            RecognizeBusinessLicenseRequest request = new RecognizeBusinessLicenseRequest().setUrl(imageUrl);
            RecognizeBusinessLicenseResponse response = client.recognizeBusinessLicenseWithOptions(request, new RuntimeOptions());
            Object dataObj = response.getBody() == null ? null : response.getBody().getData();
            Map<String, Object> dataMap = parseAnyToMap(dataObj);
            Map<String, Object> inner = parseAnyToMap(dataMap.get("data"));

            String creditCode = firstNonBlank(
                    toStr(inner.get("creditCode")),
                    toStr(inner.get("CreditCode")),
                    toStr(inner.get("UnifiedSocialCreditCode")),
                    toStr(inner.get("unifiedSocialCreditCode"))
            );
            String address = firstNonBlank(
                    toStr(inner.get("businessAddress")),
                    toStr(inner.get("BusinessAddress")),
                    toStr(inner.get("address")),
                    toStr(inner.get("Address"))
            );
            String entityName = firstNonBlank(
                    toStr(inner.get("companyName")),
                    toStr(inner.get("CompanyName")),
                    toStr(inner.get("name")),
                    toStr(inner.get("Name"))
            );

            if ((creditCode == null || creditCode.isBlank()) && (dataMap.get("content") != null || dataMap.get("Content") != null)) {
                String content = firstNonBlank(toStr(dataMap.get("Content")), toStr(dataMap.get("content")));
                creditCode = tryExtractCreditCodeFromContent(content);
            }

            if ((creditCode == null || creditCode.isBlank()) && (address == null || address.isBlank()) && (entityName == null || entityName.isBlank())) {
                return null;
            }

            BusinessLicenseOcrResponseDTO resp = new BusinessLicenseOcrResponseDTO();
            if (creditCode != null && !creditCode.isBlank()) resp.setCreditCode(new OcrFieldDTO(creditCode, null));
            if (address != null && !address.isBlank()) resp.setAddress(new OcrFieldDTO(address, null));
            if (entityName != null && !entityName.isBlank()) resp.setEntityName(new OcrFieldDTO(entityName, null));
            return resp;
        } catch (Exception e) {
            log.warn("营业执照OCR(RecognizeBusinessLicense)调用失败: url={}", imageUrl, e);
            return null;
        }
    }

    private String toStr(Object v) {
        if (v == null) return null;
        String s = v.toString();
        return s == null ? null : s.trim();
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    private record ValidPeriod(LocalDate validFrom, LocalDate validTo, Boolean validLongTerm) {}

    private record KvPayload(Map<String, Object> kvData, Map<String, Map<String, Object>> kvDetails, String content) {}
}
