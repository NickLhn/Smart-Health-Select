package com.zhijian.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.Resource;

@Slf4j
@Configuration
public class DbMigrationConfig implements CommandLineRunner {

    @Resource
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking database schema...");
        try {
            addColumnIfNotExists("sys_merchant", "contact_name", "varchar(50) COMMENT '联系人姓名'");
            addColumnIfNotExists("sys_merchant", "contact_phone", "varchar(20) COMMENT '联系电话'");
            addColumnIfNotExists("sys_merchant", "credit_code", "varchar(50) COMMENT '统一社会信用代码'");
            addColumnIfNotExists("sys_merchant", "id_card_front", "varchar(255) DEFAULT NULL COMMENT '法人身份证正面'");
            addColumnIfNotExists("sys_merchant", "id_card_back", "varchar(255) DEFAULT NULL COMMENT '法人身份证背面'");
            
            // 商家运营设置
            addColumnIfNotExists("sys_merchant", "business_status", "tinyint(4) DEFAULT 1 COMMENT '营业状态: 1营业 0休息'");
            addColumnIfNotExists("sys_merchant", "business_hours", "varchar(50) DEFAULT '09:00-22:00' COMMENT '营业时间'");
            addColumnIfNotExists("sys_merchant", "delivery_fee", "decimal(10,2) DEFAULT 0.00 COMMENT '配送费'");
            addColumnIfNotExists("sys_merchant", "min_delivery_amount", "decimal(10,2) DEFAULT 0.00 COMMENT '起送金额'");
            addColumnIfNotExists("sys_merchant", "notice", "varchar(255) DEFAULT NULL COMMENT '店铺公告'");

            // 系统配置表
            createSysConfigTable();

        } catch (Exception e) {
            log.error("Database migration failed", e);
        }
    }

    private void createSysConfigTable() {
        try {
            String sql = "CREATE TABLE IF NOT EXISTS `sys_config` (" +
                    "`config_key` varchar(100) NOT NULL COMMENT '配置键'," +
                    "`config_value` text COMMENT '配置值'," +
                    "`description` varchar(255) DEFAULT NULL COMMENT '描述'," +
                    "PRIMARY KEY (`config_key`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表'";
            jdbcTemplate.execute(sql);
            log.info("Checked/Created table sys_config");
        } catch (Exception e) {
            log.error("Failed to create sys_config table", e);
        }
    }

    private void addColumnIfNotExists(String tableName, String columnName, String columnDefinition) {
        try {
            // 简单的幂等处理：尝试添加，如果失败（通常是已存在）则忽略
            // 更严谨的做法是查询 information_schema，但这里从简
            String sql = String.format("ALTER TABLE %s ADD COLUMN %s %s", tableName, columnName, columnDefinition);
            jdbcTemplate.execute(sql);
            log.info("Added column {} to {}", columnName, tableName);
        } catch (Exception e) {
            // 假设错误是因为列已存在
            log.debug("Column {} probably already exists in {}: {}", columnName, tableName, e.getMessage());
        }
    }
}
