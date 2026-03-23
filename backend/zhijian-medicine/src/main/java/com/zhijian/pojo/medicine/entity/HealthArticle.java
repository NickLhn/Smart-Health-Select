package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 健康资讯实体类。
 */
@Data
@TableName("pms_health_article")
public class HealthArticle implements Serializable {

    /**
     * 序列化版本号。
     */
    private static final long serialVersionUID = 1L;

    /**
     * 资讯 ID。
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 标题。
     */
    private String title;

    /**
     * 分类。
     */
    private String category;

    /**
     * 摘要。
     */
    private String summary;

    /**
     * 正文内容。
     */
    private String content;

    /**
     * 封面图。
     */
    private String coverImage;

    /**
     * 发布状态。
     */
    private Integer status;

    /**
     * 浏览量。
     */
    private Integer views;

    /**
     * 创建时间。
     */
    private LocalDateTime createTime;

    /**
     * 更新时间。
     */
    private LocalDateTime updateTime;
}
