package com.zhijian.interfaces.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 购物车下单DTO
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "购物车下单请求参数")
public class OrderCreateFromCartDTO {

    @Schema(description = "购物车项ID列表")
    @NotEmpty(message = "请选择要购买的商品")
    private List<Long> cartItemIds;

    @Schema(description = "收货地址ID")
    @NotNull(message = "请选择收货地址")
    private Long addressId;

    @Schema(description = "优惠券ID (UserCoupon ID)")
    private Long userCouponId;

    @Schema(description = "就诊人ID (处方药必填)")
    private Long patientId;

    @Schema(description = "处方图片URL (处方药必填)")
    private String prescriptionImage;
}
