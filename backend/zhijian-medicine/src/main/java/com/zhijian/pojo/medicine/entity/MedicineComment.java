package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 药品评价实体类。
 */
@Data
@TableName("pms_medicine_comment")
public class MedicineComment implements Serializable {

    /**
     * 评价 ID。
     */
    @TableId
    private Long id;

    /**
     * 药品 ID。
     */
    private Long medicineId;

    /**
     * 订单 ID。
     */
    private Long orderId;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 用户名。
     */
    private String userName;

    /**
     * 用户头像。
     */
    private String userAvatar;

    /**
     * 评分。
     */
    private Integer star;

    /**
     * 评价内容。
     */
    private String content;

    /**
     * 图片列表。
     */
    private String images;

    /**
     * 商家回复内容。
     */
    private String reply;

    /**
     * 回复时间。
     */
    private LocalDateTime replyTime;

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
    @TableLogic
    private Boolean deleted;

    /**
     * 药品名称。
     */
    @TableField(exist = false)
    private String medicineName;

    /**
     * 药品图片。
     */
    @TableField(exist = false)
    private String medicineImage;
}
