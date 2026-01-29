package com.zhijian.pojo.user.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 商家信息实体
 *
 * @author TraeAI
 * @since 1.0.0
 */
@Data
@TableName("sys_merchant")
@Schema(description = "商家信息")
public class Merchant implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "关联用户ID")
    private Long userId;

    @Schema(description = "店铺名称")
    private String shopName;

    @Schema(description = "店铺Logo")
    private String shopLogo;

    @Schema(description = "店铺简介")
    private String description;

    @Schema(description = "店铺地址")
    private String address;

    @Schema(description = "营业执照图片")
    private String licenseUrl;

    @Schema(description = "法人身份证正面")
    private String idCardFront;

    @Schema(description = "法人身份证背面")
    private String idCardBack;

    @Schema(description = "联系人姓名")
    private String contactName;

    @Schema(description = "联系电话")
    private String contactPhone;

    @Schema(description = "统一社会信用代码")
    private String creditCode;

    @Schema(description = "营业状态: 1营业 0休息")
    private Integer businessStatus;

    @Schema(description = "营业时间")
    private String businessHours;

    @Schema(description = "配送费")
    private java.math.BigDecimal deliveryFee;

    @Schema(description = "起送金额")
    private java.math.BigDecimal minDeliveryAmount;

    @Schema(description = "店铺公告")
    private String notice;

    @Schema(description = "审核状态: 0待审核 1审核通过 2审核驳回")
    private Integer auditStatus;

    @Schema(description = "审核备注")
    private String auditRemark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}

