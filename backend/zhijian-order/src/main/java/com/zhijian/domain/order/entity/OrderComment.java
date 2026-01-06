package com.zhijian.domain.order.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 订单评价实体类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("oms_order_comment")
public class OrderComment implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 用户名 (快照)
     */
    private String userName;

    /**
     * 用户头像 (快照)
     */
    private String userAvatar;

    /**
     * 药品ID
     */
    private Long medicineId;

    /**
     * 评分 (1-5)
     */
    private Integer rating;

    /**
     * 评价内容
     */
    private String content;

    /**
     * 评价图片 (JSON数组)
     */
    private String images;

    /**
     * 商家回复
     */
    private String reply;

    /**
     * 回复时间
     */
    private LocalDateTime replyTime;

    /**
     * 状态 (0:显示 1:隐藏)
     */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
