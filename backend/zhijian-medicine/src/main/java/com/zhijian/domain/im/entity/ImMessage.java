package com.zhijian.domain.im.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("im_message")
public class ImMessage implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long fromUserId;
    private Long toUserId;
    private String content;
    
    // 0: text, 1: image
    private Integer type;
    
    // 0: unread, 1: read
    private Integer readStatus;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
