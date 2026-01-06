package com.zhijian.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DbRepairConfig {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        log.info("Starting database repair...");
        
        // Fix for missing refund_reason column in oms_order
        addColumn("oms_order", "refund_reason", "varchar(255) DEFAULT NULL COMMENT '退款原因'");
        addColumn("oms_order", "refund_remark", "varchar(255) DEFAULT NULL COMMENT '退款备注'");
        addColumn("oms_order", "audit_reason", "varchar(255) DEFAULT NULL COMMENT '审核不通过原因'");
        addColumn("oms_order", "comment_status", "int(11) DEFAULT 0 COMMENT '评价状态: 0未评价 1已评价'");
        
        log.info("Database repair completed.");
    }

    private void addColumn(String tableName, String columnName, String columnDefinition) {
        try {
            // First check if column exists
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
            log.warn("Failed to add column {} to {}: {} ({})", columnName, tableName, e.getMessage(), e.getClass().getName());
        }
    }
}
