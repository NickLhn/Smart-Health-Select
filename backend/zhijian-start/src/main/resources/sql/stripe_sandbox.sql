CREATE TABLE IF NOT EXISTS `oms_payment_batch` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `batch_no` varchar(64) NOT NULL COMMENT '支付批次号',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `order_ids_json` text NOT NULL COMMENT '订单ID列表JSON',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `currency` varchar(16) NOT NULL DEFAULT 'cny' COMMENT '币种',
  `provider` varchar(32) NOT NULL DEFAULT 'stripe' COMMENT '支付渠道',
  `provider_status` varchar(64) DEFAULT NULL COMMENT '第三方支付状态',
  `checkout_session_id` varchar(128) DEFAULT NULL COMMENT 'Stripe Checkout Session ID',
  `payment_intent_id` varchar(128) DEFAULT NULL COMMENT 'Stripe PaymentIntent ID',
  `status` int NOT NULL DEFAULT 0 COMMENT '0待支付 1已支付 2已取消 3已过期 4支付失败',
  `webhook_event_id` varchar(128) DEFAULT NULL COMMENT 'Stripe webhook事件ID',
  `expire_time` datetime DEFAULT NULL COMMENT '支付过期时间',
  `paid_time` datetime DEFAULT NULL COMMENT '支付完成时间',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_batch_no` (`batch_no`),
  UNIQUE KEY `uk_checkout_session_id` (`checkout_session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stripe支付批次表';

ALTER TABLE `oms_payment_record`
  ADD COLUMN IF NOT EXISTS `provider` varchar(32) DEFAULT NULL COMMENT '支付渠道' AFTER `payment_method`,
  ADD COLUMN IF NOT EXISTS `checkout_session_id` varchar(128) DEFAULT NULL COMMENT 'Stripe Checkout Session ID' AFTER `transaction_id`,
  ADD COLUMN IF NOT EXISTS `payment_intent_id` varchar(128) DEFAULT NULL COMMENT 'Stripe PaymentIntent ID' AFTER `checkout_session_id`,
  ADD COLUMN IF NOT EXISTS `provider_status` varchar(64) DEFAULT NULL COMMENT '第三方支付状态' AFTER `status`,
  ADD COLUMN IF NOT EXISTS `currency` varchar(16) DEFAULT 'cny' COMMENT '币种' AFTER `provider_status`,
  ADD COLUMN IF NOT EXISTS `webhook_event_id` varchar(128) DEFAULT NULL COMMENT 'Stripe webhook事件ID' AFTER `currency`,
  ADD COLUMN IF NOT EXISTS `remark` varchar(255) DEFAULT NULL COMMENT '备注' AFTER `webhook_event_id`;

ALTER TABLE `oms_order`
  ADD COLUMN IF NOT EXISTS `pay_expire_time` datetime DEFAULT NULL COMMENT '待支付截止时间' AFTER `payment_time`;
