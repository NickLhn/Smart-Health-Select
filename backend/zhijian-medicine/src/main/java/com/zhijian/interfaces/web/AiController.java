package com.zhijian.interfaces.web;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.interfaces.dto.ai.ChatRequestDTO;
import com.zhijian.application.service.AiService;
import com.zhijian.application.service.MedicineService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.medicine.entity.Medicine;
import com.zhijian.interfaces.dto.ai.AiChatResponseVO;
import com.zhijian.interfaces.dto.medicine.MedicineQueryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@Tag(name = "AI智能导诊")
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiService aiService;
    private final MedicineService medicineService;

    @Operation(summary = "AI对话")
    @PostMapping("/chat")
    public Result<AiChatResponseVO> chat(@RequestBody ChatRequestDTO request) {
        String userMessage = request.getMessage();

        // 1. 尝试提取关键词
        String extractionPrompt = "分析用户输入，提取1个最核心的实体关键词（例如具体的症状、疾病或药品名称），用于数据库模糊搜索。" +
                "例如用户说'头痛发烧'，返回'头痛'。用户说'我要买阿莫西林'，返回'阿莫西林'。" +
                "只返回这一个关键词。如果用户只是打招呼或闲聊，返回'NULL'。";

        String keywords = aiService.chat(extractionPrompt, userMessage);
        log.info("AI Extracted Keywords: {}", keywords);

        List<Medicine> recommendations = Collections.emptyList();

        // 2. 如果提取到了关键词，进行搜索
        if (keywords != null && !keywords.contains("NULL") && !keywords.trim().isEmpty()) {
            // 清理关键词
            keywords = keywords.replace("。", "").replace(".", "");
            // 取第一个关键词搜索，或者组合
            String searchKeyword = keywords.split("[,，]")[0].trim();

            if (StrUtil.isNotBlank(searchKeyword)) {
                MedicineQueryDTO query = new MedicineQueryDTO();
                query.setKeyword(searchKeyword);
                query.setPage(1);
                query.setSize(3); // 取前3个

                IPage<Medicine> page = medicineService.pageList(query);
                recommendations = page.getRecords();
            }
        }

        // 3. 构建最终的AI提示词
        StringBuilder finalPrompt = new StringBuilder();
        finalPrompt.append("你是一个专业的医疗健康助手，服务于'智健优选'平台。请用专业、亲切的语气回答用户的健康咨询问题。");

        if (!recommendations.isEmpty()) {
            finalPrompt.append("\n\n系统根据用户描述在数据库中找到了以下相关药品：\n");
            for (Medicine m : recommendations) {
                finalPrompt.append("- 药品名:").append(m.getName())
                        .append("，适用症:").append(m.getIndication() != null ? StrUtil.maxLength(m.getIndication(), 50) : "暂无")
                        .append("\n");
            }
            finalPrompt.append("\n请结合上述药品（如果有合适的）回答用户的问题，并告知用户我们平台有这些药。如果推荐药品，请自然地提及药品名称。如果上述药品不相关，请忽略它们。");
        } else {
            finalPrompt.append("\n如果涉及处方药，请提醒用户需要医生处方。");
        }

        // 4. 获取最终回答
        String aiResponse = aiService.chat(finalPrompt.toString(), userMessage);

        return Result.success(new AiChatResponseVO(aiResponse, recommendations));
    }
}
