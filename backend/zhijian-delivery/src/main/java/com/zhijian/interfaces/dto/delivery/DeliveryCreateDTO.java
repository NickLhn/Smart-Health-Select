package com.zhijian.interfaces.dto.delivery;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建配送单参数
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "创建配送单参数")
public class DeliveryCreateDTO {

    @Schema(description = "订单ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @Schema(description = "收货人姓名", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "收货人姓名不能为空")
    private String receiverName;

    @Schema(description = "收货人电话", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "收货人电话不能为空")
    private String receiverPhone;

    @Schema(description = "收货地址", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "收货地址不能为空")
    private String receiverAddress;

    @Schema(description = "店铺名称")
    private String shopName;

    @Schema(description = "店铺地址")
    private String shopAddress;

    @Schema(description = "配送费")
    private java.math.BigDecimal deliveryFee;

    @Schema(description = "是否急单")
    private Integer isUrgent;
}
