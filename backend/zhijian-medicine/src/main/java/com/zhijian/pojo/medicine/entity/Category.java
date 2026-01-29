package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 药品分类实体类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("pms_category")
public class Category implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 分类名称
     */
    private String name;

    /**
     * 父级ID
     */
    private Long parentId;

    /**
     * 层级
     */
    private Integer level;

    /**
     * 排序
     */
    private Integer sort;

    /**
     * 状态: 1启用 0禁用
     */
    private Integer status;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * 子分类列表
     */
    @TableField(exist = false)
    private java.util.List<Category> children;
}

