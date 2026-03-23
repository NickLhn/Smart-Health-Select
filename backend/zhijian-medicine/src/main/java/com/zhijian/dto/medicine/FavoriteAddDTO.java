package com.zhijian.dto.medicine;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

/**
 * 收藏药品请求对象。
 */
@Data
@Schema(description = "收藏药品请求参数")
public class FavoriteAddDTO implements Serializable {

    /**
     * 药品 ID。
     */
    @Schema(description = "药品ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "药品ID不能为空")
    private Long medicineId;
}
