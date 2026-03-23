package com.zhijian.pojo;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 订单评价实体类。
 */
@Data
@TableName("oms_order_comment")
public class OrderComment implements Serializable {

    /**
     * 评价 ID。
     */
    @TableId
    private Long id;

    /**
     * 订单 ID。
     */
    private Long orderId;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 用户名。
     */
    private String userName;

    /**
     * 用户头像。
     */
    private String userAvatar;

    /**
     * 药品 ID。
     */
    private Long medicineId;

    /**
     * 评分。
     */
    private Integer rating;

    /**
     * 评价内容。
     */
    private String content;

    /**
     * 评价图片。
     */
    private String images;

    /**
     * 商家回复。
     */
    private String reply;

    /**
     * 回复时间。
     */
    private LocalDateTime replyTime;

    /**
     * 显示状态。
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
