-- MySQL dump 10.13  Distrib 8.0.33, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: zhijian_db
-- ------------------------------------------------------
-- Server version	8.0.17

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart_item`
--

DROP TABLE IF EXISTS `cart_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_item` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `medicine_id` bigint(20) NOT NULL COMMENT '药品ID',
  `count` int(11) NOT NULL DEFAULT '1' COMMENT '数量',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='购物车表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_item`
--

/*!40000 ALTER TABLE `cart_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_item` ENABLE KEYS */;

--
-- Table structure for table `dms_delivery`
--
DROP TABLE IF EXISTS `dms_delivery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dms_delivery` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL,
  `rider_id` bigint(20) DEFAULT NULL COMMENT '骑手ID',
  `rider_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rider_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` int(11) DEFAULT '0' COMMENT '配送状态: 0待抢单, 1配送中, 2已送达, 3异常',
  `current_lat` decimal(10,6) DEFAULT NULL COMMENT '当前纬度',
  `current_lng` decimal(10,6) DEFAULT NULL COMMENT '当前经度',
  `pickup_time` datetime DEFAULT NULL COMMENT '取货时间',
  `arrive_time` datetime DEFAULT NULL COMMENT '送达时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='配送信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dms_delivery`
--

/*!40000 ALTER TABLE `dms_delivery` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_delivery` ENABLE KEYS */;

--
-- Table structure for table `im_message`
--

DROP TABLE IF EXISTS `im_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `im_message` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `from_user_id` bigint(20) NOT NULL,
  `to_user_id` bigint(20) NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `type` int(11) DEFAULT '0',
  `read_status` int(11) DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `im_message`
--

/*!40000 ALTER TABLE `im_message` DISABLE KEYS */;
INSERT INTO `im_message` VALUES (1,6,5,'你好',0,1,'2026-01-04 15:16:09'),(2,5,6,'你好',0,1,'2026-01-04 15:16:20'),(3,5,6,'你想咨询什么',0,1,'2026-01-04 15:16:28'),(4,6,5,'你好',0,1,'2026-01-05 17:27:22'),(5,6,5,'我有问题',0,1,'2026-01-05 17:27:34');
/*!40000 ALTER TABLE `im_message` ENABLE KEYS */;

--
-- Table structure for table `oms_delivery`
--

DROP TABLE IF EXISTS `oms_delivery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oms_delivery` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT NULL COMMENT '订单ID',
  `courier_id` bigint(20) DEFAULT NULL COMMENT '骑手ID',
  `courier_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '骑手姓名',
  `courier_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '骑手电话',
  `receiver_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人姓名',
  `receiver_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人电话',
  `receiver_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货地址',
  `status` int(11) DEFAULT '0' COMMENT '配送状态: 0待接单 1配送中 2已送达 3已取消',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `shop_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '店铺名称',
  `shop_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '店铺地址',
  `delivery_fee` decimal(10,2) DEFAULT NULL COMMENT '配送费',
  `proof_image` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '送达凭证',
  `is_urgent` int(11) DEFAULT '0' COMMENT '是否急单',
  `verify_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '签收验证码',
  `exception_status` int(11) DEFAULT '0' COMMENT '异常状态',
  `exception_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '异常原因',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='配送单表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oms_delivery`
--

/*!40000 ALTER TABLE `oms_delivery` DISABLE KEYS */;
INSERT INTO `oms_delivery` VALUES (24,33,13,'13400000000','13400000000','刘昊楠','13796323223','陕西省西安雁塔区科技二路',2,'2026-01-04 13:49:42','2026-01-04 13:49:42','西安大药房','陕西省西安市雁塔区科技二路',5.00,NULL,0,NULL,0,NULL),(25,35,13,'13400000000','13400000000','刘昊楠','13796323223','陕西省西安雁塔区科技二路',2,'2026-01-04 13:55:03','2026-01-04 13:55:03','西安大药房','陕西省西安市雁塔区科技二路',5.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/a9a5995ca52648549c62cc2a73f59277.jpg',0,NULL,0,NULL),(26,34,13,'13400000000','13400000000','刘昊楠','13796323223','陕西省西安雁塔区科技二路',2,'2026-01-04 13:55:29','2026-01-04 13:55:29','西安大药房','陕西省西安市雁塔区科技二路',5.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/7d165610c23549afa00b8c0981859abc.jpg',0,NULL,0,NULL),(27,36,13,'13400000000','13400000000','刘昊楠','13796323223','陕西省西安雁塔区科技二路',2,'2026-01-04 14:59:00','2026-01-04 14:59:00','西安大药房','陕西省西安市雁塔区科技二路',5.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/ccfaa7c1cae04682b5ebd27abc5ab805.jpg',0,NULL,0,NULL),(28,37,13,'13400000000','13400000000','刘昊楠','13796323223','陕西省西安雁塔区科技二路',2,'2026-01-04 15:43:06','2026-01-04 15:43:06','西安大药房','陕西省西安市雁塔区科技二路',5.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/1f2b891e2a5b4476a610363de12f27b5.jpg',0,'7466',0,NULL),(29,38,13,'13400000000','13400000000','刘昊楠','13796323223','陕西西安欧锦圆C座4单元',2,'2026-01-04 16:54:13','2026-01-04 16:54:13','西安大药房','陕西省西安市雁塔区科技二路',5.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/9863079741e4482a861399504862361f.jpg',0,'8924',0,NULL),(30,39,13,'13400000000','13400000000','刘昊楠','13796323223','陕西西安欧锦圆C座4单元',2,'2026-01-04 20:46:54','2026-01-04 20:46:54','西安大药房','陕西省西安市雁塔区科技二路',5.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/06/c4fe79f7f29843bbad3cf14c688071ca.jpg',0,'3649',0,NULL),(31,40,13,'13400000000','13400000000','刘昊楠','13796323223','陕西西安欧锦圆C座4单元',2,'2026-01-04 20:52:52','2026-01-04 20:52:52','西安大药房','陕西省西安市雁塔区科技二路',5.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/06/58af3d5ef709466d9aba124ef3a48f92.jpg',0,'2060',0,NULL),(32,42,13,'13400000000','13400000000','刘昊楠','13796323223','陕西西安欧锦圆C座4单元',2,'2026-01-05 18:02:34','2026-01-05 18:02:34','西安大药房','陕西省西安市雁塔区科技二路',6.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/06/8dd70d96f9d341a49dbc449f75e06026.jpg',0,'0326',0,NULL),(33,43,13,'13400000000','13400000000','刘昊楠','13796323223','陕西西安欧锦圆C座4单元',2,'2026-01-06 16:42:34','2026-01-06 16:42:34','西安大药房','陕西省西安市雁塔区科技二路',6.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/06/de34c78d60eb48e5ac025ce9cfdd55cb.jpg',0,'8602',0,NULL),(34,41,13,'13400000000','13400000000','刘昊楠','13796323223','陕西西安欧锦圆C座4单元',2,'2026-01-06 16:42:37','2026-01-06 16:42:37','西安大药房','陕西省西安市雁塔区科技二路',6.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/06/9409146ed0f24b8a8fa40e6384cce2e8.jpg',0,'0927',0,NULL),(35,44,13,'13400000000','13400000000','刘昊楠','13796323223','陕西省西安雁塔区科技二路',2,'2026-01-06 16:44:14','2026-01-06 16:44:14','西安大药房','陕西省西安市雁塔区科技二路',6.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/06/28ec34040ac44d1390c12df5c1b4c3ed.jpg',0,'4222',0,NULL),(36,45,13,'13400000000','13400000000','刘昊楠','13796323223','陕西西安欧锦圆C座4单元',2,'2026-01-06 16:53:17','2026-01-06 16:53:17','西安大药房','陕西省西安市雁塔区科技二路',6.00,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/08/bc0b25f47c584e868dc793b75ef72de2.jpg',0,'9589',0,NULL),(37,46,NULL,NULL,NULL,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',0,'2026-01-12 13:58:53','2026-01-12 13:58:53','西安大药房','陕西省西安市雁塔区科技二路',6.00,NULL,0,'4863',0,NULL),(38,47,NULL,NULL,NULL,'刘昊楠','13796323223','陕西省西安市雁塔区欧锦圆C座304',0,'2026-01-28 10:43:48','2026-01-28 10:43:48','西安大药房','陕西省西安市雁塔区科技二路',6.00,NULL,0,'3068',0,NULL),(39,48,NULL,NULL,NULL,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',0,'2026-01-28 14:01:14','2026-01-28 14:01:14','西安大药房','陕西省西安市雁塔区科技二路',6.00,NULL,0,'1524',0,NULL),(40,49,NULL,NULL,NULL,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',0,'2026-02-04 13:38:14','2026-02-04 13:38:14','西安大药房','陕西省西安市雁塔区科技二路',6.00,NULL,0,'9510',0,NULL),(41,50,NULL,NULL,NULL,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',0,'2026-02-04 16:48:39','2026-02-04 16:48:39','西安大药房','陕西省西安市雁塔区科技二路',6.00,NULL,0,'4488',0,NULL),(42,60,NULL,NULL,NULL,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',0,'2026-02-13 22:15:07','2026-02-13 22:15:07','西安大药房','陕西省西安市雁塔区科技二路',6.00,NULL,0,'8020',0,NULL),(43,78,NULL,NULL,NULL,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',0,'2026-02-24 13:52:02','2026-02-24 13:52:02','西安大药房','陕西省西安市雁塔区科技二路',6.00,NULL,0,'4685',0,NULL),(44,77,NULL,NULL,NULL,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',0,'2026-02-24 13:52:05','2026-02-24 13:52:05','西安大药房','陕西省西安市雁塔区科技二路',6.00,NULL,0,'0600',0,NULL);
/*!40000 ALTER TABLE `oms_delivery` ENABLE KEYS */;

--
-- Table structure for table `oms_order`
--

DROP TABLE IF EXISTS `oms_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oms_order` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '订单号',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `patient_id` bigint(20) DEFAULT NULL COMMENT '就诊人ID(处方药必填)',
  `seller_id` bigint(20) NOT NULL COMMENT '商家ID',
  `total_amount` decimal(10,2) NOT NULL COMMENT '订单总金额',
  `coupon_amount` decimal(10,2) DEFAULT '0.00' COMMENT '优惠券抵扣金额',
  `pay_amount` decimal(10,2) DEFAULT '0.00' COMMENT '实付金额',
  `coupon_history_id` bigint(20) DEFAULT NULL COMMENT '优惠券记录ID',
  `status` int(11) NOT NULL COMMENT '状态: 10待支付, 20待接单, 30已接单/配货中, 40配送中, 50已完成, 60已取消, 70已退款',
  `receiver_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '收货人',
  `receiver_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '收货电话',
  `receiver_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '收货地址',
  `prescription_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '处方图片(如果是处方药)',
  `pharmacist_audit_status` tinyint(4) DEFAULT '0' COMMENT '药师审核状态: 0无需, 1待审, 2通过, 3驳回',
  `pickup_code` char(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '取货码(商家核销)',
  `receive_code` char(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货码(用户核销)',
  `payment_time` datetime DEFAULT NULL COMMENT '支付时间',
  `delivery_time` datetime DEFAULT NULL COMMENT '发货时间',
  `finish_time` datetime DEFAULT NULL COMMENT '完成时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `comment_status` int(11) DEFAULT '0',
  `refund_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '退款原因',
  `refund_remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '退款备注',
  `audit_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审核不通过原因',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_order_no` (`order_no`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='订单主表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oms_order`
--

/*!40000 ALTER TABLE `oms_order` DISABLE KEYS */;
INSERT INTO `oms_order` VALUES (33,'20260104134922528398354',6,NULL,5,15.20,0.00,20.20,NULL,5,'刘昊楠','13796323223','陕西省西安雁塔区科技二路',NULL,0,NULL,NULL,'2026-01-04 13:49:31','2026-01-04 13:49:43','2026-01-04 13:57:03','2026-01-04 13:49:23','2026-01-04 13:49:23',1,NULL,NULL,NULL),(34,'20260104135029133988876',6,NULL,5,18.70,0.00,23.70,NULL,3,'刘昊楠','13796323223','陕西省西安雁塔区科技二路',NULL,0,NULL,NULL,'2026-01-04 13:50:30','2026-01-04 13:55:29','2026-01-04 20:52:11','2026-01-04 13:50:29','2026-01-04 13:50:29',0,NULL,NULL,NULL),(35,'20260104135038301745510',6,NULL,5,158.00,0.00,163.00,NULL,3,'刘昊楠','13796323223','陕西省西安雁塔区科技二路',NULL,0,NULL,NULL,'2026-01-04 13:50:39','2026-01-04 13:55:03','2026-01-04 20:52:12','2026-01-04 13:50:38','2026-01-04 13:50:38',0,NULL,NULL,NULL),(36,'20260104145850568114231',6,NULL,5,5.80,0.00,10.80,NULL,3,'刘昊楠','13796323223','陕西省西安雁塔区科技二路',NULL,0,NULL,NULL,'2026-01-04 14:58:52','2026-01-04 14:59:00','2026-01-04 15:42:47','2026-01-04 14:58:51','2026-01-04 14:58:51',0,NULL,NULL,NULL),(37,'20260104154256353288855',6,NULL,5,12.30,0.00,17.30,NULL,3,'刘昊楠','13796323223','陕西省西安雁塔区科技二路',NULL,0,NULL,NULL,'2026-01-04 15:42:58','2026-01-04 15:43:07','2026-01-04 20:52:08','2026-01-04 15:42:56','2026-01-04 15:42:56',0,NULL,NULL,NULL),(38,'20260104165408077355967',6,NULL,5,12.30,0.00,17.30,NULL,3,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-01-04 16:54:09','2026-01-04 16:54:13','2026-01-04 20:52:07','2026-01-04 16:54:08','2026-01-04 16:54:08',0,NULL,NULL,NULL),(39,'20260104204619404367672',6,NULL,5,11.60,0.00,16.60,NULL,3,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-01-04 20:46:20','2026-01-04 20:46:55','2026-01-04 20:52:06','2026-01-04 20:46:19','2026-01-04 20:46:19',1,NULL,NULL,NULL),(40,'20260104205246611936685',6,NULL,5,12.30,10.00,7.30,4,5,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-01-04 20:52:48','2026-01-04 20:52:53',NULL,'2026-01-04 20:52:47','2026-01-04 20:52:47',0,NULL,NULL,NULL),(41,'20260104205621483307886',6,4,5,38.80,0.00,44.80,NULL,3,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/f85eb2d7544a4e0bb1318a4c23d16584.jpg',2,NULL,NULL,'2026-01-04 20:56:46','2026-01-06 16:43:50','2026-02-10 15:26:49','2026-01-04 20:56:21','2026-01-04 20:56:21',0,NULL,NULL,'1'),(42,'20260105180224154378713',6,NULL,5,5.80,0.00,11.80,NULL,3,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-01-05 18:02:26','2026-01-05 18:02:34','2026-01-05 18:02:44','2026-01-05 18:02:24','2026-01-05 18:02:24',0,NULL,NULL,NULL),(43,'20260106164214483936349',6,NULL,5,45.60,0.00,51.60,NULL,3,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-01-06 16:42:16','2026-01-06 16:43:51','2026-01-08 11:27:52','2026-01-06 16:42:15','2026-01-06 16:42:15',0,NULL,NULL,NULL),(44,'20260106164405312692641',6,NULL,5,12.30,0.00,18.30,NULL,5,'刘昊楠','13796323223','陕西省西安雁塔区科技二路',NULL,0,NULL,NULL,'2026-01-06 16:44:07','2026-01-06 16:44:20','2026-01-06 16:52:19','2026-01-06 16:44:05','2026-01-06 16:44:05',0,'1',NULL,NULL),(45,'20260106165310601895092',6,NULL,5,11.00,0.00,17.00,NULL,5,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-01-06 16:53:12','2026-01-06 16:53:22','2026-01-08 11:27:49','2026-01-06 16:53:11','2026-01-06 16:53:11',0,'1',NULL,NULL),(46,'20260108093907359024852',6,NULL,5,5.80,0.00,11.80,NULL,8,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-01-08 09:39:10',NULL,NULL,'2026-01-08 09:39:07','2026-01-08 09:39:07',0,NULL,NULL,NULL),(47,'20260113180833698381671',14,NULL,5,8.90,0.00,14.90,NULL,8,'刘昊楠','13796323223','陕西省西安市雁塔区欧锦圆C座304',NULL,0,NULL,NULL,'2026-01-13 18:08:35',NULL,NULL,'2026-01-13 18:08:34','2026-01-13 18:08:34',0,NULL,NULL,NULL),(48,'20260128140101913554495',6,NULL,5,12.30,0.00,18.30,NULL,8,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-01-28 14:01:02',NULL,NULL,'2026-01-28 14:01:02','2026-01-28 14:01:02',0,NULL,NULL,NULL),(49,'20260204102316486282859',6,NULL,5,11.00,0.00,17.00,NULL,8,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-02-04 10:23:21',NULL,NULL,'2026-02-04 10:23:17','2026-02-04 10:23:17',0,NULL,NULL,NULL),(50,'20260204164819164079607',6,NULL,5,12.30,0.00,18.30,NULL,8,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-02-04 16:48:22',NULL,NULL,'2026-02-04 16:48:19','2026-02-04 16:48:19',0,NULL,NULL,NULL),(55,'20260210105147939826808',6,NULL,5,11.00,0.00,17.00,NULL,1,'????','13800138000','????',NULL,0,NULL,NULL,'2026-02-10 11:03:48',NULL,NULL,'2026-02-10 10:51:48','2026-02-10 10:51:48',0,NULL,NULL,NULL),(56,'20260210161919613471802',17,NULL,5,22.00,0.00,28.00,NULL,6,'ZhangSan','13800138000','GuangDongShenZhenNanShanTestStreet123',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-10 16:19:20','2026-02-10 16:19:20',0,NULL,NULL,NULL),(57,'20260210162125941114035',6,NULL,5,5.80,0.00,11.80,NULL,1,'张三','13077709345','陕西省西安市雁塔区欧锦圆',NULL,0,NULL,NULL,'2026-02-10 16:21:37',NULL,NULL,'2026-02-10 16:21:26','2026-02-10 16:21:26',0,NULL,NULL,NULL),(58,'20260213100155869604839',6,NULL,5,25.00,0.00,31.00,NULL,6,'刘昊楠','13077709345','黑龙江省讷河市',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-13 10:01:56','2026-02-13 10:01:56',0,NULL,NULL,NULL),(59,'20260213102445144359593',6,NULL,5,37.50,0.00,43.50,NULL,6,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-13 10:24:45','2026-02-13 10:24:45',0,NULL,NULL,NULL),(60,'20260213102451972537996',6,NULL,5,12.30,0.00,18.30,NULL,8,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-02-13 10:24:54',NULL,NULL,'2026-02-13 10:24:52','2026-02-13 10:24:52',0,NULL,NULL,NULL),(68,'20260213110337888461347',6,NULL,5,25.00,0.00,31.00,NULL,6,'张三','13077709345','陕西省西安市雁塔区欧锦圆',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-13 11:03:38','2026-02-13 11:03:38',0,NULL,NULL,NULL),(69,'20260213210752230399834',6,NULL,5,11.60,0.00,17.60,NULL,6,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-13 21:07:52','2026-02-13 21:07:52',0,NULL,NULL,NULL),(70,'20260224091500839765870',6,NULL,5,5.80,0.00,11.80,NULL,1,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-02-24 09:15:03',NULL,NULL,'2026-02-24 09:15:01','2026-02-24 09:15:01',0,NULL,NULL,NULL),(71,'20260224102001214803666',1,NULL,5,11.00,0.00,17.00,NULL,6,'测试用户','13800138000','上海市上海市浦东新区测试路 1 号',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-24 10:20:01','2026-02-24 10:20:01',0,NULL,NULL,NULL),(72,'20260224102229527765094',1,NULL,5,11.00,0.00,17.00,NULL,6,'测试用户','13800138000','上海市上海市浦东新区测试路 1 号',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-24 10:22:30','2026-02-24 10:22:30',0,NULL,NULL,NULL),(73,'20260224105920579506614',6,NULL,5,12.30,0.00,18.30,NULL,1,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-02-24 11:00:08',NULL,NULL,'2026-02-24 10:59:21','2026-02-24 10:59:21',0,NULL,NULL,NULL),(74,'20260224110659912993819',6,NULL,5,5.80,0.00,11.80,NULL,1,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-02-24 11:07:25',NULL,NULL,'2026-02-24 11:07:00','2026-02-24 11:07:00',0,NULL,NULL,NULL),(75,'20260224110958696730920',6,NULL,5,5.80,0.00,11.80,NULL,6,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-24 11:09:59','2026-02-24 11:09:59',0,NULL,NULL,NULL),(76,'20260224111349855637753',6,NULL,5,5.80,0.00,11.80,NULL,6,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-24 11:13:50','2026-02-24 11:13:50',0,NULL,NULL,NULL),(77,'20260224111545237284166',6,NULL,5,5.80,0.00,11.80,NULL,8,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-02-24 11:15:58',NULL,NULL,'2026-02-24 11:15:45','2026-02-24 11:15:45',0,NULL,NULL,NULL),(78,'20260224134958325042403',6,NULL,5,5.80,0.00,11.80,NULL,8,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-02-24 13:50:09',NULL,NULL,'2026-02-24 13:49:58','2026-02-24 13:49:58',0,NULL,NULL,NULL),(79,'20260224135404151839419',6,NULL,5,5.80,0.00,11.80,NULL,6,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-24 13:54:04','2026-02-24 13:54:04',0,NULL,NULL,NULL),(80,'20260224135426429860939',6,NULL,5,22.50,0.00,28.50,NULL,6,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-24 13:54:26','2026-02-24 13:54:26',0,NULL,NULL,NULL),(81,'20260224135457824488159',6,NULL,5,22.50,10.00,18.50,5,1,'刘昊楠','13796323223','陕西西安欧锦圆C座4单元',NULL,0,NULL,NULL,'2026-02-24 13:54:59',NULL,NULL,'2026-02-24 13:54:58','2026-02-24 13:54:58',0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `oms_order` ENABLE KEYS */;

--
-- Table structure for table `oms_order_comment`
--

DROP TABLE IF EXISTS `oms_order_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oms_order_comment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL COMMENT '订单ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户名',
  `user_avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户头像',
  `medicine_id` bigint(20) DEFAULT NULL COMMENT '药品ID',
  `rating` int(11) DEFAULT '5' COMMENT '评分 (1-5)',
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '评价内容',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '评价图片(JSON)',
  `reply` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '商家回复',
  `reply_time` datetime DEFAULT NULL COMMENT '回复时间',
  `status` int(11) DEFAULT '0' COMMENT '状态: 0显示 1隐藏',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_order_id` (`order_id`) USING BTREE,
  KEY `idx_medicine_id` (`medicine_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='订单评价表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oms_order_comment`
--

/*!40000 ALTER TABLE `oms_order_comment` DISABLE KEYS */;
/*!40000 ALTER TABLE `oms_order_comment` ENABLE KEYS */;

--
-- Table structure for table `oms_order_item`
--

DROP TABLE IF EXISTS `oms_order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oms_order_item` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL,
  `medicine_id` bigint(20) NOT NULL,
  `medicine_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `medicine_price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='订单详情表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oms_order_item`
--

/*!40000 ALTER TABLE `oms_order_item` DISABLE KEYS */;
INSERT INTO `oms_order_item` VALUES (30,33,8,'多潘立酮片',15.20,1,15.20,'2026-01-04 13:49:23','2026-01-04 13:49:22'),(31,34,16,'保和丸',18.70,1,18.70,'2026-01-04 13:50:29','2026-01-04 13:50:29'),(32,35,19,'电子血压计',158.00,1,158.00,'2026-01-04 13:50:38','2026-01-04 13:50:38'),(33,36,24,'创可贴',5.80,1,5.80,'2026-01-04 14:58:51','2026-01-04 14:58:50'),(34,37,25,'医用纱布',12.30,1,12.30,'2026-01-04 15:42:56','2026-01-04 15:42:56'),(35,38,25,'医用纱布',12.30,1,12.30,'2026-01-04 16:54:08','2026-01-04 16:54:08'),(36,39,24,'创可贴',5.80,2,11.60,'2026-01-04 20:46:19','2026-01-04 20:46:19'),(37,40,25,'医用纱布',12.30,1,12.30,'2026-01-04 20:52:47','2026-01-04 20:52:46'),(38,41,2,'头孢克肟片',38.80,1,38.80,'2026-01-04 20:56:21','2026-01-04 20:56:21'),(39,42,24,'创可贴',5.80,1,5.80,'2026-01-05 18:02:24','2026-01-05 18:02:24'),(40,43,22,'维生素C咀嚼片',45.60,1,45.60,'2026-01-06 16:42:15','2026-01-06 16:42:14'),(41,44,25,'医用纱布',12.30,1,12.30,'2026-01-06 16:44:05','2026-01-06 16:44:05'),(42,45,69,'测试商品一',11.00,1,11.00,'2026-01-06 16:53:11','2026-01-06 16:53:10'),(43,46,24,'创可贴',5.80,1,5.80,'2026-01-08 09:39:07','2026-01-08 09:39:07'),(44,47,10,'对乙酰氨基酚片',8.90,1,8.90,'2026-01-13 18:08:34','2026-01-13 18:08:33'),(45,48,25,'医用纱布',12.30,1,12.30,'2026-01-28 14:01:02','2026-01-28 14:01:01'),(46,49,69,'测试商品一',11.00,1,11.00,'2026-02-04 10:23:17','2026-02-04 10:23:16'),(47,50,25,'医用纱布',12.30,1,12.30,'2026-02-04 16:48:19','2026-02-04 16:48:19'),(48,55,69,'测试商品一',11.00,1,11.00,'2026-02-10 10:51:48','2026-02-10 10:51:47'),(49,56,69,'测试商品一',11.00,2,22.00,'2026-02-10 16:19:20','2026-02-10 16:19:19'),(50,57,24,'创可贴',5.80,1,5.80,'2026-02-10 16:21:26','2026-02-10 16:21:25'),(51,58,14,'板蓝根颗粒',12.50,2,25.00,'2026-02-13 10:01:56','2026-02-13 10:01:55'),(52,59,14,'板蓝根颗粒',12.50,3,37.50,'2026-02-13 10:24:45','2026-02-13 10:24:45'),(53,60,25,'医用纱布',12.30,1,12.30,'2026-02-13 10:24:52','2026-02-13 10:24:51'),(54,68,14,'板蓝根颗粒',12.50,2,25.00,'2026-02-13 11:03:38','2026-02-13 11:03:37'),(55,69,24,'创可贴',5.80,2,11.60,'2026-02-13 21:07:52','2026-02-13 21:07:52'),(56,70,24,'创可贴',5.80,1,5.80,'2026-02-24 09:15:01','2026-02-24 09:15:00'),(57,71,69,'测试商品一1',11.00,1,11.00,'2026-02-24 10:20:01','2026-02-24 10:20:01'),(58,72,69,'测试商品一1',11.00,1,11.00,'2026-02-24 10:22:30','2026-02-24 10:22:29'),(59,73,25,'医用纱布',12.30,1,12.30,'2026-02-24 10:59:21','2026-02-24 10:59:20'),(60,74,24,'创可贴',5.80,1,5.80,'2026-02-24 11:07:00','2026-02-24 11:06:59'),(61,75,24,'创可贴',5.80,1,5.80,'2026-02-24 11:09:59','2026-02-24 11:09:58'),(62,76,24,'创可贴',5.80,1,5.80,'2026-02-24 11:13:50','2026-02-24 11:13:49'),(63,77,24,'创可贴',5.80,1,5.80,'2026-02-24 11:15:45','2026-02-24 11:15:45'),(64,78,24,'创可贴',5.80,1,5.80,'2026-02-24 13:49:58','2026-02-24 13:49:58'),(65,79,24,'创可贴',5.80,1,5.80,'2026-02-24 13:54:04','2026-02-24 13:54:04'),(66,80,9,'布洛芬缓释胶囊',22.50,1,22.50,'2026-02-24 13:54:26','2026-02-24 13:54:26'),(67,81,9,'布洛芬缓释胶囊',22.50,1,22.50,'2026-02-24 13:54:58','2026-02-24 13:54:57');
/*!40000 ALTER TABLE `oms_order_item` ENABLE KEYS */;

--
-- Table structure for table `oms_payment_record`
--

DROP TABLE IF EXISTS `oms_payment_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oms_payment_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL COMMENT '订单ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `payment_method` int(11) DEFAULT NULL COMMENT '支付方式: 1支付宝 2微信 3银行卡',
  `transaction_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '交易流水号',
  `status` int(11) DEFAULT '0' COMMENT '支付状态: 0未支付 1支付成功 2支付失败',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_order_id` (`order_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='支付记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oms_payment_record`
--

/*!40000 ALTER TABLE `oms_payment_record` DISABLE KEYS */;
INSERT INTO `oms_payment_record` VALUES (25,33,6,15.20,1,'d29b59400d484649aeef71af6a552723',1,'2026-01-04 13:49:31','2026-01-04 13:49:31'),(26,34,6,18.70,1,'43256532dcf74e03ba678331e8b28eeb',1,'2026-01-04 13:50:30','2026-01-04 13:50:30'),(27,35,6,158.00,1,'439691c7979e4962be7dcc314a5870c1',1,'2026-01-04 13:50:39','2026-01-04 13:50:39'),(28,33,6,-20.20,1,'84a5147d7e36440784fbfbe640e8e3ff',3,'2026-01-04 13:57:56','2026-01-04 13:57:56'),(29,36,6,5.80,1,'def87c5e8327450383be6b2b967c3aea',1,'2026-01-04 14:58:52','2026-01-04 14:58:52'),(30,37,6,12.30,1,'edf777f4859c4980a8fb2564ac1d6f7a',1,'2026-01-04 15:42:58','2026-01-04 15:42:58'),(31,38,6,12.30,1,'21e8d21406a544efbf57e36a93bd7c18',1,'2026-01-04 16:54:09','2026-01-04 16:54:09'),(32,39,6,11.60,1,'098a8d5f03a34c93987890583e10c6ee',1,'2026-01-04 20:46:20','2026-01-04 20:46:20'),(33,40,6,12.30,1,'0685c7bf440b433dabf06dc6adfe56c6',1,'2026-01-04 20:52:48','2026-01-04 20:52:48'),(34,40,6,-7.30,1,'387c26788ea74ad3a40890905b0a9507',3,'2026-01-04 20:53:31','2026-01-04 20:53:31'),(35,41,6,38.80,1,'f2b6fc97e2ff4cf5aed11571ec67a40e',1,'2026-01-04 20:56:46','2026-01-04 20:56:46'),(36,42,6,5.80,1,'6b4b7c001e194cf8b8bd967d83a58868',1,'2026-01-05 18:02:26','2026-01-05 18:02:26'),(37,43,6,45.60,1,'e3b5c060125c4f2ab175d2e1aba72e07',1,'2026-01-06 16:42:16','2026-01-06 16:42:16'),(38,44,6,12.30,1,'1183dcbfc1be446b87cb3903ed5ad9d5',1,'2026-01-06 16:44:07','2026-01-06 16:44:07'),(39,45,6,11.00,1,'982c9489817e4db890a322955676a1f1',1,'2026-01-06 16:53:12','2026-01-06 16:53:12'),(40,46,6,5.80,1,'b786a10af8f8412ea2a1adf607b653ec',1,'2026-01-08 09:39:10','2026-01-08 09:39:10'),(41,47,14,8.90,1,'8a5b1b349e074aa4827adcc2ed8a1e9e',1,'2026-01-13 18:08:35','2026-01-13 18:08:35'),(42,48,6,12.30,1,'dbfe11c5826c45a78ac2170a6afdbe20',1,'2026-01-28 14:01:02','2026-01-28 14:01:02'),(43,49,6,11.00,1,'1569e2a3e1f04bad9613ae40be460253',1,'2026-02-04 10:23:21','2026-02-04 10:23:21'),(44,50,6,12.30,1,'838a60accbf540ada912a6b043e06565',1,'2026-02-04 16:48:22','2026-02-04 16:48:22'),(45,55,6,11.00,1,'c4e9b12bcfba4c7c924f016ac1fced05',1,'2026-02-10 11:03:48','2026-02-10 11:03:48'),(46,57,6,5.80,1,'7134982c2ba947f0b668b02b2cefdd54',1,'2026-02-10 16:21:37','2026-02-10 16:21:37'),(47,60,6,12.30,1,'0f9fe3a349ba42c9b8707fc772438301',1,'2026-02-13 10:24:54','2026-02-13 10:24:54'),(48,70,6,5.80,1,'c7bce0517270466fba1bcb07ff2462a5',1,'2026-02-24 09:15:03','2026-02-24 09:15:03'),(49,73,6,12.30,1,'21a13eba6f744257b199e6f51b4f7cb4',1,'2026-02-24 11:00:08','2026-02-24 11:00:08'),(50,74,6,5.80,1,'a36b025dde0b4c68801047b42444295c',1,'2026-02-24 11:07:25','2026-02-24 11:07:25'),(51,77,6,5.80,1,'b2f513ef13cb49e9a642930f8e4f8e9a',1,'2026-02-24 11:15:58','2026-02-24 11:15:58'),(52,78,6,5.80,1,'fe730b2f310a4139a9c9c892f9ee7b61',1,'2026-02-24 13:50:09','2026-02-24 13:50:09'),(53,44,6,-18.30,1,'e4b9c90cfab145d88f887e9bf0ab7bc8',3,'2026-02-24 13:51:44','2026-02-24 13:51:44'),(54,81,6,22.50,1,'9bab569f73b8440ca796fd1f194715d7',1,'2026-02-24 13:54:59','2026-02-24 13:54:59'),(55,45,6,-17.00,1,'dabdc51e150b410d9495d150b3e917bb',3,'2026-02-25 20:27:25','2026-02-25 20:27:25');
/*!40000 ALTER TABLE `oms_payment_record` ENABLE KEYS */;

--
-- Table structure for table `oms_refund_apply`
--

DROP TABLE IF EXISTS `oms_refund_apply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oms_refund_apply` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL COMMENT '订单ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `type` int(1) DEFAULT '1' COMMENT '类型: 1仅退款 2退货退款',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '退款原因',
  `amount` decimal(10,2) DEFAULT NULL COMMENT '退款金额',
  `images` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '凭证图片(JSON数组)',
  `original_order_status` int(1) DEFAULT NULL COMMENT '原订单状态',
  `status` int(1) DEFAULT '0' COMMENT '状态: 0待审核 1审核通过 2审核拒绝',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `audit_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审核备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_order_id` (`order_id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='售后/退款申请表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oms_refund_apply`
--

/*!40000 ALTER TABLE `oms_refund_apply` DISABLE KEYS */;
INSERT INTO `oms_refund_apply` VALUES (3,33,6,1,'测试退款！',20.20,NULL,3,1,'2026-01-04 13:57:56','符合！','2026-01-04 13:57:43','2026-01-04 13:57:43'),(4,40,6,1,'测试',7.30,NULL,2,1,'2026-01-04 20:53:31','测试','2026-01-04 20:53:24','2026-01-04 20:53:24'),(5,45,6,1,'1',17.00,NULL,3,1,'2026-02-25 20:27:25',NULL,'2026-02-19 13:04:50','2026-02-19 13:04:50'),(6,44,6,1,'1',18.30,NULL,3,1,'2026-02-24 13:51:44','测试\n','2026-02-19 13:04:59','2026-02-19 13:04:59');
/*!40000 ALTER TABLE `oms_refund_apply` ENABLE KEYS */;

--
-- Table structure for table `pms_banner`
--

DROP TABLE IF EXISTS `pms_banner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pms_banner` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '标题',
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '图片地址',
  `link_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '跳转链接',
  `sort` int(11) DEFAULT '0' COMMENT '排序',
  `status` int(11) DEFAULT '1' COMMENT '状态: 1启用 0禁用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='轮播图表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pms_banner`
--

/*!40000 ALTER TABLE `pms_banner` DISABLE KEYS */;
INSERT INTO `pms_banner` VALUES (5,'轮播图一','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/fd8bd42ec897430196e6d0c8fd3fb302.jpg',NULL,2,1,'2026-01-04 14:57:07','2026-01-04 14:57:07'),(6,'轮播图二','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/dd39a4c65f2e4893925539b4aa008f22.jpg','http://39.108.166.216:82/medicine',0,1,'2026-01-04 14:57:57','2026-01-04 14:57:57');
/*!40000 ALTER TABLE `pms_banner` ENABLE KEYS */;

--
-- Table structure for table `pms_category`
--

DROP TABLE IF EXISTS `pms_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pms_category` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '分类名称',
  `parent_id` bigint(20) DEFAULT '0' COMMENT '父级ID',
  `level` int(11) DEFAULT '1' COMMENT '层级',
  `sort` int(11) DEFAULT '0' COMMENT '排序',
  `status` int(11) DEFAULT '1' COMMENT '状态: 1启用 0禁用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_parent_id` (`parent_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='药品分类表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pms_category`
--

/*!40000 ALTER TABLE `pms_category` DISABLE KEYS */;
INSERT INTO `pms_category` VALUES (1,'西药',0,1,10,1,'2023-01-15 09:00:00','2023-06-01 14:30:00'),(2,'中药',0,1,20,1,'2023-01-15 09:00:00','2023-06-01 14:30:00'),(3,'医疗器械',0,1,30,1,'2023-01-15 09:00:00','2023-07-10 11:20:00'),(4,'保健食品',0,1,40,1,'2023-01-15 09:00:00','2023-05-22 16:45:00'),(5,'医用耗材',0,1,50,1,'2023-01-15 09:00:00','2023-08-05 10:15:00'),(6,'抗生素类',1,2,1,1,'2023-01-16 10:00:00','2023-09-12 09:30:00'),(7,'心脑血管类',1,2,2,1,'2023-01-16 10:00:00','2023-10-08 15:20:00'),(8,'消化系统类',1,2,3,1,'2023-01-16 10:00:00','2023-11-20 13:45:00'),(9,'解热镇痛类',1,2,4,1,'2023-01-16 10:00:00','2023-12-05 11:10:00'),(10,'呼吸系统类',1,2,5,1,'2023-01-16 10:00:00','2024-01-18 14:25:00'),(11,'中成药',2,2,1,1,'2023-01-17 11:00:00','2023-09-25 10:40:00'),(12,'中药饮片',2,2,2,1,'2023-01-17 11:00:00','2023-10-30 16:15:00'),(13,'滋补药材',2,2,3,1,'2023-01-17 11:00:00','2023-12-12 09:50:00'),(14,'外用膏贴',2,2,4,1,'2023-01-17 11:00:00','2024-01-22 13:35:00'),(15,'检测仪器',3,2,1,1,'2023-01-18 13:00:00','2023-08-14 12:30:00'),(16,'康复器械',3,2,2,1,'2023-01-18 13:00:00','2023-11-08 17:20:00'),(17,'护理用品',3,2,3,1,'2023-01-18 13:00:00','2023-12-28 10:45:00'),(18,'维生素矿物质',4,2,1,1,'2023-01-19 14:00:00','2023-07-20 15:10:00'),(19,'蛋白粉',4,2,2,1,'2023-01-19 14:00:00','2023-09-18 11:25:00'),(20,'益生菌',4,2,3,1,'2023-01-19 14:00:00','2023-10-25 14:50:00'),(21,'一次性用品',5,2,1,1,'2023-01-20 15:00:00','2023-08-30 09:40:00'),(22,'敷料绷带',5,2,2,1,'2023-01-20 15:00:00','2023-11-15 16:30:00'),(23,'注射器械',5,2,3,1,'2023-01-20 15:00:00','2023-12-20 12:15:00'),(24,'青霉素类',6,3,1,1,'2023-02-01 09:30:00','2023-10-05 14:20:00'),(25,'头孢菌素类',6,3,2,1,'2023-02-01 09:30:00','2023-11-12 10:45:00'),(26,'大环内酯类',6,3,3,1,'2023-02-01 09:30:00','2023-12-08 15:30:00'),(27,'降压药',7,3,1,1,'2023-02-02 10:30:00','2023-09-20 11:25:00'),(28,'降脂药',7,3,2,1,'2023-02-02 10:30:00','2023-10-18 13:40:00'),(29,'抗心绞痛药',7,3,3,1,'2023-02-02 10:30:00','2023-12-02 16:15:00'),(30,'感冒咳嗽类',11,3,1,1,'2023-02-03 11:30:00','2023-08-25 09:50:00'),(31,'胃肠消化类',11,3,2,1,'2023-02-03 11:30:00','2023-10-10 14:35:00'),(32,'妇科用药',11,3,3,1,'2023-02-03 11:30:00','2023-11-28 12:20:00'),(33,'血压计',15,3,1,1,'2023-02-04 13:30:00','2023-09-15 17:10:00'),(34,'血糖仪',15,3,2,1,'2023-02-04 13:30:00','2023-10-22 10:45:00'),(35,'体温计',15,3,3,1,'2023-02-04 13:30:00','2023-12-18 15:30:00'),(36,'维生素C',18,3,1,1,'2023-02-05 14:30:00','2023-08-08 11:20:00'),(37,'钙片',18,3,2,1,'2023-02-05 14:30:00','2023-11-05 14:50:00');
/*!40000 ALTER TABLE `pms_category` ENABLE KEYS */;

--
-- Table structure for table `pms_health_article`
--

DROP TABLE IF EXISTS `pms_health_article`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pms_health_article` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '标题',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '分类',
  `summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '摘要',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '内容',
  `cover_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '封面图',
  `status` int(11) DEFAULT '1' COMMENT '状态: 1发布 0草稿',
  `views` int(11) DEFAULT '0' COMMENT '浏览量',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='健康资讯文章表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pms_health_article`
--

/*!40000 ALTER TABLE `pms_health_article` DISABLE KEYS */;
INSERT INTO `pms_health_article` VALUES (3,'夏季科学防晒全攻略：不只是涂防晒霜','日常护理','本文详解紫外线UVA与UVB的区别，指出防晒的常见误区，并提供从选择防晒产品到硬防晒搭配的完整方案，帮助读者有效预防光老化。','防晒原理：解释SPF与PA值的含义，以及如何根据场景选择合适的指数。\n常见误区：澄清“阴天不用防晒”、“防晒霜一天涂一次就够了”等错误观念。\n科学步骤：结合图表，说明正确涂抹量、补涂频率及清洁方法。\n综合防护：强调遮阳伞、太阳镜、防晒衣等硬防晒措施的重要性，并给出搭配建议。','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/5d000266f5a5463dba993cab1c27cd6f.jpg',1,1,'2026-01-04 20:43:50','2026-01-04 20:45:45'),(4,'血糖监测新视角：除了空腹和餐后，这个时间点也很关键','慢性病管理','最新临床指南强调“血糖时间在范围（TIR）”的重要性。本文解释为何要关注餐前血糖与夜间血糖，并指导糖尿病患者如何利用动态血糖仪或更科学的指血监测来绘制个人血糖图谱，实现精细化管理。','管理目标的演变：从只看“空腹血糖”和“糖化血红蛋白”，到重视“血糖时间在范围（TIR）”这一更直观的指标。\n关键监测时间点：\n餐前血糖：评估基础胰岛素功能及上一餐药效是否延续。\n睡前血糖：预防夜间低血糖，尤其对于使用胰岛素或磺脲类药物的患者。\n夜间血糖（凌晨2-3点）：怀疑有“黎明现象”或“苏木杰效应”时的重要排查点。\n行动建议：如何制定为期一周的强化监测计划，并将数据带给医生，以优化治疗方案（如调整药物剂量或饮食结构）。','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/93d5b7d6b6f3463a84f0c98be55386ff.jpg',1,1,'2026-01-04 20:44:21','2026-01-04 20:45:40'),(5,'“抗炎饮食”走红，是科学还是玄学？一份接地气的执行清单','营养保健','慢性炎症被视为多种疾病的共同土壤。本文摒弃复杂理论，直接提供一份可操作的“抗炎饮食”购物清单和食谱示例，帮助您通过日常饮食自然地减轻身体炎症负荷。','核心原则：增加Omega-3脂肪酸、抗氧化剂和膳食纤维；减少精制碳水、加工食品和反式脂肪。\n购物清单：\n多吃：深海鱼（三文鱼）、莓果、深绿色蔬菜、坚果（核桃）、橄榄油、全谷物、豆类、姜黄。\n少吃/避免：含糖饮料、油炸食品、加工肉类、精白米面。\n一日三餐示例：提供从早餐到晚餐的简单搭配（如燕麦莓果早餐、彩虹沙拉午餐、香煎三文鱼配杂粮饭晚餐）。\n重要提醒：强调“抗炎饮食”是一种长期模式，而非短期疗法，需与健康生活方式结合。','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/96601f3dc24143128189fe56d6ce5433.jpg',1,0,'2026-01-04 20:44:46','2026-01-04 20:45:32'),(6,'孩子总揉眼睛、眨眼？当心不是坏习惯，而是过敏性结膜炎','儿童健康','春季是儿童过敏性结膜炎高发期。本文指导家长如何区分过敏性结膜炎与感染性结膜炎（如红眼病），并介绍从家庭护理到规范用药的安全处理流程，避免误用抗生素眼药水。','症状识别：过敏性结膜炎典型症状为眼痒（孩子频繁揉眼）、异物感、流泪，常伴眼皮肿胀，但分泌物多为水样；而感染性结膜炎分泌物多为粘稠或脓性，痒感不突出。\n家庭应急处理：\n使用冷毛巾或冰袋敷眼缓解痒感。\n使用人工泪液冲洗过敏原。\n注意室内卫生，远离花粉、尘螨。\n就医与用药：明确需要在医生指导下使用抗过敏眼药水（如奥洛他定），并可能联合使用鼻喷剂（因常合并过敏性鼻炎）。强调切勿自行使用含激素的眼药水。\n预防建议：在过敏季节来临前，可咨询医生进行预防性用药。','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/44027635b2a44d1990dffc3b89119763.jpg',1,3,'2026-01-04 20:45:01','2026-01-04 20:45:28'),(7,' 办公室微运动指南：8个动作缓解“久坐病”，不影响同事','健康生活','针对办公室人群常见的颈肩、腰背酸痛及下肢循环不畅问题，设计了一套无需离开工位、动作幅度小、隐秘高效的拉伸与力量训练组合。每天花费10分钟，即可显著改善不适。','问题与原理：解释久坐如何导致肌肉僵硬、循环减慢，以及微运动为何能有效对抗这些损害。\n分部位动作详解（附简洁图示或GIF链接描述）：\n肩颈：座椅上的“点头收下巴”、“耸肩绕环”。\n腰背：坐姿体侧伸展、“猫驼式”坐姿版。\n下肢：坐姿提踵、坐姿直腿抬高。\n全身激活：靠墙静蹲（利用会议室）、原地高抬腿（30秒）。\n执行计划：建议每坐1小时，选择2-3个动作，花费2-3分钟进行练习。提供一天内的微运动安排表示例。','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/0a31db54cd0a4073b67a77d52dd0dea0.jpg',1,11,'2026-01-04 20:45:23','2026-01-04 20:45:23');
/*!40000 ALTER TABLE `pms_health_article` ENABLE KEYS */;

--
-- Table structure for table `pms_medicine`
--

DROP TABLE IF EXISTS `pms_medicine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pms_medicine` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '药品名称',
  `category_id` bigint(20) DEFAULT NULL COMMENT '分类ID',
  `main_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主图',
  `price` decimal(10,2) NOT NULL COMMENT '价格',
  `stock` int(11) NOT NULL DEFAULT '0' COMMENT '库存',
  `sales` int(11) DEFAULT '0' COMMENT '销量',
  `is_prescription` tinyint(1) DEFAULT '0' COMMENT '是否处方药: 1是 0否',
  `indication` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '适应症',
  `usage_method` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用法用量',
  `contraindication` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '禁忌',
  `expiry_date` date DEFAULT NULL COMMENT '有效期至',
  `production_date` date DEFAULT NULL COMMENT '生产日期',
  `seller_id` bigint(20) NOT NULL COMMENT '所属商家ID',
  `status` tinyint(4) DEFAULT '1' COMMENT '状态: 1上架 0下架',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `specs` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '规格',
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='药品信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pms_medicine`
--

/*!40000 ALTER TABLE `pms_medicine` DISABLE KEYS */;
INSERT INTO `pms_medicine` VALUES (1,'阿莫西林胶囊',24,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/c150113b4f6440b1b6e05c16fa8e7d8e.jpg',25.50,500,320,1,'用于敏感菌所致的呼吸道感染、泌尿道感染、皮肤软组织感染等','口服，一次0.5g，每6-8小时1次','青霉素过敏者禁用','2025-12-31','2023-10-15',5,1,'2023-11-01 09:00:00','2026-01-04 14:40:51','标准规格',0),(2,'头孢克肟片',25,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/2c19cedb3bea4308ab6a0195e6b0abb5.jpg',38.80,297,211,1,'用于敏感菌引起的支气管炎、肺炎、肾盂肾炎、膀胱炎等','口服，一次0.1g，一日2次','对头孢菌素类抗生素过敏者禁用','2025-09-30','2023-09-20',5,1,'2023-11-02 10:00:00','2026-02-10 16:22:43','标准规格',0),(3,'阿奇霉素片',26,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/c6f9dd557b16414b9d36a0d0040236cf.jpg',42.60,400,180,1,'用于敏感菌引起的呼吸道感染、皮肤软组织感染','口服，一日1次，一次0.5g','对大环内酯类抗生素过敏者禁用','2025-11-30','2023-08-25',5,1,'2023-11-03 11:00:00','2026-01-04 14:40:51','标准规格',0),(4,'硝苯地平缓释片',27,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/2a311bd1fd034a58a9e872b011eb6861.jpg',18.90,600,450,1,'用于高血压、心绞痛','口服，一次10-20mg，一日2次','严重低血压、心源性休克患者禁用','2026-03-31','2023-12-01',5,1,'2023-11-05 14:00:00','2026-01-04 14:40:51','标准规格',0),(5,'阿托伐他汀钙片',28,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/46651597443a45c0b0a6f594a0f3e431.jpg',65.40,350,280,1,'用于高胆固醇血症、冠心病','口服，一次10-20mg，一日1次','活动性肝病患者禁用','2026-06-30','2023-11-15',5,1,'2023-11-06 15:00:00','2026-01-04 14:40:51','标准规格',0),(6,'硝酸甘油片',29,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/b591ea5bae8a48128475d7315e74382f.jpg',12.80,800,520,1,'用于心绞痛急性发作','舌下含服，一次0.5mg','严重贫血、颅内压增高者禁用','2025-08-31','2023-07-30',5,1,'2023-11-07 16:00:00','2026-01-04 14:40:51','标准规格',0),(7,'奥美拉唑肠溶胶囊',8,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/b1a9daf796f740d6b3317655b0c68c20.jpg',36.70,450,310,0,'用于胃溃疡、十二指肠溃疡、反流性食管炎','口服，一次20mg，一日1-2次','对本品过敏者禁用','2025-10-31','2023-10-10',5,1,'2023-11-08 09:30:00','2026-01-04 14:40:51','标准规格',0),(8,'多潘立酮片',8,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/bef2b01e664648c98cfeb322d4597bd5.jpg',15.20,549,391,0,'用于消化不良、腹胀、嗳气、恶心、呕吐','口服，一次10mg，一日3次','胃肠道出血、机械性肠梗阻患者禁用','2025-07-31','2023-06-25',5,1,'2023-11-09 10:30:00','2026-01-04 14:40:51','标准规格',0),(9,'布洛芬缓释胶囊',9,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/568bcd3f3a104f4a8c5ad67b7005fe87.jpg',22.50,699,561,0,'用于缓解轻至中度疼痛，如头痛、关节痛、偏头痛等','口服，一次0.3g，一日2次','对阿司匹林过敏的哮喘患者禁用','2025-05-31','2023-04-20',5,1,'2023-11-10 11:30:00','2026-02-24 13:54:58','标准规格',0),(10,'对乙酰氨基酚片',9,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/e582fba5e920488d84612307725e6b09.jpg',8.90,899,721,0,'用于普通感冒或流行性感冒引起的发热，缓解轻至中度疼痛','口服，一次0.3-0.6g，一日3-4次','严重肝肾功能不全者禁用','2025-09-30','2023-08-15',5,1,'2023-11-11 12:30:00','2026-01-13 18:08:34','标准规格',0),(11,'盐酸氨溴索口服溶液',10,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/c482d36875864a56b2238356141a2d53.jpg',28.40,380,240,0,'用于急、慢性呼吸道疾病引起的痰液粘稠、咳痰困难','口服，一次10ml，一日3次','对本品过敏者禁用','2025-04-30','2023-03-28',5,1,'2023-11-12 13:30:00','2026-01-04 14:40:51','标准规格',0),(12,'孟鲁司特钠片',10,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/62182130bd4645c8a06ee83c2596396e.jpg',52.60,280,190,1,'用于成人及儿童哮喘的预防和长期治疗','口服，一次10mg，一日1次','对本品过敏者禁用','2025-12-31','2023-11-05',5,1,'2023-11-13 14:30:00','2026-01-04 14:40:51','标准规格',0),(13,'连花清瘟胶囊',30,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/e5e21ae1aba840ca9641cfb5ad874996.jpg',35.80,420,380,0,'用于治疗流行性感冒属热毒袭肺证','口服，一次4粒，一日3次','对本品过敏者禁用','2025-08-31','2023-07-25',5,1,'2023-11-15 08:30:00','2026-01-04 14:40:51','标准规格',0),(14,'板蓝根颗粒',30,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/9ca207e1798e409a809d498e04a13b75.jpg',12.50,850,650,0,'用于肺胃热盛所致的咽喉肿痛、口咽干燥','开水冲服，一次1-2袋，一日3-4次','对本品过敏者禁用','2025-10-31','2023-09-18',5,1,'2023-11-16 09:30:00','2026-02-13 11:52:30','标准规格',0),(15,'藿香正气口服液',31,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/72bd27b908254c71bbdaadda557633af.jpg',24.90,520,410,0,'用于外感风寒、内伤湿滞所致的感冒','口服，一次5-10ml，一日2次','对本品过敏者禁用','2025-07-31','2023-06-30',5,1,'2023-11-17 10:30:00','2026-01-04 14:40:51','标准规格',0),(16,'保和丸',31,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/6dca3d39e0d94f78962a60d3de906b54.jpg',18.70,479,321,0,'用于食积停滞，脘腹胀满，嗳腐吞酸，不欲饮食','口服，一次6-9g，一日2次','孕妇慎用','2025-09-30','2023-08-22',5,1,'2023-11-18 11:30:00','2026-01-04 14:40:51','标准规格',0),(17,'乌鸡白凤丸',32,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/a1b5a0ab0ed94ac48376ebd85cdbe316.jpg',46.80,320,210,0,'用于气血两虚，身体瘦弱，腰膝酸软，月经不调','口服，一次6g，一日2次','对本品过敏者禁用','2025-12-31','2023-11-10',5,1,'2023-11-19 12:30:00','2026-01-04 14:40:51','标准规格',0),(18,'益母草颗粒',32,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/dc26b43d56ff4cae98e48e78375e5182.jpg',16.40,580,430,0,'用于血瘀所致的月经不调，产后恶露不绝','开水冲服，一次1袋，一日2次','孕妇禁用','2025-06-30','2023-05-25',5,1,'2023-11-20 13:30:00','2026-01-04 14:40:51','标准规格',0),(19,'电子血压计',33,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/b973b7d8ab014d47bf5346b2dce56398.jpg',158.00,119,86,0,'用于家庭血压监测','按照说明书操作','无','2027-12-31','2023-10-05',5,1,'2023-11-22 14:00:00','2026-01-04 14:40:51','标准规格',0),(20,'血糖仪',34,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/bededac3cf0e40b3968b6ed793884088.jpg',198.00,95,62,0,'用于糖尿病患者血糖监测','配合试纸使用，按照说明书操作','无','2026-11-30','2023-09-12',5,1,'2023-11-23 15:00:00','2026-01-04 14:40:51','标准规格',0),(21,'电子体温计',35,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/bc2875f41f9f4f8bbfd68280683062f9.jpg',32.50,280,190,0,'用于体温测量','腋下或口腔测量，按照说明书操作','无','2026-08-31','2023-07-18',5,1,'2023-11-24 16:00:00','2026-01-04 14:40:51','标准规格',0),(22,'维生素C咀嚼片',36,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/bf3592e60b9e4b5ba987f2c4b6cd2f81.jpg',45.60,649,521,0,'补充维生素C，增强免疫力','咀嚼，一次1片，一日1次','对本品过敏者禁用','2025-03-31','2023-02-28',5,1,'2023-11-26 08:30:00','2026-01-06 16:42:15','标准规格',0),(23,'碳酸钙D3片',37,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/8586fcab50ee4b96836aa3b88a17ec0b.jpg',68.90,420,310,0,'补钙，预防骨质疏松','口服，一次1片，一日1-2次','高钙血症、高尿酸血症患者禁用','2025-05-31','2023-04-15',5,1,'2023-11-27 09:30:00','2026-01-04 14:40:51','标准规格',0),(24,'创可贴',21,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/2b9478d7ea064a4f91c265fa26c708da.jpg',5.80,1492,1210,0,'用于小创伤、擦伤等患处','清洁伤口后贴于患处','对胶布过敏者慎用','2026-04-30','2023-03-10',5,1,'2023-11-28 10:30:00','2026-02-24 14:25:00','标准规格',0),(25,'医用纱布',22,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/196104cb650a4538997b7bcd485cf3a9.jpg',12.30,972,758,0,'用于伤口包扎、止血','清洁伤口后覆盖包扎','无','2027-02-28','2023-01-20',5,1,'2023-11-29 11:30:00','2026-02-24 11:00:07','标准规格',0),(26,'盐酸左氧氟沙星片',24,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/2cc38112c5994152ba5c95189c719847.jpg',28.70,0,420,1,'用于敏感菌引起的呼吸道、泌尿系统感染','口服，一次0.2g，一日2次','对喹诺酮类药物过敏者禁用','2024-06-30','2022-12-25',5,0,'2023-10-15 09:00:00','2026-01-04 14:40:51','标准规格',0),(27,'复方甘草片',30,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/0d64c9886c5b4f06a5ca50821a890937.jpg',15.40,0,280,1,'用于镇咳祛痰','口服，一次2-3片，一日3次','孕妇及哺乳期妇女禁用','2024-03-31','2022-10-20',5,0,'2023-10-20 10:00:00','2026-01-04 14:40:51','标准规格',0),(68,'测试商品二',1,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/c17fb1a4e42a4d01857cbc91d5a5e718.jpg',11.00,343,0,0,'测试适应症','测试用法用量','测试禁忌','2026-01-29','2026-01-12',5,1,'2026-01-04 20:53:57','2026-01-05 18:01:39','标准规格',0),(69,'测试商品一1',7,'https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/975262be4a504098ad5413124c83133b.jpg',11.00,201,3,0,'测试适应症','测试用法用量','测试禁忌','2026-01-19','2026-01-04',5,0,'2026-01-04 21:09:12','2026-02-24 10:53:00','标准规格',1);
/*!40000 ALTER TABLE `pms_medicine` ENABLE KEYS */;

--
-- Table structure for table `pms_medicine_comment`
--

DROP TABLE IF EXISTS `pms_medicine_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pms_medicine_comment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `medicine_id` bigint(20) NOT NULL COMMENT '药品ID',
  `order_id` bigint(20) NOT NULL COMMENT '订单ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `user_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户名',
  `user_avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户头像',
  `star` int(11) NOT NULL DEFAULT '5' COMMENT '评分(1-5)',
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '评价内容',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '评价图片(逗号分隔)',
  `reply` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '商家回复',
  `reply_time` datetime DEFAULT NULL COMMENT '回复时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_medicine_id` (`medicine_id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_order_id` (`order_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='药品评价表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pms_medicine_comment`
--

/*!40000 ALTER TABLE `pms_medicine_comment` DISABLE KEYS */;
INSERT INTO `pms_medicine_comment` VALUES (5,8,33,6,'用户6',NULL,5,'非常好！',NULL,'谢谢你！','2026-01-04 14:26:24','2026-01-04 13:57:19','2026-01-04 13:57:19',0),(6,24,39,6,'用户6',NULL,5,'测试评价',NULL,'非常好！','2026-01-04 20:53:42','2026-01-04 20:52:26','2026-01-04 20:52:26',0);
/*!40000 ALTER TABLE `pms_medicine_comment` ENABLE KEYS */;

--
-- Table structure for table `pms_medicine_favorite`
--

DROP TABLE IF EXISTS `pms_medicine_favorite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pms_medicine_favorite` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `medicine_id` bigint(20) NOT NULL COMMENT '药品ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_medicine` (`user_id`,`medicine_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='药品收藏表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pms_medicine_favorite`
--

/*!40000 ALTER TABLE `pms_medicine_favorite` DISABLE KEYS */;
/*!40000 ALTER TABLE `pms_medicine_favorite` ENABLE KEYS */;

--
-- Table structure for table `pms_medicine_footprint`
--

DROP TABLE IF EXISTS `pms_medicine_footprint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pms_medicine_footprint` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `medicine_id` bigint(20) NOT NULL COMMENT '药品ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=440 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='药品足迹表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pms_medicine_footprint`
--

/*!40000 ALTER TABLE `pms_medicine_footprint` DISABLE KEYS */;
INSERT INTO `pms_medicine_footprint` VALUES (229,5,22,'2026-01-04 11:10:35','2026-01-04 11:10:34'),(231,5,21,'2026-01-04 11:10:48','2026-01-04 11:10:47'),(233,5,20,'2026-01-04 11:11:06','2026-01-04 11:11:06'),(235,5,19,'2026-01-04 11:11:55','2026-01-04 11:11:54'),(237,5,18,'2026-01-04 11:12:48','2026-01-04 11:12:48'),(239,5,17,'2026-01-04 11:13:08','2026-01-04 11:13:08'),(241,5,16,'2026-01-04 11:13:33','2026-01-04 11:13:33'),(243,5,24,'2026-01-04 11:14:02','2026-01-04 11:14:02'),(245,5,23,'2026-01-04 11:14:07','2026-01-04 11:14:06'),(247,5,15,'2026-01-04 11:17:02','2026-01-04 11:17:01'),(249,5,14,'2026-01-04 11:17:30','2026-01-04 11:17:29'),(251,5,13,'2026-01-04 11:17:49','2026-01-04 11:17:48'),(253,5,12,'2026-01-04 11:18:09','2026-01-04 11:18:09'),(255,5,11,'2026-01-04 11:18:33','2026-01-04 11:18:33'),(257,5,10,'2026-01-04 11:18:58','2026-01-04 11:18:57'),(259,5,9,'2026-01-04 11:19:18','2026-01-04 11:19:18'),(261,5,8,'2026-01-04 11:19:49','2026-01-04 11:19:48'),(263,5,7,'2026-01-04 11:20:32','2026-01-04 11:20:31'),(265,5,6,'2026-01-04 11:21:10','2026-01-04 11:21:10'),(267,5,5,'2026-01-04 11:21:47','2026-01-04 11:21:46'),(269,5,4,'2026-01-04 11:22:10','2026-01-04 11:22:09'),(271,5,3,'2026-01-04 11:22:43','2026-01-04 11:22:42'),(273,5,2,'2026-01-04 11:23:49','2026-01-04 11:23:49'),(275,5,1,'2026-01-04 11:24:01','2026-01-04 11:24:00'),(277,5,27,'2026-01-04 11:24:24','2026-01-04 11:24:23'),(279,5,26,'2026-01-04 11:24:45','2026-01-04 11:24:45'),(283,6,16,'2026-01-04 13:50:22','2026-01-04 13:50:22'),(285,6,19,'2026-01-04 13:50:35','2026-01-04 13:50:34'),(310,6,7,'2026-01-04 14:37:09','2026-01-04 14:37:09'),(314,5,25,'2026-01-04 14:46:16','2026-01-04 14:46:15'),(357,5,68,'2026-01-05 18:01:15','2026-01-05 18:01:14'),(362,6,68,'2026-01-06 16:34:15','2026-01-06 16:34:15'),(371,6,13,'2026-01-08 09:48:59','2026-01-08 09:48:59'),(379,14,10,'2026-01-13 18:07:31','2026-01-13 18:07:31'),(380,14,6,'2026-01-13 18:08:51','2026-01-13 18:08:51'),(386,6,15,'2026-01-28 15:48:37','2026-01-28 15:48:37'),(387,14,68,'2026-01-29 16:37:16','2026-01-29 16:37:15'),(388,14,68,'2026-01-29 16:37:16','2026-01-29 16:37:15'),(390,14,14,'2026-01-29 16:37:24','2026-01-29 16:37:24'),(410,6,2,'2026-02-10 15:28:41','2026-02-10 15:28:40'),(412,6,69,'2026-02-10 15:41:47','2026-02-10 15:41:46'),(416,6,21,'2026-02-10 15:42:39','2026-02-10 15:42:39'),(423,5,69,'2026-02-10 18:06:17','2026-02-10 18:06:16'),(427,6,8,'2026-02-10 21:39:04','2026-02-10 21:39:04'),(429,6,22,'2026-02-10 21:39:20','2026-02-10 21:39:19'),(431,6,10,'2026-02-24 09:09:17','2026-02-24 09:09:16'),(433,6,24,'2026-02-24 09:14:49','2026-02-24 09:14:49'),(435,6,25,'2026-02-24 10:59:00','2026-02-24 10:59:00'),(439,6,9,'2026-02-24 13:54:48','2026-02-24 13:54:48');
/*!40000 ALTER TABLE `pms_medicine_footprint` ENABLE KEYS */;

--
-- Table structure for table `sms_coupon`
--

DROP TABLE IF EXISTS `sms_coupon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_coupon` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '优惠券名称',
  `type` int(11) DEFAULT '0' COMMENT '类型: 0全场通用 1指定分类 2指定商品',
  `min_point` decimal(10,2) DEFAULT '0.00' COMMENT '使用门槛',
  `amount` decimal(10,2) NOT NULL COMMENT '抵扣金额',
  `per_limit` int(11) DEFAULT '1' COMMENT '每人限领张数',
  `use_count` int(11) DEFAULT '0' COMMENT '使用数量',
  `receive_count` int(11) DEFAULT '0' COMMENT '领取数量',
  `total_count` int(11) NOT NULL COMMENT '发行数量',
  `status` int(11) DEFAULT '1' COMMENT '状态: 1生效 0失效',
  `start_time` datetime DEFAULT NULL COMMENT '生效时间',
  `end_time` datetime DEFAULT NULL COMMENT '失效时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='优惠券表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_coupon`
--

/*!40000 ALTER TABLE `sms_coupon` DISABLE KEYS */;
INSERT INTO `sms_coupon` VALUES (3,'体验优惠券',0,0.00,10.00,2,1,1,2,1,'2026-01-04 00:00:00','2026-01-31 00:00:00','2026-01-04 20:46:47','2026-01-04 20:52:46'),(4,'测试优惠券',0,0.00,10.00,1,1,1,1,1,'2026-02-24 00:00:00','2026-02-28 00:00:00','2026-02-24 13:53:07','2026-02-24 13:54:57');
/*!40000 ALTER TABLE `sms_coupon` ENABLE KEYS */;

--
-- Table structure for table `sms_coupon_history`
--

DROP TABLE IF EXISTS `sms_coupon_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_coupon_history` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint(20) NOT NULL COMMENT '优惠券ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `order_id` bigint(20) DEFAULT NULL COMMENT '订单ID',
  `coupon_code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '优惠券码',
  `member_nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '领取人昵称',
  `get_type` int(11) DEFAULT '1' COMMENT '获取类型: 0后台赠送 1主动领取',
  `use_status` int(11) DEFAULT '0' COMMENT '使用状态: 0未使用 1已使用 2已过期',
  `use_time` datetime DEFAULT NULL COMMENT '使用时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_coupon_id` (`coupon_id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='优惠券领取记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_coupon_history`
--

/*!40000 ALTER TABLE `sms_coupon_history` DISABLE KEYS */;
INSERT INTO `sms_coupon_history` VALUES (4,3,6,40,'dbc04aa5',NULL,1,1,'2026-01-04 20:52:47','2026-01-04 20:52:36','2026-01-04 20:52:46'),(5,4,6,81,'9b0342b8',NULL,1,1,'2026-02-24 13:54:58','2026-02-24 13:53:15','2026-02-24 13:54:57');
/*!40000 ALTER TABLE `sms_coupon_history` ENABLE KEYS */;

--
-- Table structure for table `sys_config`
--

DROP TABLE IF EXISTS `sys_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_config` (
  `config_key` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '配置键',
  `config_value` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置值',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '描述',
  PRIMARY KEY (`config_key`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='系统配置表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_config`
--

/*!40000 ALTER TABLE `sys_config` DISABLE KEYS */;
INSERT INTO `sys_config` VALUES ('service_phone','','客服电话'),('site_copyright','© 2024 Zhijian System. All Rights Reserved.','版权信息'),('site_icp','','ICP备案号'),('site_title','智简医药供应链平台','平台名称');
/*!40000 ALTER TABLE `sys_config` ENABLE KEYS */;

--
-- Table structure for table `sys_merchant`
--

DROP TABLE IF EXISTS `sys_merchant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_merchant` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '关联用户ID',
  `shop_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '店铺名称',
  `shop_logo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '店铺Logo',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '店铺简介',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '店铺地址',
  `license_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '营业执照图片',
  `id_card_front` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '法人身份证正面',
  `id_card_back` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '法人身份证背面',
  `audit_status` tinyint(4) DEFAULT '0' COMMENT '审核状态: 0待审核 1审核通过 2审核驳回',
  `audit_remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审核备注',
  `contact_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '联系电话',
  `credit_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '统一社会信用代码',
  `business_status` tinyint(4) DEFAULT '1' COMMENT '营业状态: 1营业 0休息',
  `business_hours` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '09:00-22:00' COMMENT '营业时间',
  `delivery_fee` decimal(10,2) DEFAULT '0.00' COMMENT '配送费',
  `min_delivery_amount` decimal(10,2) DEFAULT '0.00' COMMENT '起送金额',
  `notice` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '店铺公告',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='商家信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_merchant`
--

/*!40000 ALTER TABLE `sys_merchant` DISABLE KEYS */;
INSERT INTO `sys_merchant` VALUES (12,5,'西安大药房','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/24c22411088e4cbb9c56bc0e8120c3f5.jpg','西安大药房值得您的信赖！','陕西省西安市雁塔区科技二路','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/7a3421d5bf914cd7894573b104f98dc8.jpeg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/d7cc999d03ee4ac5b75a2f850d03dff9.jpeg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/251924a860484afa9f42170340b7aece.jpeg',1,NULL,'刘昊楠','13796323223','91440101304662708A',1,'09:00-22:00',6.00,0.00,'测试！','2026-01-04 10:47:40','2026-01-04 10:55:37'),(13,7,'西安大药房','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/05/5d0f0af2d04847e9ab3d4417c04fa55a.jpg','西安大药房值得您信赖','陕西省西安市雁塔区大华股份产业园','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/05/14d41f915f2a4f838083361eab7f6358.jpg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/05/f2862077181f4231be114a864e2c61ab.jpg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/05/eeb3da04b01a48f98434dd796955afcc.jpg',1,NULL,'刘昊楠','13796323223','A1234567894561000',1,'09:00-22:00',0.00,0.00,NULL,'2026-01-05 10:30:21','2026-01-05 10:30:21'),(14,15,'Xian大药房','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/28/6573bc44ec1744f58b05d612dcf5d8f6.jpeg','Xian大药房','Xian大药房','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/28/80f056de20ee41379282959b4e5cab5e.jpeg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/28/6c23b5b2c714415a9b915783e511e484.jpeg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/28/d769c4da6f2f48aea6143e3e480b81ff.jpeg',1,'法人身份证没上传','Nick.Liu','13796323221','dsa4646w1q231q3',1,'09:00-22:00',0.00,0.00,NULL,'2026-01-28 10:40:55','2026-01-28 10:40:55'),(15,18,'测试大药房','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/02/25/e4cafe708afc4d42a374a2364b415f3d.png','测试大药房','大药房','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/02/25/0e8f7a4b2b4d4a7dbefec06964524141.jpeg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/02/25/80b9bcc2572a4a52b917d6a1af79f2b1.jpeg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/02/25/c7aa1b31700b4485bb4d1b305634030c.jpeg',1,'审核未通过：测试原因。请按要求完善后重新提交入驻申请再审。','刘昊楠','13077709345','djsakjdlkwnlnjkbkbasda',1,'09:00-22:00',0.00,0.00,NULL,'2026-02-25 15:22:01','2026-02-25 15:22:01');
/*!40000 ALTER TABLE `sys_merchant` ENABLE KEYS */;

--
-- Table structure for table `sys_patient`
--

DROP TABLE IF EXISTS `sys_patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_patient` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT '关联用户ID',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '真实姓名',
  `id_card` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '身份证号',
  `id_card_front` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '身份证正面URL',
  `id_card_back` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '身份证背面URL',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '联系电话',
  `gender` tinyint(4) DEFAULT '0' COMMENT '性别(0-未知 1-男 2-女)',
  `birthday` date DEFAULT NULL COMMENT '出生日期',
  `is_default` int(11) DEFAULT '0' COMMENT '是否默认(0-否 1-是)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='就诊人/实名档案表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_patient`
--

/*!40000 ALTER TABLE `sys_patient` DISABLE KEYS */;
INSERT INTO `sys_patient` VALUES (4,6,'刘昊楠','230281200203053215','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/b12da79a14514da4ae132f18bdb1931c.jpeg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/9fd4899b425047a2851432e996563958.jpeg','13796323223',1,'2002-03-05',1,'2026-01-04 13:49:13','2026-01-05 18:04:21'),(5,6,'李四','230281200306111810','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/b9781670e0fb4937916eb105d940b447.jpg','https://liuhaonan-java-ai.oss-cn-shenzhen.aliyuncs.com/zhijian/2026/01/04/678e4e92029b404f9b911746379747e0.jpg','13077709345',1,'2009-01-07',0,'2026-01-04 20:48:35','2026-01-04 20:48:35');
/*!40000 ALTER TABLE `sys_patient` ENABLE KEYS */;

--
-- Table structure for table `sys_user`
--

DROP TABLE IF EXISTS `sys_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '加密密码',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '昵称',
  `mobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '手机号',
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色: USER, SELLER, RIDER, ADMIN, PHARMACIST',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '头像',
  `status` tinyint(4) DEFAULT '1' COMMENT '状态: 1正常 0禁用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_username` (`username`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_user`
--

/*!40000 ALTER TABLE `sys_user` DISABLE KEYS */;
INSERT INTO `sys_user` VALUES (5,'shangjia','$2a$10$b99CQlvCpKNPVz0lCyUh1OTI8im8RDiuLF/rIDvaLqzAGBP/8veU2',NULL,'13000000000','SELLER',NULL,1,'2025-12-29 14:19:50','2026-01-05 17:17:44'),(6,'user','$2a$10$b99CQlvCpKNPVz0lCyUh1OTI8im8RDiuLF/rIDvaLqzAGBP/8veU2',NULL,'13100000000','USER',NULL,1,'2025-12-29 14:22:02','2026-02-04 11:06:01'),(7,'admin','$2a$10$b99CQlvCpKNPVz0lCyUh1OTI8im8RDiuLF/rIDvaLqzAGBP/8veU2',NULL,'13200000000','ADMIN',NULL,1,'2025-12-29 14:22:36','2026-01-05 17:17:47'),(13,'13400000000','$2a$10$b99CQlvCpKNPVz0lCyUh1OTI8im8RDiuLF/rIDvaLqzAGBP/8veU2',NULL,'13400000000','RIDER',NULL,1,'2025-12-30 15:10:21','2026-01-05 17:17:49'),(14,'Liuhaonan','$2a$10$/AjoOrqOvtZWKFgXuGJ/muAqmIecRYg7xDi5nKKCniItF4VMaLhIO',NULL,'13796323223','USER',NULL,1,'2026-01-13 18:05:28','2026-01-13 18:05:28'),(15,'xian','$2a$10$lBy4hTB65UpIz90j9KFn2uK4oQA2scm7bQBRqpeuC6me3hJY/IpqW',NULL,'13796323221','SELLER',NULL,1,'2026-01-28 10:38:12','2026-01-28 10:38:12'),(16,'ai_test_46702','$2a$10$VgNkQPelP941P7BOW0.8I.ExbT7veRjCD4dwqOgJ5JeYT5dFQQx22',NULL,'13810019281','USER',NULL,1,'2026-02-10 16:17:32','2026-02-10 16:17:32'),(17,'ai_test_69574','$2a$10$N5jz7whgR.03afb27dAFb.NtUgH/dhbJG9K69LKSyxuDMka0XWoW2',NULL,'13834151941','USER',NULL,1,'2026-02-10 16:19:19','2026-02-25 14:32:22'),(18,'zhangsan1','$2a$10$dskE8z0Y1vOZdeIqoE5eN.5N695ZJSNolhu4dZ5FXV5/nu/Qe3Fvy',NULL,'13077709345','SELLER',NULL,1,'2026-02-25 15:20:48','2026-02-25 15:20:48'),(19,'lisi','$2a$10$Zq5/1ckPRBBfT9R9x4gw4O3bfDIsNDMD5pk/g1dqEbYVwd96EVEHS',NULL,'13077709344','SELLER',NULL,1,'2026-02-26 09:56:58','2026-02-26 09:56:58');
/*!40000 ALTER TABLE `sys_user` ENABLE KEYS */;

--
-- Table structure for table `sys_user_address`
--

DROP TABLE IF EXISTS `sys_user_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_user_address` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `receiver_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人姓名',
  `receiver_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '收货人手机号',
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '省份',
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '城市',
  `region` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '区/县',
  `detail_address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '详细地址',
  `is_default` int(11) DEFAULT '0' COMMENT '是否默认: 1是 0否',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC COMMENT='用户收货地址表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_user_address`
--

/*!40000 ALTER TABLE `sys_user_address` DISABLE KEYS */;
INSERT INTO `sys_user_address` VALUES (3,6,'刘昊楠','13796323223','陕西省','西安','雁塔区','科技二路',0,'2026-01-04 13:45:23','2026-01-04 20:48:41'),(4,6,'刘昊楠','13796323223','陕西','西安','欧锦圆','C座4单元',1,'2026-01-04 16:54:03','2026-01-04 20:48:39'),(5,6,'张三','13077709345','陕西省','西安市','雁塔区','欧锦圆',0,'2026-01-04 20:49:18','2026-01-04 20:49:18'),(6,14,'刘昊楠','13796323223','陕西省','西安市','雁塔区欧锦圆C座','304',1,'2026-01-13 18:08:14','2026-01-13 18:08:14'),(7,16,'ZhangSan','13800138000','GuangDong','ShenZhen','NanShan','TestStreet123',1,'2026-02-10 16:17:32','2026-02-10 16:17:32'),(8,17,'ZhangSan','13800138000','GuangDong','ShenZhen','NanShan','TestStreet123',1,'2026-02-10 16:19:19','2026-02-10 16:19:19'),(9,1,'测试用户','13800138000','上海市','上海市','浦东新区','测试路 1 号',1,'2026-02-24 10:19:15','2026-02-24 10:19:15');
/*!40000 ALTER TABLE `sys_user_address` ENABLE KEYS */;

--
-- Dumping routines for database 'zhijian_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-26 10:15:59
