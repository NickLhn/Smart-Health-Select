package com.zhijian.pojo.im.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 即时通讯消息实体类。
 */
@Data
@TableName("im_message")
public class ImMessage implements Serializable {

    /**
     * 消息 ID。
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 发送方用户 ID。
     */
    private Long fromUserId;

    /**
     * 接收方用户 ID。
     */
    private Long toUserId;

    /**
     * 消息内容。
     */
    private String content;

    /**
     * 消息类型。
     */
    private Integer type;

    /**
     * 已读状态。
     */
    private Integer readStatus;

    /**
     * 创建时间。
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
