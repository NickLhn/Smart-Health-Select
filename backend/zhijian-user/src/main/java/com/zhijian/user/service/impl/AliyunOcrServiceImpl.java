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

/**
 * 阿里云OCR文字识别服务实现类
 * 
 * 提供营业执照和身份证的文字识别功能，支持从图片URL中提取关键信息
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AliyunOcrServiceImpl implements OcrService {

    private final OcrProperties ocrProperties;
    private final ObjectMapper objectMapper;

    /**
     * 阿里云OCR客户端，初始化时创建
     */
    private Client client;

    /**
     * 统一社会信用代码正则表达式（18位）
     */
    private static final Pattern CREDIT_CODE_PATTERN = Pattern.compile("\\b[0-9A-Z]{18}\\b");

    /**
     * 身份证号码正则表达式（18位）
     */
    private static final Pattern ID_NUMBER_PATTERN = Pattern.compile("\\b\\d{17}[0-9Xx]\\b");

    /**
     * 姓名标签正则表达式，支持中英文标签
     */
    private static final Pattern NAME_LABEL_PATTERN = Pattern.compile("(?:姓名|Name)[:：]?([\\p{IsHan}]{2,6})");

    /**
     * 地址标签正则表达式
     */
    private static final Pattern ADDRESS_LABEL_PATTERN = Pattern.compile("(?:住址|地址|Address)[:：]?([^\\n]{4,80})");

    /**
     * 签发机关标签正则表达式
     */
    private static final Pattern AUTHORITY_LABEL_PATTERN = Pattern.compile("(?:签发机关|签发机构|Authority)[:：]?([^\\n]{2,80})");

    /**
     * 有效期限标签正则表达式
     */
    private static final Pattern VALID_LABEL_PATTERN = Pattern.compile("(?:有效期限|有效期|Valid)[:：]?([^\\n]{4,80})");

    /**
     * 日期格式正则表达式，支持多种分隔符（. - /）
     */
    private static final Pattern DATE_PATTERN = Pattern.compile("(\\d{4})[\\.\\-/](\\d{2})[\\.\\-/](\\d{2})");

    /**
     * 日期格式化器
     */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 初始化阿里云OCR客户端
     * 
     * 在Spring容器初始化后执行，检查AccessKey配置并创建OCR客户端
     * 如果未配置AccessKey，则将client设为null，OCR功能将不可用
     */
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
            config.endpoint = "ocr-api.cn-hangzhou.aliyuncs.com";
            log.info("阿里云OCR初始化成功，使用endpoint: {}", config.endpoint);
            this.client = new Client(config);
        } catch (Exception e) {
            this.client = null;
            log.error("阿里云OCR初始化失败", e);
        }
    }

    /**
     * 识别营业执照
     * 
     * 从图片URL中提取营业执照的关键信息，包括：
     * - 统一社会信用代码
     * - 地址
     * - 企业名称
     *
     * @param imageUrl 营业执照图片的URL地址
     * @return 营业执照OCR识别结果DTO，包含提取的字段信息
     * @throws IllegalStateException 如果OCR服务未配置（AccessKey未设置）
     */
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

    /**
     * 识别身份证（正反面）
     * 
     * 从身份证正面和背面图片中提取身份信息，包括：
     * - 姓名
     * - 身份证号码（脱敏处理）
     * - 身份证号码哈希值（用于隐私保护）
     * - 地址
     * - 签发机关
     * - 有效期（起始日期、结束日期、长期标识）
     *
     * @param frontImageUrl 身份证正面图片的URL地址
     * @param backImageUrl 身份证背面图片的URL地址
     * @return 身份证OCR识别结果DTO，包含提取的字段信息
     * @throws IllegalStateException 如果OCR服务未配置（AccessKey未设置）
     */
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

    /**
     * 调用阿里云通用OCR识别接口并解析KV结构数据
     * 
     * 使用阿里云的RecognizeAllText接口识别图片中的文字，并尝试提取结构化的KV键值对数据
     *
     * @param imageUrl 图片URL地址
     * @param type 识别类型（如BusinessLicense、IdCard等）
     * @return 包含KV数据、详细数据和原始文本内容的负载对象
     */
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

    /**
     * 从KV数据中提取指定键的值
     * 
     * 依次尝试每个键名，返回第一个找到的非空值，同时提取置信度信息
     *
     * @param kvData KV键值对数据
     * @param kvDetails KV详细数据（包含置信度等信息）
     * @param keys 要尝试的键名列表
     * @return 包含值和置信度的OCR字段DTO，如果未找到返回null
     */
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

    /**
     * 将任意对象解析为Map
     * 
     * 支持JSON字符串和Map类型的对象转换
     *
     * @param value 要转换的对象
     * @return 解析后的Map，如果解析失败返回空Map
     */
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

    /**
     * 将任意对象解析为嵌套Map
     * 
     * 用于解析包含详细置信度信息的嵌套结构
     *
     * @param value 要转换的对象
     * @return 解析后的嵌套Map，如果解析失败返回空Map
     */
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

    /**
     * 将任意对象解析为Map列表
     * 
     * 用于解析OCR返回的子图片列表等数据
     *
     * @param value 要转换的对象
     * @return 解析后的Map列表，如果解析失败返回空列表
     */
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

    /**
     * 从OCR识别的原始文本内容中提取统一社会信用代码
     * 
     * 使用正则表达式匹配18位统一社会信用代码（由数字和大写字母组成）
     *
     * @param content OCR识别的原始文本内容
     * @return 提取的统一社会信用代码，如果未找到返回null
     */
    private String tryExtractCreditCodeFromContent(String content) {
        if (content == null || content.isBlank()) return null;
        Matcher m = CREDIT_CODE_PATTERN.matcher(content.replace(" ", "").toUpperCase());
        if (m.find()) return m.group();
        return null;
    }

    /**
     * 标准化OCR识别的文本内容
     * 
     * 统一换行符为\n，并去除首尾空白字符
     *
     * @param content 原始文本内容
     * @return 标准化后的文本内容
     */
    private String normalizeContent(String content) {
        if (content == null) return "";
        return content.replace("\r\n", "\n").replace("\r", "\n").trim();
    }

    /**
     * 从OCR识别的文本内容中提取姓名
     * 
     * 使用正则表达式匹配「姓名:XXX」格式的内容
     *
     * @param content OCR识别的文本内容
     * @return 包含姓名和置信度的OCR字段DTO，如果未找到返回null
     */
    private OcrFieldDTO tryExtractNameFromContent(String content) {
        if (content == null || content.isBlank()) return null;
        Matcher m = NAME_LABEL_PATTERN.matcher(content.replace(" ", ""));
        if (m.find()) {
            String v = m.group(1);
            if (v != null && !v.isBlank()) return new OcrFieldDTO(v.trim(), null);
        }
        return null;
    }

    /**
     * 从OCR识别的文本内容中提取身份证号码
     * 
     * 使用正则表达式匹配18位身份证号码
     *
     * @param content OCR识别的文本内容
     * @return 提取的身份证号码，如果未找到返回null
     */
    private String tryExtractIdNumberFromContent(String content) {
        if (content == null || content.isBlank()) return null;
        Matcher m = ID_NUMBER_PATTERN.matcher(content.replace(" ", ""));
        if (m.find()) return m.group();
        return null;
    }

    /**
     * 从OCR识别的文本内容中提取带标签的值
     * 
     * 使用给定的正则表达式模式匹配标签和对应的值
     *
     * @param content OCR识别的文本内容
     * @param p 匹配标签和值的正则表达式模式
     * @return 包含提取值和置信度的OCR字段DTO，如果未找到返回null
     */
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

    /**
     * 提取身份证号码的后4位
     *
     * @param idNumber 完整的身份证号码
     * @return 身份证号码的后4位，如果输入无效返回null
     */
    private String extractLast4(String idNumber) {
        if (idNumber == null) return null;
        String s = idNumber.trim();
        if (s.length() < 4) return null;
        return s.substring(s.length() - 4);
    }

    /**
     * 脱敏身份证号码，只显示后4位
     * 
     * 将身份证号码大部分数字替换为*，保护用户隐私
     *
     * @param idNumber 原始身份证号码
     * @return 脱敏后的身份证号码，如 ************1234
     */
    private String maskIdNumber(String idNumber) {
        if (idNumber == null) return null;
        String s = idNumber.trim();
        if (s.length() <= 4) return s;
        String last4 = s.substring(s.length() - 4);
        return "*".repeat(Math.max(0, s.length() - 4)) + last4;
    }

    /**
     * 计算输入字符串的SHA256哈希值
     * 
     * 用于对身份证号码进行哈希处理，实现隐私保护
     *
     * @param input 输入字符串
     * @return 十六进制格式的SHA256哈希值，如果处理失败返回null
     */
    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 将字节数组转换为十六进制字符串
     *
     * @param bytes 字节数组
     * @return 十六进制字符串
     */
    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * 解析身份证有效期限字符串
     * 
     * 支持多种格式：YYYY.MM.DD-YYYY.MM.DD、YYYY-MM-DD至YYYY-MM-DD、长期等
     *
     * @param raw 原始有效期限字符串
     * @return 解析后的有效期对象（包含起始日期、结束日期、长期标识）
     */
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

    /**
     * 解析日期字符串为LocalDate对象
     *
     * @param y 年份（四位）
     * @param m 月份（两位）
     * @param d 日（两位）
     * @return 解析后的LocalDate对象，如果解析失败返回null
     */
    private LocalDate parseLocalDate(String y, String m, String d) {
        try {
            return LocalDate.parse(y + "-" + m + "-" + d, DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /**
     * 使用专用营业执照API进行识别
     * 
     * 当通用OCR无法提取有效信息时的备用方案
     * 使用阿里云专门的营业执照识别接口
     *
     * @param imageUrl 营业执照图片URL
     * @return 营业执照识别结果，如果失败返回null
     */
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

    /**
     * 将任意对象转换为字符串
     * 
     * 包含null检查和空白字符trim处理
     *
     * @param v 要转换的对象
     * @return 转换后的字符串，如果输入为null返回null
     */
    private String toStr(Object v) {
        if (v == null) return null;
        String s = v.toString();
        return s == null ? null : s.trim();
    }

    /**
     * 返回第一个非空字符串
     * 
     * 依次检查参数列表，返回第一个不为null且不为空的值
     *
     * @param values 要检查的字符串数组
     * @return 第一个非空字符串，如果都不为空返回null
     */
    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    /**
     * 身份证有效期限数据记录
     * 
     * @param validFrom 有效期起始日期
     * @param validTo 有效期结束日期
     * @param validLongTerm 是否长期有效
     */
    private record ValidPeriod(LocalDate validFrom, LocalDate validTo, Boolean validLongTerm) {}

    /**
     * OCR识别结果负载数据记录
     * 
     * @param kvData 键值对数据
     * @param kvDetails 键值对详细数据（包含置信度等）
     * @param content 原始文本内容
     */
    private record KvPayload(Map<String, Object> kvData, Map<String, Map<String, Object>> kvDetails, String content) {}
}
