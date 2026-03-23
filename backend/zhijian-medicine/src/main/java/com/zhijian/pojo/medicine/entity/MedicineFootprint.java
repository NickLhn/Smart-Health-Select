package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 药品浏览足迹实体类。
 */
@Data
@TableName("pms_medicine_footprint")
public class MedicineFootprint implements Serializable {

    /**
     * 足迹记录 ID。
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
     * 浏览时间。
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
