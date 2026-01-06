package com.zhijian.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 订单模块数据库迁移
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderDbMigration {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        System.out.println("=== OrderDbMigration INIT START ===");
        log.info("Checking order module database schema...");
        addMissingColumns();
        log.info("Order module database schema checked.");
        System.out.println("=== OrderDbMigration INIT END ===");
    }

    private void addMissingColumns() {
        addColumn("refund_reason", "ALTER TABLE `oms_order` ADD COLUMN `refund_reason` varchar(255) DEFAULT NULL COMMENT '退款原因'");
        addColumn("refund_remark", "ALTER TABLE `oms_order` ADD COLUMN `refund_remark` varchar(255) DEFAULT NULL COMMENT '退款备注'");
        addColumn("audit_reason", "ALTER TABLE `oms_order` ADD COLUMN `audit_reason` varchar(255) DEFAULT NULL COMMENT '审核不通过原因'");
        addColumn("comment_status", "ALTER TABLE `oms_order` ADD COLUMN `comment_status` int(11) DEFAULT 0 COMMENT '评价状态: 0未评价 1已评价'");
    }

    private void addColumn(String columnName, String sql) {
        try {
            // Check if column exists using information_schema
            String checkSql = "SELECT count(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'oms_order' AND COLUMN_NAME = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, columnName);
            
            if (count != null && count > 0) {
                log.info("Column {} already exists in oms_order", columnName);
                return;
            }

            jdbcTemplate.execute(sql);
            log.info("Added column {} to oms_order", columnName);
        } catch (Exception e) {
            log.warn("Failed to add column {}: {}", columnName, e.getMessage());
        }
    }
}
