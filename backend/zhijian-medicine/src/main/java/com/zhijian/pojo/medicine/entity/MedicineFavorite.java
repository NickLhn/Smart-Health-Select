package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 药品收藏实体类。
 */
@Data
@TableName("pms_medicine_favorite")
public class MedicineFavorite implements Serializable {

    /**
     * 收藏记录 ID。
     */
    @TableId
    private Long id;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 药品 ID。
     */
    private Long medicineId;

    /**
     * 创建时间。
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
