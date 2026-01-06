package com.zhijian.domain.user.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 就诊人实体
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("sys_patient")
@Schema(description = "就诊人信息")
public class Patient {

    @Schema(description = "主键ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    @Schema(description = "用户ID")
    private Long userId;

    @Schema(description = "姓名")
    @TableField("real_name")
    private String name;

    @Schema(description = "身份证号")
    private String idCard;

    @Schema(description = "身份证正面URL")
    private String idCardFront;

    @Schema(description = "身份证背面URL")
    private String idCardBack;

    @Schema(description = "手机号")
    private String phone;

    @Schema(description = "性别(0-未知 1-男 2-女)")
    private Integer gender;

    @Schema(description = "出生日期")
    private LocalDate birthday;

    @Schema(description = "是否默认(0-否 1-是)")
    private Integer isDefault;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
