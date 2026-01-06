package com.zhijian.domain.user.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 系统配置实体
 *
 * @author TraeAI
 * @since 1.0.0
 */
@Data
@TableName("sys_config")
@Schema(description = "系统配置")
public class SysConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId
    @Schema(description = "配置键")
    private String configKey;

    @Schema(description = "配置值")
    private String configValue;

    @Schema(description = "描述")
    private String description;
}
