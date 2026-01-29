package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 药品收藏实体类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("pms_medicine_favorite")
public class MedicineFavorite implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 药品ID
     */
    private Long medicineId;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}

