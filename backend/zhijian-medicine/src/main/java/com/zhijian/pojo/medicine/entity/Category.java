package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 药品分类实体类。
 */
@Data
@TableName("pms_category")
public class Category implements Serializable {

    /**
     * 序列化版本号。
     */
    private static final long serialVersionUID = 1L;

    /**
     * 分类 ID。
     */
    @TableId
    private Long id;

    /**
     * 分类名称。
     */
    private String name;

    /**
     * 父级分类 ID。
     */
    private Long parentId;

    /**
     * 分类层级。
     */
    private Integer level;

    /**
     * 排序值。
     */
    private Integer sort;

    /**
     * 启用状态。
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
     * 子分类列表。
     */
    @TableField(exist = false)
    private List<Category> children;
}
