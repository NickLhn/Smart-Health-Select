package com.zhijian.dto.medicine;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 药品创建与更新请求对象。
 */
@Data
@Schema(description = "药品信息参数")
public class MedicineDTO {

    /**
     * 药品名称。
     */
    @Schema(description = "药品名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "药品名称不能为空")
    private String name;

    /**
     * 分类 ID。
     */
    @Schema(description = "分类ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "分类ID不能为空")
    private Long categoryId;

    /**
     * 主图地址。
     */
    @Schema(description = "主图URL")
    private String mainImage;

    /**
     * 价格。
     */
    @Schema(description = "价格", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "价格不能为空")
    @DecimalMin(value = "0.01", message = "价格必须大于0")
    private BigDecimal price;

    /**
     * 库存。
     */
    @Schema(description = "库存", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "库存不能为空")
    @Min(value = 0, message = "库存不能小于0")
    private Integer stock;

    /**
     * 是否处方药。
     */
    @Schema(description = "是否处方药 (1是 0否)", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "请选择是否处方药")
    private Integer isPrescription;

    /**
     * 适应症。
     */
    @Schema(description = "适应症")
    private String indication;

    /**
     * 用法用量。
     */
    @Schema(description = "用法用量")
    private String usageMethod;

    /**
     * 禁忌。
     */
    @Schema(description = "禁忌")
    private String contraindication;

    /**
     * 有效期。
     */
    @Schema(description = "有效期至 (yyyy-MM-dd)")
    @NotNull(message = "有效期不能为空")
    private LocalDate expiryDate;

    /**
     * 生产日期。
     */
    @Schema(description = "生产日期 (yyyy-MM-dd)")
    @NotNull(message = "生产日期不能为空")
    private LocalDate productionDate;
}
