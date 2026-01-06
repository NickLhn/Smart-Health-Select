package com.zhijian.interfaces.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 订单查询参数 DTO
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "订单查询参数")
public class OrderQueryDTO {

    @Schema(description = "订单状态: 0待支付 1待发货 2待收货 3已完成 4已取消 7待审核")
    private Integer status;
    
    @Schema(description = "审核状态: 0-无需审核 1-待审核 2-审核通过 3-审核拒绝")
    private Integer auditStatus;

    @Schema(description = "页码", defaultValue = "1")
    private Integer page = 1;

    @Schema(description = "每页大小", defaultValue = "10")
    private Integer size = 10;
    
    @Schema(description = "商家ID (内部使用)")
    private Long sellerId;
}
