package com.zhijian.pojo;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单项实体类。
 */
@Data
@TableName("oms_order_item")
public class OrderItem implements Serializable {

    /**
     * 订单项 ID。
     */
    @TableId
    private Long id;

    /**
     * 订单 ID。
     */
    private Long orderId;

    /**
     * 药品 ID。
     */
    private Long medicineId;

    /**
     * 药品名称。
     */
    private String medicineName;

    /**
     * 药品价格。
     */
    private BigDecimal medicinePrice;

    /**
     * 药品图片。
     */
    @TableField(exist = false)
    private String medicineImage;

    /**
     * 购买数量。
     */
    @TableField("quantity")
    private Integer count;

    /**
     * 总价格。
     */
    @TableField("total_price")
    private BigDecimal totalPrice;

    /**
     * 创建时间。
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
