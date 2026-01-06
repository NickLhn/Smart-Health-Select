package com.zhijian.interfaces.dto.merchant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;

/**
 * 商家运营设置 DTO
 *
 * @author TraeAI
 * @since 1.0.0
 */
@Data
@Schema(description = "商家运营设置参数")
public class MerchantSettingDTO {

    @Schema(description = "营业状态: 1营业 0休息")
    private Integer businessStatus;

    @Schema(description = "营业时间 (例如 09:00-22:00)")
    private String businessHours;

    @Schema(description = "配送费")
    private BigDecimal deliveryFee;

    @Schema(description = "起送金额")
    private BigDecimal minDeliveryAmount;

    @Schema(description = "店铺公告")
    private String notice;
}
