package com.zhijian.interfaces.dto.ai;

import com.zhijian.domain.medicine.entity.Medicine;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "AI聊天响应")
public class AiChatResponseVO implements Serializable {
    @Schema(description = "AI回复文本")
    private String text;

    @Schema(description = "推荐药品列表")
    private List<Medicine> recommendations;
}
