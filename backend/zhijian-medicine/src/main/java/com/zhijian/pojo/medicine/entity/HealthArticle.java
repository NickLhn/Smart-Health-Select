package com.zhijian.pojo.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("pms_health_article")
public class HealthArticle implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private String title;

    private String category;

    private String summary;

    private String content;

    private String coverImage;

    private Integer status; // 1: published, 0: draft

    private Integer views;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}

