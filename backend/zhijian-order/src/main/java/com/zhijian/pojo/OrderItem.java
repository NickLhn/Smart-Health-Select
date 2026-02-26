package com.zhijian.pojo;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单详情实体类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("oms_order_item")
public class OrderItem implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 药品ID
     */
    private Long medicineId;

    /**
     * 药品名称
     */
    private String medicineName;

    /**
     * 药品价格
     */
    private BigDecimal medicinePrice;

    /**
     * 药品图片
     */
    @TableField(exist = false)
    private String medicineImage;

    /**
     * 购买数量
     */
    @TableField("quantity")
    private Integer count;

    /**
     * 总价格
     */
    @TableField("total_price")
    private BigDecimal totalPrice;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}

