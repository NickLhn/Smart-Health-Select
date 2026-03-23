package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 轮播图实体类。
 */
@Data
@TableName("pms_banner")
public class Banner implements Serializable {

    /**
     * 轮播图 ID。
     */
    @TableId
    private Long id;

    /**
     * 标题。
     */
    private String title;

    /**
     * 图片地址。
     */
    private String imageUrl;

    /**
     * 跳转链接。
     */
    private String linkUrl;

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
}
