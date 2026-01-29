package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 药品评价实体
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("pms_medicine_comment")
public class MedicineComment implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long medicineId;

    private Long orderId;

    private Long userId;

    private String userName;

    private String userAvatar;

    /**
     * 评分 1-5
     */
    private Integer star;

    private String content;

    /**
     * 图片列表，逗号分隔
     */
    private String images;

    private String reply;

    private LocalDateTime replyTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Boolean deleted;

    @TableField(exist = false)
    private String medicineName;

    @TableField(exist = false)
    private String medicineImage;
}

