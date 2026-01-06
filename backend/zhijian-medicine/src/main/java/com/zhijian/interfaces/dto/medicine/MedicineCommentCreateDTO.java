package com.zhijian.interfaces.dto.medicine;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "创建评价DTO")
public class MedicineCommentCreateDTO {

    @Schema(description = "订单ID")
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @Schema(description = "药品ID")
    @NotNull(message = "药品ID不能为空")
    private Long medicineId;

    @Schema(description = "评分 1-5")
    @NotNull(message = "评分不能为空")
    @Min(1)
    @Max(5)
    private Integer star;

    @Schema(description = "评价内容")
    @NotBlank(message = "评价内容不能为空")
    private String content;

    @Schema(description = "图片列表(逗号分隔)")
    private String images;
    
    // 以下字段不需要前端传，后端从Token获取
    @Schema(hidden = true)
    private Long userId;
    
    @Schema(hidden = true)
    private String userName;
    
    @Schema(hidden = true)
    private String userAvatar;
}
