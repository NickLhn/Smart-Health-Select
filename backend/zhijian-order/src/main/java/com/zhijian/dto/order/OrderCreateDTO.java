package com.zhijian.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建订单请求参数
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "创建订单请求参数")
public class OrderCreateDTO {

    @Schema(description = "药品ID", requiredMode = Schema.RequiredMode.REQUIRED, example = "1")
    @NotNull(message = "药品ID不能为空")
    private Long medicineId;

    @Schema(description = "购买数量", requiredMode = Schema.RequiredMode.REQUIRED, example = "2")
    @NotNull(message = "购买数量不能为空")
    @Min(value = 1, message = "购买数量至少为1")
    private Integer quantity;

    @Schema(description = "收货人姓名", requiredMode = Schema.RequiredMode.REQUIRED, example = "张三")
    private String receiverName;

    @Schema(description = "收货人电话", requiredMode = Schema.RequiredMode.REQUIRED, example = "13800138000")
    private String receiverPhone;

    @Schema(description = "收货地址", requiredMode = Schema.RequiredMode.REQUIRED, example = "北京市朝阳区")
    private String receiverAddress;

    @Schema(description = "优惠券ID (UserCoupon ID)")
    private Long userCouponId;

    @Schema(description = "就诊人ID (处方药必填)")
    private Long patientId;

    @Schema(description = "处方图片URL (处方药必填)")
    private String prescriptionImage;
}

