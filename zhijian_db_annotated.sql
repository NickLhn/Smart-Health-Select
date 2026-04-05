/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80408 (8.4.8)
 Source Host           : localhost:3306
 Source Schema         : zhijian_db

 Target Server Type    : MySQL
 Target Server Version : 80408 (8.4.8)
 File Encoding         : 65001

 Date: 04/04/2026 12:32:36
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for cart_item
-- ----------------------------
DROP TABLE IF EXISTS `cart_item`;
CREATE TABLE `cart_item` (
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `medicine_id` bigint NOT NULL COMMENT '药品ID',
  `count` int NOT NULL DEFAULT '1' COMMENT '数量',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='购物车表';

-- ----------------------------
-- Table structure for dms_delivery
-- ----------------------------
DROP TABLE IF EXISTS `dms_delivery`;
CREATE TABLE `dms_delivery` (
  `order_id` bigint NOT NULL COMMENT '关联订单ID',
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '配送记录ID',
  `rider_id` bigint DEFAULT NULL COMMENT '骑手ID',
  `rider_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '骑手姓名',
  `rider_phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '骑手联系电话',
  `status` int DEFAULT '0' COMMENT '配送状态: 0待抢单, 1配送中, 2已送达, 3异常',
  `current_lat` decimal(10,6) DEFAULT NULL COMMENT '当前纬度',
  `current_lng` decimal(10,6) DEFAULT NULL COMMENT '当前经度',
  `pickup_time` datetime DEFAULT NULL COMMENT '取货时间',
  `arrive_time` datetime DEFAULT NULL COMMENT '送达时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='配送信息表';

-- ----------------------------
-- Table structure for im_message
-- ----------------------------
DROP TABLE IF EXISTS `im_message`;
CREATE TABLE `im_message` (
  `id` bigint DEFAULT NULL COMMENT '消息ID',
  `from_user_id` bigint DEFAULT NULL COMMENT '发送方用户ID',
  `to_user_id` bigint DEFAULT NULL COMMENT '接收方用户ID',
  `content` text COLLATE utf8mb4_general_ci COMMENT '消息内容',
  `type` int DEFAULT NULL COMMENT '消息类型: 1文本等',
  `read_status` int DEFAULT NULL COMMENT '读取状态: 0未读 1已读',
  `create_time` datetime DEFAULT NULL COMMENT '发送时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='即时通讯消息表';

-- ----------------------------
-- Table structure for oms_delivery
-- ----------------------------
DROP TABLE IF EXISTS `oms_delivery`;
CREATE TABLE `oms_delivery` (
  `id` bigint DEFAULT NULL COMMENT '配送单ID',
  `order_id` bigint DEFAULT NULL COMMENT '关联订单ID',
  `courier_id` bigint DEFAULT NULL COMMENT '骑手用户ID',
  `courier_name` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '骑手姓名',
  `courier_phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '骑手手机号',
  `receiver_name` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人姓名',
  `receiver_phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人手机号',
  `receiver_address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货地址',
  `status` int DEFAULT NULL COMMENT '配送状态: 0待接单 1配送中 2已送达 3异常',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `shop_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '发货店铺名称',
  `shop_address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '发货店铺地址',
  `delivery_fee` decimal(10,2) DEFAULT NULL COMMENT '配送费用',
  `proof_image` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配送完成凭证图片',
  `is_urgent` int DEFAULT NULL COMMENT '是否急单: 0否 1是',
  `verify_code` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配送核销码',
  `exception_status` int DEFAULT NULL COMMENT '异常状态: 0正常 1异常',
  `exception_reason` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '异常原因'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单配送单表';

-- ----------------------------
-- Table structure for oms_order
-- ----------------------------
DROP TABLE IF EXISTS `oms_order`;
CREATE TABLE `oms_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '订单编号',
  `user_id` bigint DEFAULT NULL COMMENT '下单用户ID',
  `patient_id` bigint DEFAULT NULL COMMENT '购药人/患者ID',
  `seller_id` bigint DEFAULT NULL COMMENT '商家ID',
  `total_amount` decimal(10,2) DEFAULT NULL COMMENT '订单原始总金额',
  `coupon_amount` decimal(10,2) DEFAULT NULL COMMENT '优惠券抵扣金额',
  `pay_amount` decimal(10,2) DEFAULT NULL COMMENT '用户实付金额',
  `coupon_history_id` bigint DEFAULT NULL COMMENT '使用的优惠券领取记录ID',
  `status` int DEFAULT NULL COMMENT '订单状态: 0待支付 1已支付 2已取消 3已发货 4已完成 5退款中 6已超时等',
  `receiver_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人姓名',
  `receiver_phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人手机号',
  `receiver_address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货详细地址',
  `prescription_image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '处方图片',
  `pharmacist_audit_status` tinyint DEFAULT NULL COMMENT '药师审核状态: 0待审 1通过 2驳回',
  `pickup_code` char(6) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '取货码',
  `receive_code` char(6) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货确认码',
  `payment_time` datetime DEFAULT NULL COMMENT '支付完成时间',
  `pay_expire_time` datetime DEFAULT NULL COMMENT '待支付截止时间',
  `delivery_time` datetime DEFAULT NULL COMMENT '发货/配送开始时间',
  `finish_time` datetime DEFAULT NULL COMMENT '订单完成时间',
  `create_time` datetime DEFAULT NULL COMMENT '下单时间',
  `update_time` datetime DEFAULT NULL COMMENT '最后更新时间',
  `comment_status` int DEFAULT NULL COMMENT '评价状态: 0未评价 1已评价',
  `refund_reason` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '退款原因',
  `refund_remark` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '退款备注',
  `audit_reason` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '药师审核驳回原因',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2040012167203573776 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单主表';

-- ----------------------------
-- Table structure for oms_order_comment
-- ----------------------------
DROP TABLE IF EXISTS `oms_order_comment`;
CREATE TABLE `oms_order_comment` (
  `id` bigint DEFAULT NULL COMMENT '评价ID',
  `order_id` bigint DEFAULT NULL COMMENT '订单ID',
  `user_id` bigint DEFAULT NULL COMMENT '评价用户ID',
  `user_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '评价用户昵称',
  `user_avatar` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '评价用户头像',
  `medicine_id` bigint DEFAULT NULL COMMENT '药品ID',
  `rating` int DEFAULT NULL COMMENT '评分',
  `content` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '评价内容',
  `images` text COLLATE utf8mb4_general_ci COMMENT '评价图片JSON或逗号分隔列表',
  `reply` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '商家回复内容',
  `reply_time` datetime DEFAULT NULL COMMENT '商家回复时间',
  `status` int DEFAULT NULL COMMENT '评价状态: 0正常 1隐藏',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单评价表';

-- ----------------------------
-- Table structure for oms_order_item
-- ----------------------------
DROP TABLE IF EXISTS `oms_order_item`;
CREATE TABLE `oms_order_item` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单明细ID',
  `order_id` bigint DEFAULT NULL COMMENT '所属订单ID',
  `medicine_id` bigint DEFAULT NULL COMMENT '药品ID',
  `medicine_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '下单时药品名称快照',
  `medicine_price` decimal(10,2) DEFAULT NULL COMMENT '下单时药品单价',
  `quantity` int DEFAULT NULL COMMENT '购买数量',
  `total_price` decimal(10,2) DEFAULT NULL COMMENT '明细总价',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2040012167216156688 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单明细表';

-- ----------------------------
-- Table structure for oms_payment_batch
-- ----------------------------
DROP TABLE IF EXISTS `oms_payment_batch`;
CREATE TABLE `oms_payment_batch` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '支付批次ID',
  `batch_no` varchar(64) NOT NULL COMMENT '支付批次号',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `order_ids_json` text NOT NULL COMMENT '订单ID列表JSON',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `currency` varchar(16) NOT NULL DEFAULT 'cny' COMMENT '币种',
  `provider` varchar(32) NOT NULL DEFAULT 'stripe' COMMENT '支付渠道',
  `provider_status` varchar(64) DEFAULT NULL COMMENT '第三方支付状态',
  `checkout_session_id` varchar(128) DEFAULT NULL COMMENT 'Stripe Checkout Session ID',
  `payment_intent_id` varchar(128) DEFAULT NULL COMMENT 'Stripe PaymentIntent ID',
  `status` int NOT NULL DEFAULT '0' COMMENT '0待支付 1已支付 2已取消 3已过期 4支付失败',
  `webhook_event_id` varchar(128) DEFAULT NULL COMMENT 'Stripe webhook事件ID',
  `expire_time` datetime DEFAULT NULL COMMENT '支付过期时间',
  `paid_time` datetime DEFAULT NULL COMMENT '支付完成时间',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_batch_no` (`batch_no`),
  UNIQUE KEY `uk_checkout_session_id` (`checkout_session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stripe支付批次表';


-- ----------------------------
-- Table structure for oms_payment_record
-- ----------------------------
DROP TABLE IF EXISTS `oms_payment_record`;
CREATE TABLE `oms_payment_record` (
  `id` bigint DEFAULT NULL COMMENT '支付流水ID',
  `order_id` bigint DEFAULT NULL COMMENT '订单ID',
  `user_id` bigint DEFAULT NULL COMMENT '支付用户ID',
  `amount` decimal(10,2) DEFAULT NULL COMMENT '支付金额，退款可为负数',
  `payment_method` int DEFAULT NULL COMMENT '支付方式: 1微信 2支付宝 3Stripe等',
  `transaction_id` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '第三方交易号或本地交易号',
  `status` int DEFAULT NULL COMMENT '支付状态: 0待支付 1成功 2失败 3退款',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单支付流水表';

-- ----------------------------
-- Table structure for oms_refund_apply
-- ----------------------------
DROP TABLE IF EXISTS `oms_refund_apply`;
CREATE TABLE `oms_refund_apply` (
  `id` bigint DEFAULT NULL COMMENT '退款申请ID',
  `order_id` bigint DEFAULT NULL COMMENT '关联订单ID',
  `user_id` bigint DEFAULT NULL COMMENT '申请用户ID',
  `type` int DEFAULT NULL COMMENT '退款类型: 1仅退款 2退货退款等',
  `reason` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '退款原因',
  `amount` decimal(10,2) DEFAULT NULL COMMENT '申请退款金额',
  `images` varchar(1000) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '退款凭证图片',
  `original_order_status` int DEFAULT NULL COMMENT '申请时订单原状态',
  `status` int DEFAULT NULL COMMENT '退款状态: 0待审核 1已同意 2已拒绝 3已完成',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `audit_reason` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审核备注/拒绝原因',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='退款申请表';

-- ----------------------------
-- Table structure for pms_banner
-- ----------------------------
DROP TABLE IF EXISTS `pms_banner`;
CREATE TABLE `pms_banner` (
  `id` bigint DEFAULT NULL COMMENT '轮播图ID',
  `title` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '轮播图标题',
  `image_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '图片地址',
  `link_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '跳转链接',
  `sort` int DEFAULT NULL COMMENT '排序值，越小越靠前',
  `status` int DEFAULT NULL COMMENT '状态: 0禁用 1启用',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='首页轮播图表';

-- ----------------------------
-- Table structure for pms_category
-- ----------------------------
DROP TABLE IF EXISTS `pms_category`;
CREATE TABLE `pms_category` (
  `id` bigint DEFAULT NULL COMMENT '分类ID',
  `name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '分类名称',
  `parent_id` bigint DEFAULT NULL COMMENT '父级分类ID，顶级通常为0或NULL',
  `level` int DEFAULT NULL COMMENT '分类层级',
  `sort` int DEFAULT NULL COMMENT '排序值',
  `status` int DEFAULT NULL COMMENT '状态: 0禁用 1启用',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='药品分类表';

-- ----------------------------
-- Table structure for pms_health_article
-- ----------------------------
DROP TABLE IF EXISTS `pms_health_article`;
CREATE TABLE `pms_health_article` (
  `id` bigint DEFAULT NULL COMMENT '文章ID',
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文章标题',
  `category` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文章分类',
  `summary` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文章摘要',
  `content` longtext COLLATE utf8mb4_general_ci COMMENT '文章正文内容',
  `cover_image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '封面图地址',
  `status` int DEFAULT NULL COMMENT '状态: 0草稿 1发布',
  `views` int DEFAULT NULL COMMENT '浏览次数',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='健康资讯文章表';

-- ----------------------------
-- Table structure for pms_medicine
-- ----------------------------
DROP TABLE IF EXISTS `pms_medicine`;
CREATE TABLE `pms_medicine` (
  `id` bigint DEFAULT NULL COMMENT '药品ID',
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '药品名称',
  `category_id` bigint DEFAULT NULL COMMENT '分类ID',
  `main_image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主图地址',
  `price` decimal(10,2) DEFAULT NULL COMMENT '销售价格',
  `stock` int DEFAULT NULL COMMENT '库存数量',
  `sales` int DEFAULT NULL COMMENT '累计销量',
  `is_prescription` tinyint DEFAULT NULL COMMENT '是否处方药: 0否 1是',
  `indication` text COLLATE utf8mb4_general_ci COMMENT '适应症说明',
  `usage_method` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用法用量',
  `contraindication` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '禁忌说明',
  `expiry_date` date DEFAULT NULL COMMENT '有效期截止日期',
  `production_date` date DEFAULT NULL COMMENT '生产日期',
  `seller_id` bigint DEFAULT NULL COMMENT '所属商家ID',
  `status` tinyint DEFAULT NULL COMMENT '状态: 0下架 1上架',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `specs` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '规格信息',
  `deleted` tinyint DEFAULT NULL COMMENT '逻辑删除标记: 0正常 1已删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='药品商品表';

-- ----------------------------
-- Table structure for pms_medicine_comment
-- ----------------------------
DROP TABLE IF EXISTS `pms_medicine_comment`;
CREATE TABLE `pms_medicine_comment` (
  `id` bigint DEFAULT NULL COMMENT '药品评价ID',
  `medicine_id` bigint DEFAULT NULL COMMENT '药品ID',
  `order_id` bigint DEFAULT NULL COMMENT '订单ID',
  `user_id` bigint DEFAULT NULL COMMENT '评价用户ID',
  `user_name` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '评价用户名',
  `user_avatar` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '评价用户头像',
  `star` int DEFAULT NULL COMMENT '星级评分',
  `content` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '评价内容',
  `images` text COLLATE utf8mb4_general_ci COMMENT '评价图片',
  `reply` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '商家回复',
  `reply_time` datetime DEFAULT NULL COMMENT '回复时间',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted` tinyint DEFAULT NULL COMMENT '逻辑删除标记'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='药品评价表';

-- ----------------------------
-- Table structure for pms_medicine_favorite
-- ----------------------------
DROP TABLE IF EXISTS `pms_medicine_favorite`;
CREATE TABLE `pms_medicine_favorite` (
  `id` bigint DEFAULT NULL COMMENT '收藏记录ID',
  `user_id` bigint DEFAULT NULL COMMENT '用户ID',
  `medicine_id` bigint DEFAULT NULL COMMENT '药品ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户药品收藏表';

-- ----------------------------
-- Table structure for pms_medicine_footprint
-- ----------------------------
DROP TABLE IF EXISTS `pms_medicine_footprint`;
CREATE TABLE `pms_medicine_footprint` (
  `id` bigint DEFAULT NULL COMMENT '浏览足迹ID',
  `user_id` bigint DEFAULT NULL COMMENT '用户ID',
  `medicine_id` bigint DEFAULT NULL COMMENT '药品ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户药品浏览足迹表';

-- ----------------------------
-- Table structure for sms_coupon
-- ----------------------------
DROP TABLE IF EXISTS `sms_coupon`;
CREATE TABLE `sms_coupon` (
  `id` bigint DEFAULT NULL COMMENT '优惠券ID',
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '优惠券名称',
  `type` int DEFAULT NULL COMMENT '优惠券类型',
  `min_point` decimal(10,2) DEFAULT NULL COMMENT '满减门槛金额',
  `amount` decimal(10,2) DEFAULT NULL COMMENT '优惠金额',
  `per_limit` int DEFAULT NULL COMMENT '每人限领数量',
  `use_count` int DEFAULT NULL COMMENT '已使用数量',
  `receive_count` int DEFAULT NULL COMMENT '已领取数量',
  `total_count` int DEFAULT NULL COMMENT '发放总数量',
  `status` int DEFAULT NULL COMMENT '状态: 0禁用 1启用',
  `start_time` datetime DEFAULT NULL COMMENT '生效开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '生效结束时间',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='优惠券模板表';

-- ----------------------------
-- Table structure for sms_coupon_history
-- ----------------------------
DROP TABLE IF EXISTS `sms_coupon_history`;
CREATE TABLE `sms_coupon_history` (
  `id` bigint DEFAULT NULL COMMENT '领取记录ID',
  `coupon_id` bigint DEFAULT NULL COMMENT '优惠券模板ID',
  `user_id` bigint DEFAULT NULL COMMENT '领取用户ID',
  `order_id` bigint DEFAULT NULL COMMENT '使用该券的订单ID',
  `coupon_code` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '优惠券编码',
  `member_nickname` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '领取用户昵称',
  `get_type` int DEFAULT NULL COMMENT '获取方式: 1主动领取 2后台发放等',
  `use_status` int DEFAULT NULL COMMENT '使用状态: 0未使用 1已使用 2已过期',
  `use_time` datetime DEFAULT NULL COMMENT '使用时间',
  `create_time` datetime DEFAULT NULL COMMENT '领取时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户优惠券领取记录表';

-- ----------------------------
-- Table structure for sys_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
  `config_key` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置项键名',
  `config_value` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置项值',
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置说明'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统配置表';

-- ----------------------------
-- Table structure for sys_merchant
-- ----------------------------
DROP TABLE IF EXISTS `sys_merchant`;
CREATE TABLE `sys_merchant` (
  `id` bigint DEFAULT NULL COMMENT '商家资料ID',
  `user_id` bigint DEFAULT NULL COMMENT '对应用户ID',
  `shop_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '店铺名称',
  `shop_logo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '店铺Logo',
  `description` text COLLATE utf8mb4_general_ci COMMENT '店铺简介',
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '店铺地址',
  `license_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '营业执照图片',
  `id_card_front` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '法人身份证正面',
  `id_card_back` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '法人身份证反面',
  `audit_status` tinyint DEFAULT NULL COMMENT '审核状态: 0待审核 1通过 2拒绝',
  `audit_remark` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审核备注',
  `contact_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '联系人手机号',
  `credit_code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '统一社会信用代码',
  `business_status` tinyint DEFAULT NULL COMMENT '营业状态: 0休息 1营业',
  `business_hours` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '营业时间',
  `delivery_fee` decimal(10,2) DEFAULT NULL COMMENT '配送费',
  `min_delivery_amount` decimal(10,2) DEFAULT NULL COMMENT '起送金额',
  `notice` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '店铺公告',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `legal_person_id_last4` varchar(4) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '法人身份证后四位',
  `legal_person_id_hash` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '法人身份证号哈希值',
  `legal_person_address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '法人身份证住址',
  `id_card_authority` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '身份证签发机关',
  `id_card_valid_from` date DEFAULT NULL COMMENT '身份证有效期开始日期',
  `id_card_valid_to` date DEFAULT NULL COMMENT '身份证有效期结束日期',
  `id_card_valid_long_term` tinyint DEFAULT NULL COMMENT '身份证是否长期有效: 0否 1是'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商家资料表';

-- ----------------------------
-- Table structure for sys_patient
-- ----------------------------
DROP TABLE IF EXISTS `sys_patient`;
CREATE TABLE `sys_patient` (
  `id` bigint DEFAULT NULL COMMENT '就诊人ID',
  `user_id` bigint DEFAULT NULL COMMENT '所属用户ID',
  `real_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '真实姓名',
  `id_card` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '身份证号',
  `id_card_front` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '身份证正面图片',
  `id_card_back` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '身份证反面图片',
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '联系电话',
  `gender` tinyint DEFAULT NULL COMMENT '性别: 0女 1男等',
  `birthday` date DEFAULT NULL COMMENT '出生日期',
  `is_default` int DEFAULT NULL COMMENT '是否默认就诊人: 0否 1是',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户就诊人信息表';

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` bigint DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '登录用户名',
  `password` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '登录密码(加密后)',
  `nickname` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户昵称',
  `mobile` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '手机号',
  `role` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '角色: USER SELLER ADMIN RIDER等',
  `avatar` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '头像地址',
  `status` tinyint DEFAULT NULL COMMENT '账号状态: 0禁用 1正常',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统用户表';

-- ----------------------------
-- Table structure for sys_user_address
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_address`;
CREATE TABLE `sys_user_address` (
  `id` bigint DEFAULT NULL COMMENT '地址ID',
  `user_id` bigint DEFAULT NULL COMMENT '所属用户ID',
  `receiver_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人姓名',
  `receiver_phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人手机号',
  `province` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '省份',
  `city` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '城市',
  `region` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '区/县',
  `detail_address` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '详细地址',
  `is_default` int DEFAULT NULL COMMENT '是否默认地址: 0否 1是',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户收货地址表';

SET FOREIGN_KEY_CHECKS = 1;
