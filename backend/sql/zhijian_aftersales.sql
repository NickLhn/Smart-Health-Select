
-- 售后/退款申请表
DROP TABLE IF EXISTS `oms_refund_apply`;
CREATE TABLE `oms_refund_apply` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL COMMENT '订单ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `type` int(1) DEFAULT '1' COMMENT '类型: 1仅退款 2退货退款',
  `reason` varchar(255) DEFAULT NULL COMMENT '退款原因',
  `amount` decimal(10,2) DEFAULT NULL COMMENT '退款金额',
  `images` varchar(1000) DEFAULT NULL COMMENT '凭证图片(JSON数组)',
  `original_order_status` int(1) DEFAULT NULL COMMENT '原订单状态',
  `status` int(1) DEFAULT '0' COMMENT '状态: 0待审核 1审核通过 2审核拒绝',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `audit_reason` varchar(255) DEFAULT NULL COMMENT '审核备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后/退款申请表';
