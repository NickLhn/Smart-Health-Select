package com.zhijian.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 购物车下单请求对象。
 */
@Data
@Schema(description = "购物车下单请求参数")
public class OrderCreateFromCartDTO {

    /**
     * 购物车项 ID 列表。
     */
    @Schema(description = "购物车项ID列表")
    @NotEmpty(message = "请选择要购买的商品")
    private List<Long> cartItemIds;

    /**
     * 收货地址 ID。
     */
    @Schema(description = "收货地址ID")
    @NotNull(message = "请选择收货地址")
    private Long addressId;

    /**
     * 用户优惠券记录 ID。
     */
    @Schema(description = "优惠券ID (UserCoupon ID)")
    private Long userCouponId;

    /**
     * 就诊人 ID。
     */
    @Schema(description = "就诊人ID (处方药必填)")
    private Long patientId;

    /**
     * 处方图片地址。
     */
    @Schema(description = "处方图片URL (处方药必填)")
    private String prescriptionImage;
}
