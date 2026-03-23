package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 药品实体类。
 */
@Data
@TableName("pms_medicine")
public class Medicine implements Serializable {

    /**
     * 序列化版本号。
     */
    private static final long serialVersionUID = 1L;

    /**
     * 药品 ID。
     */
    @TableId(value = "id")
    private Long id;

    /**
     * 药品名称。
     */
    private String name;

    /**
     * 分类 ID。
     */
    private Long categoryId;

    /**
     * 分类名称。
     */
    @TableField(exist = false)
    private String categoryName;

    /**
     * 主图地址。
     */
    private String mainImage;

    /**
     * 价格。
     */
    private BigDecimal price;

    /**
     * 库存。
     */
    private Integer stock;

    /**
     * 销量。
     */
    private Integer sales;

    /**
     * 规格。
     */
    private String specs;

    /**
     * 是否处方药。
     */
    private Integer isPrescription;

    /**
     * 适应症。
     */
    private String indication;

    /**
     * 用法用量。
     */
    private String usageMethod;

    /**
     * 禁忌。
     */
    private String contraindication;

    /**
     * 有效期。
     */
    private LocalDate expiryDate;

    /**
     * 生产日期。
     */
    private LocalDate productionDate;

    /**
     * 商家 ID。
     */
    private Long sellerId;

    /**
     * 商家名称。
     */
    @TableField(exist = false)
    private String sellerName;

    /**
     * 上下架状态。
     */
    private Integer status;

    /**
     * 创建时间。
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间。
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * 逻辑删除标记。
     */
    private Integer deleted;
}
