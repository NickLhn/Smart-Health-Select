package com.zhijian.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 药品模块数据库迁移
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MedicineDbMigration {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        log.info("Checking medicine module database schema...");
        createCommentTable();
        createImMessageTable();
        addColumn("pms_medicine", "specs", "varchar(100) DEFAULT NULL COMMENT '规格'");
        updateDefaultSpecs();
        log.info("Medicine module database schema checked.");
    }

    private void createImMessageTable() {
        try {
            String sql = """
                CREATE TABLE IF NOT EXISTS im_message (
                    id bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
                    from_user_id bigint(20) NOT NULL COMMENT '发送者ID',
                    to_user_id bigint(20) NOT NULL COMMENT '接收者ID',
                    content text COMMENT '消息内容',
                    type int(11) DEFAULT 0 COMMENT '消息类型: 0文本 1图片',
                    read_status int(11) DEFAULT 0 COMMENT '读取状态: 0未读 1已读',
                    create_time datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                    PRIMARY KEY (id),
                    KEY idx_from_to (from_user_id, to_user_id),
                    KEY idx_to_read (to_user_id, read_status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IM消息表';
            """;
            jdbcTemplate.execute(sql);
            log.info("Checked/Created table im_message");
        } catch (Exception e) {
            log.error("Failed to create table im_message", e);
        }
    }

    private void updateDefaultSpecs() {
        try {
            String sql = "UPDATE pms_medicine SET specs = '标准规格' WHERE specs IS NULL";
            int count = jdbcTemplate.update(sql);
            if (count > 0) {
                log.info("Updated {} medicines with default specs", count);
            }
        } catch (Exception e) {
            log.warn("Failed to update default specs: {}", e.getMessage());
        }
    }

    private void addColumn(String tableName, String columnName, String columnDefinition) {
        try {
            // Check if column exists using information_schema
            String checkSql = "SELECT count(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, tableName, columnName);
            
            if (count != null && count > 0) {
                log.info("Column {} already exists in {}", columnName, tableName);
                return;
            }

            String sql = String.format("ALTER TABLE %s ADD COLUMN %s %s", tableName, columnName, columnDefinition);
            log.info("Executing SQL: {}", sql);
            jdbcTemplate.execute(sql);
            log.info("Added column {} to {}", columnName, tableName);
        } catch (Exception e) {
            log.warn("Failed to add column {} to {}: {}", columnName, tableName, e.getMessage());
        }
    }

    private void createCommentTable() {
        try {
            String sql = """
                CREATE TABLE IF NOT EXISTS `pms_medicine_comment` (
                  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
                  `medicine_id` bigint(20) NOT NULL COMMENT '药品ID',
                  `order_id` bigint(20) NOT NULL COMMENT '订单ID',
                  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
                  `user_name` varchar(64) DEFAULT NULL COMMENT '用户名',
                  `user_avatar` varchar(255) DEFAULT NULL COMMENT '用户头像',
                  `star` int(11) NOT NULL DEFAULT '5' COMMENT '评分(1-5)',
                  `content` varchar(500) DEFAULT NULL COMMENT '评价内容',
                  `images` text DEFAULT NULL COMMENT '评价图片(逗号分隔)',
                  `reply` varchar(500) DEFAULT NULL COMMENT '商家回复',
                  `reply_time` datetime DEFAULT NULL COMMENT '回复时间',
                  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除',
                  PRIMARY KEY (`id`),
                  KEY `idx_medicine_id` (`medicine_id`),
                  KEY `idx_user_id` (`user_id`),
                  KEY `idx_order_id` (`order_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='药品评价表';
            """;
            jdbcTemplate.execute(sql);
            log.info("Checked/Created table pms_medicine_comment");
        } catch (Exception e) {
            log.error("Failed to create table pms_medicine_comment", e);
        }
    }
}
