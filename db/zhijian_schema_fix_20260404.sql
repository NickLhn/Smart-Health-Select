-- 智健优选数据库结构补丁
-- 适用场景：
-- 1. 你的数据库是基于 zhijian_db.sql 导入出来的旧结构
-- 2. 现在要把表结构修到和当前代码更一致
--
-- 执行前建议：
-- 1. 先完整备份数据库
-- 2. 先执行下面的排查 SQL，确认是否存在 id 为空或重复的数据
-- 3. 如果某张表已经有主键/自增，跳过对应 ALTER 即可

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 一、执行前排查：先看是否存在空 id / 重复 id
-- =========================================================

-- 这些表在代码里都按主键表使用，但你导出的结构里很多没有主键和自增。
-- 如果下面查询有结果，需要先处理脏数据，再执行后面的 ALTER。

SELECT 'im_message' AS table_name, COUNT(*) AS null_id_count FROM im_message WHERE id IS NULL
UNION ALL
SELECT 'oms_delivery', COUNT(*) FROM oms_delivery WHERE id IS NULL
UNION ALL
SELECT 'oms_order_comment', COUNT(*) FROM oms_order_comment WHERE id IS NULL
UNION ALL
SELECT 'oms_payment_record', COUNT(*) FROM oms_payment_record WHERE id IS NULL
UNION ALL
SELECT 'oms_refund_apply', COUNT(*) FROM oms_refund_apply WHERE id IS NULL
UNION ALL
SELECT 'pms_banner', COUNT(*) FROM pms_banner WHERE id IS NULL
UNION ALL
SELECT 'pms_category', COUNT(*) FROM pms_category WHERE id IS NULL
UNION ALL
SELECT 'pms_health_article', COUNT(*) FROM pms_health_article WHERE id IS NULL
UNION ALL
SELECT 'pms_medicine', COUNT(*) FROM pms_medicine WHERE id IS NULL
UNION ALL
SELECT 'pms_medicine_comment', COUNT(*) FROM pms_medicine_comment WHERE id IS NULL
UNION ALL
SELECT 'pms_medicine_favorite', COUNT(*) FROM pms_medicine_favorite WHERE id IS NULL
UNION ALL
SELECT 'pms_medicine_footprint', COUNT(*) FROM pms_medicine_footprint WHERE id IS NULL
UNION ALL
SELECT 'sms_coupon', COUNT(*) FROM sms_coupon WHERE id IS NULL
UNION ALL
SELECT 'sms_coupon_history', COUNT(*) FROM sms_coupon_history WHERE id IS NULL
UNION ALL
SELECT 'sys_merchant', COUNT(*) FROM sys_merchant WHERE id IS NULL
UNION ALL
SELECT 'sys_patient', COUNT(*) FROM sys_patient WHERE id IS NULL
UNION ALL
SELECT 'sys_user', COUNT(*) FROM sys_user WHERE id IS NULL
UNION ALL
SELECT 'sys_user_address', COUNT(*) FROM sys_user_address WHERE id IS NULL;

-- 如果需要排查重复主键，可以单独执行类似：
-- SELECT id, COUNT(*) FROM sys_user GROUP BY id HAVING COUNT(*) > 1;

-- =========================================================
-- 二、修复主键 / 自增
-- =========================================================

-- 说明：
-- 这些表在 Java 实体里都通过 @TableId 或 IdType.AUTO 当成主键表使用。
-- 但你当前导出的 SQL 里多数只是 `id bigint DEFAULT NULL`，这会导致：
-- 1. 注册后 user.id 为空，登录签 JWT 时报 userId null
-- 2. 新增评价、收藏、配送、退款等记录时主键不可控
-- 3. MyBatis-Plus 回填主键失败

ALTER TABLE im_message
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  ADD PRIMARY KEY (id);

ALTER TABLE oms_delivery
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '配送单ID',
  ADD PRIMARY KEY (id);

ALTER TABLE oms_order_comment
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  ADD PRIMARY KEY (id);

ALTER TABLE oms_payment_record
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '支付流水ID',
  ADD PRIMARY KEY (id);

ALTER TABLE oms_refund_apply
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '退款申请ID',
  ADD PRIMARY KEY (id);

ALTER TABLE pms_banner
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '轮播图ID',
  ADD PRIMARY KEY (id);

ALTER TABLE pms_category
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  ADD PRIMARY KEY (id);

ALTER TABLE pms_health_article
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '文章ID',
  ADD PRIMARY KEY (id);

ALTER TABLE pms_medicine
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '药品ID',
  ADD PRIMARY KEY (id);

ALTER TABLE pms_medicine_comment
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '药品评价ID',
  ADD PRIMARY KEY (id);

ALTER TABLE pms_medicine_favorite
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '收藏记录ID',
  ADD PRIMARY KEY (id);

ALTER TABLE pms_medicine_footprint
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '浏览足迹ID',
  ADD PRIMARY KEY (id);

ALTER TABLE sms_coupon
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '优惠券ID',
  ADD PRIMARY KEY (id);

ALTER TABLE sms_coupon_history
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '领取记录ID',
  ADD PRIMARY KEY (id);

ALTER TABLE sys_merchant
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '商家资料ID',
  ADD PRIMARY KEY (id);

ALTER TABLE sys_patient
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '就诊人ID',
  ADD PRIMARY KEY (id);

ALTER TABLE sys_user
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  ADD PRIMARY KEY (id);

ALTER TABLE sys_user_address
  MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  ADD PRIMARY KEY (id);

-- sys_config 在代码里以 config_key 作为 @TableId 使用。
ALTER TABLE sys_config
  MODIFY COLUMN config_key VARCHAR(50) NOT NULL COMMENT '配置项键名',
  ADD PRIMARY KEY (config_key);

-- =========================================================
-- 三、补齐支付流水表字段
-- =========================================================

-- 说明：
-- 当前代码里的 oms_payment_record 已经扩展成 Stripe 版本，
-- 但你导出的表结构还是旧版，仅有最基础字段。
-- 如果不补下面这些列，Stripe 回写支付记录时会和代码结构不一致。

ALTER TABLE oms_payment_record
  ADD COLUMN provider VARCHAR(32) DEFAULT 'stripe' COMMENT '支付渠道' AFTER payment_method,
  ADD COLUMN checkout_session_id VARCHAR(128) DEFAULT NULL COMMENT 'Stripe Checkout Session ID' AFTER transaction_id,
  ADD COLUMN payment_intent_id VARCHAR(128) DEFAULT NULL COMMENT 'Stripe PaymentIntent ID' AFTER checkout_session_id,
  ADD COLUMN provider_status VARCHAR(64) DEFAULT NULL COMMENT '第三方支付状态' AFTER status,
  ADD COLUMN currency VARCHAR(16) DEFAULT 'cny' COMMENT '币种' AFTER provider_status,
  ADD COLUMN webhook_event_id VARCHAR(128) DEFAULT NULL COMMENT 'Stripe webhook事件ID' AFTER currency,
  ADD COLUMN remark VARCHAR(255) DEFAULT NULL COMMENT '备注' AFTER webhook_event_id;

-- =========================================================
-- 四、建议补的索引
-- =========================================================

-- 这些不是“必须修”，但能让常用查询更稳定。

ALTER TABLE sys_user
  ADD UNIQUE KEY uk_sys_user_username (username),
  ADD UNIQUE KEY uk_sys_user_mobile (mobile);

ALTER TABLE sys_merchant
  ADD UNIQUE KEY uk_sys_merchant_user_id (user_id);

ALTER TABLE sys_patient
  ADD KEY idx_sys_patient_user_id (user_id);

ALTER TABLE sys_user_address
  ADD KEY idx_sys_user_address_user_id (user_id);

ALTER TABLE oms_order
  ADD KEY idx_oms_order_user_id (user_id),
  ADD KEY idx_oms_order_seller_id (seller_id),
  ADD KEY idx_oms_order_status (status);

ALTER TABLE oms_order_item
  ADD KEY idx_oms_order_item_order_id (order_id);

ALTER TABLE oms_order_comment
  ADD KEY idx_oms_order_comment_order_id (order_id),
  ADD KEY idx_oms_order_comment_user_id (user_id);

ALTER TABLE oms_payment_record
  ADD KEY idx_oms_payment_record_order_id (order_id),
  ADD KEY idx_oms_payment_record_user_id (user_id),
  ADD KEY idx_oms_payment_record_transaction_id (transaction_id);

ALTER TABLE oms_refund_apply
  ADD KEY idx_oms_refund_apply_order_id (order_id),
  ADD KEY idx_oms_refund_apply_user_id (user_id);

ALTER TABLE pms_medicine
  ADD KEY idx_pms_medicine_category_id (category_id),
  ADD KEY idx_pms_medicine_seller_id (seller_id),
  ADD KEY idx_pms_medicine_status (status);

ALTER TABLE pms_medicine_comment
  ADD KEY idx_pms_medicine_comment_medicine_id (medicine_id),
  ADD KEY idx_pms_medicine_comment_user_id (user_id);

ALTER TABLE pms_medicine_favorite
  ADD KEY idx_pms_medicine_favorite_user_id (user_id),
  ADD KEY idx_pms_medicine_favorite_medicine_id (medicine_id);

ALTER TABLE pms_medicine_footprint
  ADD KEY idx_pms_medicine_footprint_user_id (user_id),
  ADD KEY idx_pms_medicine_footprint_medicine_id (medicine_id);

ALTER TABLE sms_coupon_history
  ADD KEY idx_sms_coupon_history_user_id (user_id),
  ADD KEY idx_sms_coupon_history_coupon_id (coupon_id),
  ADD KEY idx_sms_coupon_history_order_id (order_id);

ALTER TABLE im_message
  ADD KEY idx_im_message_from_user_id (from_user_id),
  ADD KEY idx_im_message_to_user_id (to_user_id),
  ADD KEY idx_im_message_create_time (create_time);

ALTER TABLE oms_delivery
  ADD KEY idx_oms_delivery_order_id (order_id),
  ADD KEY idx_oms_delivery_courier_id (courier_id);

SET FOREIGN_KEY_CHECKS = 1;

