package com.zhijian.delivery.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建配送单请求对象。
 */
@Data
@Schema(description = "创建配送单参数")
public class DeliveryCreateDTO {

    /**
     * 订单 ID。
     */
    @Schema(description = "订单ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    /**
     * 收货人姓名。
     */
    @Schema(description = "收货人姓名", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "收货人姓名不能为空")
    private String receiverName;

    /**
     * 收货人电话。
     */
    @Schema(description = "收货人电话", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "收货人电话不能为空")
    private String receiverPhone;

    /**
     * 收货地址。
     */
    @Schema(description = "收货地址", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "收货地址不能为空")
    private String receiverAddress;

    /**
     * 店铺名称。
     */
    @Schema(description = "店铺名称")
    private String shopName;

    /**
     * 店铺地址。
     */
    @Schema(description = "店铺地址")
    private String shopAddress;

    /**
     * 配送费。
     */
    @Schema(description = "配送费")
    private java.math.BigDecimal deliveryFee;

    /**
     * 是否急单。
     */
    @Schema(description = "是否急单")
    private Integer isUrgent;
}
