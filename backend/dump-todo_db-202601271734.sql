-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: todo_db
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.2

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
-- Table structure for table `bin`
--

DROP TABLE IF EXISTS `bin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bin` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `priority` int NOT NULL DEFAULT '0',
  `datetime_local` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ISO 8601格式的日期时间',
  `deadline` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ISO 8601格式的截止日期',
  `reminder_at` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ISO 8601格式的提醒时间',
  `is_reminded` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已发送提醒',
  `parent_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depth` int NOT NULL DEFAULT '0',
  `list_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `pinned_at` datetime DEFAULT NULL,
  `time_order_index` int DEFAULT '0',
  `group_order_index` int DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bin_user_id` (`user_id`),
  KEY `idx_bin_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bin`
--

LOCK TABLES `bin` WRITE;
/*!40000 ALTER TABLE `bin` DISABLE KEYS */;
INSERT INTO `bin` VALUES ('bin-001','旧任务 - 完成项目提案','这是一个已删除的旧任务',1,2,'2025-09-10T10:00:00.000Z','2025-09-12T00:00:00.000Z',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,0,0,'2025-09-10 10:00:00','2025-09-11 15:00:00','2025-09-13 09:30:00'),('bin-002','旧任务 - 团队会议记录','记录讨论的要点和行动项',0,1,'2025-09-05T14:00:00.000Z','2025-09-06T00:00:00.000Z',NULL,0,NULL,0,'todolist-002','group-004','user-001',0,NULL,0,0,'2025-09-05 14:00:00','2025-09-05 15:30:00','2025-09-12 16:20:00'),('bin-003','已取消的学习任务','由于时间冲突取消的学习计划',0,3,'2025-09-08T09:00:00.000Z','2025-09-09T00:00:00.000Z',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,0,0,'2025-09-08 09:00:00','2025-09-08 09:00:00','2025-09-10 11:45:00'),('bin-004','旧任务 - 购买日用品','每周购物清单',1,2,'2025-09-07T18:00:00.000Z','2025-09-08T00:00:00.000Z',NULL,0,NULL,0,'todolist-003',NULL,'user-002',0,NULL,0,0,'2025-09-07 18:00:00','2025-09-07 19:30:00','2025-09-11 09:15:00'),('bin-005','已完成的阅读任务','《程序员修炼之道》阅读笔记',1,3,'2025-09-01T10:00:00.000Z','2025-09-05T00:00:00.000Z',NULL,0,NULL,0,'todolist-004','group-006','user-002',0,NULL,0,0,'2025-09-01 10:00:00','2025-09-04 16:45:00','2025-09-09 14:30:00'),('bin-006','已完成的健身任务','完成30天健身挑战',1,2,'2025-09-01T07:00:00.000Z','2025-09-05T00:00:00.000Z',NULL,0,NULL,0,'todolist-005','group-007','user-003',0,NULL,0,0,'2025-09-01 07:00:00','2025-09-05 18:30:00','2025-09-08 08:20:00'),('bin-007','取消的户外活动','由于天气原因取消的徒步计划',0,1,'2025-09-09T09:00:00.000Z','2025-09-10T00:00:00.000Z',NULL,0,NULL,0,'todolist-005',NULL,'user-003',0,NULL,0,0,'2025-09-09 09:00:00','2025-09-09 09:00:00','2025-09-09 11:30:00');
/*!40000 ALTER TABLE `bin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `focus_record`
--

DROP TABLE IF EXISTS `focus_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `focus_record` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_minutes` int DEFAULT NULL COMMENT '持续时间（分钟）',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `mode` enum('pomodoro','normal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pomodoro',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_focus_record_user_id` (`user_id`),
  KEY `idx_focus_record_task_id` (`task_id`),
  KEY `idx_focus_record_created_at` (`created_at`),
  CONSTRAINT `focus_record_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `focus_record_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `focus_record`
--

LOCK TABLES `focus_record` WRITE;
/*!40000 ALTER TABLE `focus_record` DISABLE KEYS */;
INSERT INTO `focus_record` VALUES ('focus-001','user-001','task-001','2025-09-16 09:00:00','2025-09-16 09:25:00',25,'专注学习React基础',1,'pomodoro','2025-09-16 09:00:00','2025-09-16 09:25:00'),('focus-002','user-001','task-002','2025-09-16 09:35:00','2025-09-16 10:00:00',25,'学习React Hooks',1,'pomodoro','2025-09-16 09:35:00','2025-09-16 10:00:00'),('focus-003','user-001','task-007','2025-09-16 14:00:00','2025-09-16 15:30:00',90,'深入学习TypeScript高级特性',1,'normal','2025-09-16 14:00:00','2025-09-16 15:30:00'),('focus-004','user-002','task-015','2025-09-16 20:00:00','2025-09-16 20:25:00',25,'阅读代码整洁之道',1,'pomodoro','2025-09-16 20:00:00','2025-09-16 20:25:00'),('focus-005','user-003','task-018','2025-09-17 07:00:00','2025-09-17 07:45:00',45,'晨跑训练',1,'normal','2025-09-17 07:00:00','2025-09-17 07:45:00'),('focus-006','user-001','task-009','2025-09-17 10:00:00','2025-09-17 10:25:00',25,'完成API文档编写',1,'pomodoro','2025-09-17 10:00:00','2025-09-17 10:25:00');
/*!40000 ALTER TABLE `focus_record` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `calculate_duration_before_insert` BEFORE INSERT ON `focus_record` FOR EACH ROW BEGIN
  SET NEW.duration_minutes = TIMESTAMPDIFF(MINUTE, NEW.start_time, NEW.end_time);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `calculate_duration_before_update` BEFORE UPDATE ON `focus_record` FOR EACH ROW BEGIN
  SET NEW.duration_minutes = TIMESTAMPDIFF(MINUTE, NEW.start_time, NEW.end_time);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `oss_files`
--

DROP TABLE IF EXISTS `oss_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oss_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL COMMENT '文件名',
  `object_key` varchar(255) NOT NULL COMMENT 'OSS对象键（缩短长度以避免索引过长）',
  `file_type` varchar(50) NOT NULL COMMENT '文件类型/扩展名',
  `file_size` bigint NOT NULL COMMENT '文件大小（字节）',
  `oss_url` varchar(255) NOT NULL COMMENT 'OSS文件完整URL（缩短长度）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_object_key` (`object_key`(191)),
  KEY `idx_file_type` (`file_type`),
  KEY `idx_oss_files_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='OSS文件主表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oss_files`
--

LOCK TABLES `oss_files` WRITE;
/*!40000 ALTER TABLE `oss_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `oss_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task`
--

DROP TABLE IF EXISTS `task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `priority` int NOT NULL DEFAULT '0',
  `datetime_local` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ISO 8601格式的日期时间',
  `deadline` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ISO 8601格式的截止日期',
  `reminder_at` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ISO 8601格式的提醒时间',
  `is_reminded` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已发送提醒',
  `parent_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depth` int NOT NULL DEFAULT '0',
  `list_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `pinned_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `time_order_index` int DEFAULT '0',
  `group_order_index` int DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  KEY `idx_task_is_pinned` (`is_pinned`),
  KEY `idx_task_pinned_at` (`pinned_at`),
  KEY `idx_task_user_pinned` (`user_id`,`is_pinned`,`pinned_at`),
  KEY `idx_task_time_order` (`list_id`,`deadline`,`time_order_index`),
  KEY `idx_task_group_order` (`list_id`,`group_id`,`group_order_index`),
  KEY `idx_task_pinned` (`list_id`,`is_pinned` DESC,`updated_at` DESC),
  KEY `idx_task_user_id` (`user_id`),
  KEY `idx_task_list_id` (`list_id`),
  KEY `idx_task_group_id` (`group_id`),
  CONSTRAINT `task_ibfk_1` FOREIGN KEY (`list_id`) REFERENCES `todo_list` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `task_group` (`id`) ON DELETE SET NULL,
  CONSTRAINT `task_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task`
--

LOCK TABLES `task` WRITE;
/*!40000 ALTER TABLE `task` DISABLE KEYS */;
INSERT INTO `task` VALUES ('task-001','学习 React','学习React框架的基础知识和高级特性，包括组件、状态管理等内容',0,2,NULL,'2025-09-18',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',0,0,NULL),('task-002','Sub 学习 React1','React组件基础学习，包括函数组件和类组件的使用方法',0,2,NULL,'2025-09-20',NULL,0,'task-001',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',1,1,NULL),('task-003','Sub 学习 React2','React状态管理学习，包括useState、useEffect等Hooks的使用',0,2,NULL,'2025-09-17',NULL,0,'task-001',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',2,2,NULL),('task-004','Sub 学习 React3','React路由配置和嵌套路由的使用方法',0,2,NULL,'2025-09-17',NULL,0,'task-001',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',3,3,NULL),('task-005','刷完《React 进阶实战》视频课','完成React进阶实战课程的全部章节学习',0,2,NULL,'2025-09-16',NULL,0,NULL,0,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',0,0,NULL),('task-006','整理个人知识库','将学习的知识系统化整理，形成个人知识体系',0,1,NULL,'2025-09-21',NULL,0,NULL,0,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',1,1,NULL),('task-007','学习 TypeScript 高级特性','学习TypeScript的泛型、类型保护、装饰器等高级特性',0,3,NULL,'2025-09-19',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',4,4,NULL),('task-008','完成需求评审','参与产品需求评审会议并提出技术实现方案',1,1,NULL,'2025-09-14',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',NULL,0,NULL),('task-009','编写API文档','为项目中的所有API接口编写详细的文档说明',0,2,NULL,'2025-09-16',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',0,0,NULL),('task-010','准备周会材料','整理本周工作进度和下周工作计划',0,1,NULL,'2025-09-15',NULL,0,NULL,0,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',0,0,NULL),('task-011','代码审查','审查团队成员提交的代码，确保代码质量',0,2,NULL,'2025-09-15',NULL,0,NULL,0,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',1,1,NULL),('task-012','团队培训会议','组织团队成员进行技术培训和知识分享',0,1,NULL,'2025-09-16',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',1,1,NULL),('task-013','购买生日礼物','为朋友挑选合适的生日礼物并包装',1,1,NULL,'2025-09-13',NULL,0,NULL,0,'todolist-003','group-005','user-002',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',NULL,0,NULL),('task-014','打扫房间','打扫卧室和书房的卫生，保持整洁',0,2,NULL,'2025-09-17',NULL,0,NULL,0,'todolist-003','group-005','user-002',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',0,0,NULL),('task-015','读完《代码整洁之道》','阅读罗伯特·C·马丁的代码整洁之道，学习代码规范',0,3,NULL,'2025-09-22',NULL,0,NULL,0,'todolist-004','group-006','user-002',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',0,0,NULL),('task-016','做读书笔记','整理《代码整洁之道》的读书笔记和心得体会',0,2,NULL,'2025-09-21',NULL,0,'task-015',1,'todolist-004','group-006','user-002',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',1,1,NULL),('task-017','计划下本月阅读书单','规划下个月的阅读内容和书单',0,1,NULL,'2025-09-23',NULL,0,NULL,0,'todolist-004','group-006','user-002',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',2,2,NULL),('task-018','跑步5公里','在公园或跑步机上完成5公里跑步锻炼',0,2,NULL,'2025-09-12',NULL,0,NULL,0,'todolist-005','group-007','user-003',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',0,0,NULL),('task-019','健身训练','进行上肢和核心力量训练，每组12-15次',0,3,NULL,'2025-09-13',NULL,0,NULL,0,'todolist-005','group-007','user-003',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',1,1,NULL),('task-020','预订机票','查询并预订前往目的地的往返机票',0,2,NULL,'2025-09-10',NULL,0,NULL,0,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',0,0,NULL),('task-021','预订酒店','在目的地预订合适的酒店住宿',0,2,NULL,'2025-09-11',NULL,0,NULL,0,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',1,1,NULL),('task-022','制定行程计划','详细规划旅行期间的每日行程和景点安排',0,1,NULL,'2025-09-14',NULL,0,NULL,0,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',2,2,NULL),('task-045','家庭大扫除','进行全屋深度清洁，包括厨房、卫生间等',0,2,NULL,'2025-09-19',NULL,0,NULL,0,'todolist-003','group-005','user-002',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',1,1,NULL),('task-046','打扫客厅','清洁客厅的地面、沙发和家具表面',0,2,NULL,'2025-09-19',NULL,0,'task-045',1,'todolist-003','group-005','user-002',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',2,2,NULL),('task-047','扫地','使用吸尘器清洁客厅地面',0,1,NULL,'2025-09-19',NULL,0,'task-046',2,'todolist-003','group-005','user-002',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',3,3,NULL),('task-048','拖地','使用拖把清洁客厅地面，保持干燥',0,1,NULL,'2025-09-19',NULL,0,'task-046',2,'todolist-003','group-005','user-002',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',4,4,NULL),('task-100','学习 Vue.js 基础','学习Vue.js框架的基础知识，包括响应式系统和组件开发',0,2,NULL,'2025-09-15',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',5,5,NULL),('task-101','学习 Node.js','学习Node.js的基本概念和Express框架的使用',0,3,NULL,'2025-09-18',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',6,6,NULL),('task-102','Sub 安装 Vue CLI','使用npm安装Vue CLI并创建新项目',0,2,NULL,'2025-09-20',NULL,0,'task-100',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',7,7,NULL),('task-103','Sub 创建第一个 Vue 项目','使用Vue CLI创建第一个Vue.js项目并了解项目结构',0,2,NULL,'2025-09-16',NULL,0,'task-100',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',8,8,NULL),('task-104','学习 Docker','学习Docker容器技术的基本概念和使用方法',0,3,NULL,'2025-09-17',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',9,9,NULL),('task-105','Sub 学习 Git 分支管理','学习Git分支的创建、合并和管理',0,1,NULL,'2025-09-14',NULL,0,'task-104',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',10,10,NULL),('task-106','Sub 学习 Git 工作流','了解Git Flow和GitHub Flow等工作流程',0,2,NULL,'2025-09-19',NULL,0,'task-104',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',11,11,NULL),('task-107','Sub 配置 Webpack 开发环境','学习Webpack的基本配置和开发环境搭建',0,2,NULL,'2025-09-22',NULL,0,'task-101',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',12,12,NULL),('task-108','Sub 学习 CSS Grid 布局','学习CSS Grid布局系统的使用方法',0,1,NULL,'2025-09-13',NULL,0,'task-101',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',13,13,NULL),('task-109','学习 TypeScript 泛型','深入学习TypeScript泛型的使用场景和高级用法',0,3,NULL,'2025-09-21',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',14,14,NULL),('task-110','学习微服务架构','深入学习微服务架构的设计原则和实现方法',0,3,NULL,'2025-09-17',NULL,0,NULL,0,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',2,2,NULL),('task-111','学习算法与数据结构','复习和学习算法与数据结构的基础知识',0,2,NULL,'2025-09-18',NULL,0,NULL,0,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',3,3,NULL),('task-112','Sub 学习设计模式-创建型','学习工厂模式、单例模式等创建型设计模式',0,2,NULL,'2025-09-19',NULL,0,'task-111',1,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',4,4,NULL),('task-113','Sub 学习设计模式-结构型','学习适配器模式、装饰器模式等结构型设计模式',0,3,NULL,'2025-09-20',NULL,0,'task-111',1,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',5,5,NULL),('task-114','Sub 前端性能优化-资源加载','学习前端资源加载优化的方法和策略',0,2,NULL,'2025-09-15',NULL,0,'task-110',1,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',6,6,NULL),('task-115','Sub 前端性能优化-渲染优化','学习前端渲染性能优化的技术和方法',0,2,NULL,'2025-09-16',NULL,0,'task-110',1,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',7,7,NULL),('task-116','学习 RESTful API 设计','学习RESTful API的设计原则和最佳实践',0,1,NULL,'2025-09-14',NULL,0,NULL,0,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',8,8,NULL),('task-117','Sub 响应式设计-媒体查询','学习CSS媒体查询的使用方法和技巧',0,1,NULL,'2025-09-22',NULL,0,'task-116',1,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',9,9,NULL),('task-118','编写项目文档','编写项目的技术文档和使用说明',0,2,NULL,'2025-09-15',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',2,2,NULL),('task-119','优化数据库查询','优化项目中的数据库查询语句，提升性能',0,3,NULL,'2025-09-17',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',3,3,NULL),('task-120','Sub 修复登录页面bug','修复登录页面的表单验证和错误提示bug',0,3,NULL,'2025-09-16',NULL,0,'task-119',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',4,4,NULL),('task-121','Sub 修复数据保存bug','修复数据保存过程中的错误处理逻辑',0,2,NULL,'2025-09-18',NULL,0,'task-119',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',5,5,NULL),('task-122','Sub 准备技术分享PPT','为团队技术分享会议准备PPT演示文稿',0,1,NULL,'2025-09-20',NULL,0,'task-118',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',6,6,NULL),('task-123','Sub 准备技术分享内容','整理技术分享会议的具体内容和示例代码',0,2,NULL,'2025-09-19',NULL,0,'task-118',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',7,7,NULL),('task-124','性能测试','对项目进行性能测试并生成测试报告',0,2,NULL,'2025-09-21',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',8,8,NULL),('task-125','Sub 编写单元测试用例','为核心功能编写详细的单元测试用例',0,1,NULL,'2025-09-14',NULL,0,'task-124',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',9,9,NULL),('task-126','Sub 运行单元测试','执行单元测试并分析测试结果',0,2,NULL,'2025-09-13',NULL,0,'task-124',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',10,10,NULL),('task-127','配置CI/CD流程','配置持续集成和持续部署的自动化流程',0,3,NULL,'2025-09-22',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',11,11,NULL),('task-128','参加产品规划会议','参加产品规划会议并记录讨论要点',0,1,NULL,'2025-09-17',NULL,0,NULL,0,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',2,2,NULL),('task-129','评审UI设计稿','评审新功能的UI设计稿并提供反馈',0,2,NULL,'2025-09-18',NULL,0,NULL,0,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',3,3,NULL),('task-130','Sub 制定前端开发计划','制定前端功能开发的详细计划和时间表',0,2,NULL,'2025-09-16',NULL,0,'task-129',1,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',4,4,NULL),('task-131','Sub 制定后端开发计划','制定后端API开发的详细计划和时间表',0,1,NULL,'2025-09-19',NULL,0,'task-129',1,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',5,5,NULL),('task-132','Sub 编写用户故事-登录功能','编写登录功能的详细用户故事和验收标准',0,2,NULL,'2025-09-15',NULL,0,'task-128',1,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',6,6,NULL),('task-133','Sub 编写用户故事-数据展示','编写数据展示功能的详细用户故事和验收标准',0,2,NULL,'2025-09-20',NULL,0,'task-128',1,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',7,7,NULL),('task-134','安排团队任务','将开发任务分配给团队成员并设定截止日期',0,1,NULL,'2025-09-14',NULL,0,NULL,0,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',8,8,NULL),('task-135','Sub 准备项目进度周报','整理本周项目进度并准备周报文档',0,2,NULL,'2025-09-21',NULL,0,'task-134',1,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',9,9,NULL),('task-136','购买旅行保险','选择合适的旅行保险套餐并完成购买',0,2,NULL,'2025-09-15',NULL,0,NULL,0,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',3,3,NULL),('task-137','Sub 兑换美元','在银行或兑换点兑换旅行所需的美元现金',0,1,NULL,'2025-09-16',NULL,0,'task-136',1,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',4,4,NULL),('task-138','Sub 兑换当地货币','在银行或兑换点兑换旅行目的地的当地货币',0,1,NULL,'2025-09-17',NULL,0,'task-136',1,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',5,5,NULL),('task-139','Sub 研究历史景点','收集和研究旅行目的地的历史景点信息',0,1,NULL,'2025-09-18',NULL,0,'task-022',1,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',6,6,NULL),('task-140','Sub 研究自然景点','收集和研究旅行目的地的自然景点信息',0,2,NULL,'2025-09-19',NULL,0,'task-022',1,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',7,7,NULL),('task-141','查找当地餐厅','搜索并记录旅行目的地的推荐餐厅',0,1,NULL,'2025-09-20',NULL,0,NULL,0,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',8,8,NULL),('task-142','Sub 下载离线地图-市区','下载旅行目的地市区的离线地图',0,1,NULL,'2025-09-21',NULL,0,'task-141',1,'todolist-006','group-008','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',9,9,NULL),('task-143','完成日报','编写并提交每日工作进度报告',0,1,NULL,'2025-09-15',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',15,15,NULL),('task-144','健身锻炼','进行日常健身锻炼，保持身体健康',0,2,NULL,'2025-09-16',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',16,16,NULL),('task-145','Sub 阅读前端技术文章','阅读和学习最新的前端技术文章',0,1,NULL,'2025-09-17',NULL,0,'task-143',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',17,17,NULL),('task-146','Sub 阅读后端技术文章','阅读和学习最新的后端技术文章',0,1,NULL,'2025-09-18',NULL,0,'task-143',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',18,18,NULL),('task-147','Sub 备份项目代码','对项目代码进行定期备份',0,2,NULL,'2025-09-19',NULL,0,'task-144',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',19,19,NULL),('task-148','Sub 备份数据库','对项目数据库进行定期备份',0,2,NULL,'2025-09-20',NULL,0,'task-144',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',20,20,NULL),('task-149','回复重要邮件','回复积压的重要工作邮件',0,2,NULL,'2025-09-14',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',13,13,NULL),('task-150','更新个人简历','根据最新技能和项目经验更新个人简历',0,1,NULL,'2025-09-21',NULL,0,NULL,0,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',11,11,NULL),('task-151','Sub 准备学习笔记-React','整理React学习的笔记和重点',0,1,NULL,'2025-09-13',NULL,0,'task-150',1,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',12,12,NULL),('task-152','Sub 准备学习笔记-TypeScript','整理TypeScript学习的笔记和重点',0,2,NULL,'2025-09-22',NULL,0,'task-150',1,'todolist-001','group-002','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',13,13,NULL),('task-153','编写技术博客','编写一篇技术博客分享开发经验',0,3,NULL,'2025-09-16',NULL,0,NULL,0,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',11,11,NULL),('task-154','Sub 代码复审-前端部分','对前端代码进行详细的代码复审',0,2,NULL,'2025-09-17',NULL,0,'task-153',1,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',12,12,NULL),('task-155','Sub 代码复审-后端部分','对后端代码进行详细的代码复审',0,2,NULL,'2025-09-18',NULL,0,'task-153',1,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',13,13,NULL),('task-156','研究新技术','研究和学习项目可能用到的新技术',0,3,NULL,'2025-09-19',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',19,19,NULL),('task-157','Sub 准备会议材料-PPT','制作会议所需的PPT演示文稿',0,2,NULL,'2025-09-20',NULL,0,'task-156',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',21,21,NULL),('task-158','Sub 准备会议材料-文档','准备会议所需的详细文档资料',0,1,NULL,'2025-09-14',NULL,0,'task-156',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',22,22,NULL),('task-159','制定下周计划','制定下周的工作计划和学习计划',0,2,NULL,'2025-09-15',NULL,0,NULL,0,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',13,13,NULL),('task-160','Sub 总结工作进度-前端','总结前端部分的工作进度和问题',0,1,NULL,'2025-09-16',NULL,0,'task-159',1,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',14,14,NULL),('task-161','Sub 总结工作进度-后端','总结后端部分的工作进度和问题',0,1,NULL,'2025-09-17',NULL,0,'task-159',1,'todolist-002','group-004','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',15,15,NULL),('task-162','优化工作流程','分析并优化团队的工作流程',0,2,NULL,'2025-09-18',NULL,0,NULL,0,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',17,17,NULL),('task-163','Sub 学习产品知识-用户研究','学习用户研究的方法和技巧',0,1,NULL,'2025-09-19',NULL,0,'task-162',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',18,18,NULL),('task-164','Sub 学习产品知识-需求分析','学习需求分析的方法和技巧',0,1,NULL,'2025-09-20',NULL,0,'task-162',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',19,19,NULL),('task-165','更新技术栈','更新项目使用的技术栈到最新版本',0,3,NULL,'2025-09-14',NULL,0,NULL,0,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',20,20,NULL),('task-166','Sub 准备演示文稿-内容','准备技术分享演示文稿的具体内容',0,2,NULL,'2025-09-15',NULL,0,'task-165',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',23,23,NULL),('task-167','Sub 准备演示文稿-样式','美化技术分享演示文稿的样式设计',0,2,NULL,'2025-09-16',NULL,0,'task-165',1,'todolist-001','group-001','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',24,24,NULL),('task-168','Sub 分析用户反馈-正面','分析和总结用户的正面反馈',0,1,NULL,'2025-09-17',NULL,0,'task-164',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',20,20,NULL),('task-169','Sub 分析用户反馈-负面','分析和总结用户的负面反馈并提出改进方案',0,3,NULL,'2025-09-18',NULL,0,'task-164',1,'todolist-002','group-003','user-001',0,NULL,'2026-01-27 16:38:18','2026-01-27 16:38:18',21,21,NULL);
/*!40000 ALTER TABLE `task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_attachments`
--

DROP TABLE IF EXISTS `task_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL COMMENT '关联oss_files表的ID',
  `task_id` varchar(36) NOT NULL COMMENT '关联任务表的ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_file_id` (`file_id`),
  KEY `idx_task_attachments_created_at` (`created_at`),
  CONSTRAINT `task_attachments_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `oss_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='任务附件关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_attachments`
--

LOCK TABLES `task_attachments` WRITE;
/*!40000 ALTER TABLE `task_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_group`
--

DROP TABLE IF EXISTS `task_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_group` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `list_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_task_group_list_id` (`list_id`),
  CONSTRAINT `task_group_ibfk_1` FOREIGN KEY (`list_id`) REFERENCES `todo_list` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_group`
--

LOCK TABLES `task_group` WRITE;
/*!40000 ALTER TABLE `task_group` DISABLE KEYS */;
INSERT INTO `task_group` VALUES ('group-001','todolist-001','学习相关','user-001','2026-01-27 16:38:18','2026-01-27 16:38:18'),('group-002','todolist-001','相关','user-001','2026-01-27 16:38:18','2026-01-27 16:38:18'),('group-003','todolist-002','高优先级任务','user-001','2026-01-27 16:38:18','2026-01-27 16:38:18'),('group-004','todolist-002','日常任务','user-001','2026-01-27 16:38:18','2026-01-27 16:38:18'),('group-005','todolist-003','今日完成','user-002','2026-01-27 16:38:18','2026-01-27 16:38:18'),('group-006','todolist-004','本月阅读','user-002','2026-01-27 16:38:18','2026-01-27 16:38:18'),('group-007','todolist-005','每周锻炼','user-003','2026-01-27 16:38:18','2026-01-27 16:38:18'),('group-008','todolist-006','准备工作','user-001','2026-01-27 16:38:18','2026-01-27 16:38:18');
/*!40000 ALTER TABLE `task_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_tag`
--

DROP TABLE IF EXISTS `task_tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_task_tag` (`task_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `task_tag_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_tag_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `todo_tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_tag`
--

LOCK TABLES `task_tag` WRITE;
/*!40000 ALTER TABLE `task_tag` DISABLE KEYS */;
INSERT INTO `task_tag` VALUES (1,'task-001','tag-001','2026-01-27 16:38:18'),(2,'task-001','tag-002','2026-01-27 16:38:18'),(3,'task-001','tag-004','2026-01-27 16:38:18'),(4,'task-002','tag-001','2026-01-27 16:38:18'),(5,'task-002','tag-002','2026-01-27 16:38:18'),(6,'task-002','tag-003','2026-01-27 16:38:18'),(7,'task-003','tag-001','2026-01-27 16:38:18'),(8,'task-003','tag-002','2026-01-27 16:38:18'),(9,'task-004','tag-001','2026-01-27 16:38:18'),(10,'task-004','tag-002','2026-01-27 16:38:18'),(11,'task-005','tag-001','2026-01-27 16:38:18'),(12,'task-005','tag-003','2026-01-27 16:38:18'),(13,'task-005','tag-004','2026-01-27 16:38:18'),(14,'task-006','tag-001','2026-01-27 16:38:18'),(15,'task-007','tag-001','2026-01-27 16:38:18'),(16,'task-007','tag-002','2026-01-27 16:38:18'),(17,'task-007','tag-005','2026-01-27 16:38:18'),(18,'task-008','tag-006','2026-01-27 16:38:18'),(19,'task-008','tag-007','2026-01-27 16:38:18'),(20,'task-008','tag-008','2026-01-27 16:38:18'),(21,'task-009','tag-006','2026-01-27 16:38:18'),(22,'task-009','tag-009','2026-01-27 16:38:18'),(23,'task-010','tag-006','2026-01-27 16:38:18'),(24,'task-010','tag-007','2026-01-27 16:38:18'),(25,'task-010','tag-009','2026-01-27 16:38:18'),(26,'task-011','tag-006','2026-01-27 16:38:18'),(27,'task-011','tag-010','2026-01-27 16:38:18'),(28,'task-011','tag-011','2026-01-27 16:38:18'),(29,'task-012','tag-006','2026-01-27 16:38:18'),(30,'task-012','tag-007','2026-01-27 16:38:18'),(31,'task-012','tag-011','2026-01-27 16:38:18'),(32,'task-013','tag-012','2026-01-27 16:38:18'),(33,'task-013','tag-013','2026-01-27 16:38:18'),(34,'task-014','tag-012','2026-01-27 16:38:18'),(35,'task-014','tag-014','2026-01-27 16:38:18'),(36,'task-015','tag-015','2026-01-27 16:38:18'),(37,'task-015','tag-016','2026-01-27 16:38:18'),(38,'task-016','tag-015','2026-01-27 16:38:18'),(39,'task-017','tag-015','2026-01-27 16:38:18'),(40,'task-017','tag-016','2026-01-27 16:38:18'),(41,'task-018','tag-017','2026-01-27 16:38:18'),(42,'task-018','tag-018','2026-01-27 16:38:18'),(43,'task-019','tag-017','2026-01-27 16:38:18'),(44,'task-020','tag-019','2026-01-27 16:38:18'),(45,'task-020','tag-020','2026-01-27 16:38:18'),(46,'task-021','tag-019','2026-01-27 16:38:18'),(47,'task-021','tag-020','2026-01-27 16:38:18'),(48,'task-022','tag-019','2026-01-27 16:38:18'),(49,'task-022','tag-020','2026-01-27 16:38:18'),(50,'task-001','tag-005','2026-01-27 16:38:18'),(51,'task-003','tag-003','2026-01-27 16:38:18'),(52,'task-004','tag-003','2026-01-27 16:38:18'),(53,'task-004','tag-005','2026-01-27 16:38:18'),(54,'task-005','tag-002','2026-01-27 16:38:18'),(55,'task-005','tag-005','2026-01-27 16:38:18'),(56,'task-006','tag-004','2026-01-27 16:38:18'),(57,'task-008','tag-010','2026-01-27 16:38:18'),(58,'task-009','tag-010','2026-01-27 16:38:18'),(59,'task-009','tag-011','2026-01-27 16:38:18'),(60,'task-010','tag-010','2026-01-27 16:38:18'),(61,'task-011','tag-008','2026-01-27 16:38:18'),(62,'task-012','tag-008','2026-01-27 16:38:18'),(63,'task-012','tag-009','2026-01-27 16:38:18'),(64,'task-013','tag-014','2026-01-27 16:38:18'),(65,'task-014','tag-013','2026-01-27 16:38:18'),(66,'task-015','tag-001','2026-01-27 16:38:18'),(67,'task-016','tag-016','2026-01-27 16:38:18'),(68,'task-017','tag-001','2026-01-27 16:38:18'),(69,'task-018','tag-012','2026-01-27 16:38:18'),(70,'task-019','tag-012','2026-01-27 16:38:18'),(71,'task-019','tag-018','2026-01-27 16:38:18'),(72,'task-020','tag-006','2026-01-27 16:38:18'),(73,'task-021','tag-006','2026-01-27 16:38:18'),(74,'task-022','tag-009','2026-01-27 16:38:18');
/*!40000 ALTER TABLE `task_tag` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `todo_list`
--

DROP TABLE IF EXISTS `todo_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `todo_list` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emoji` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_todo_list_user_id` (`user_id`),
  CONSTRAINT `todo_list_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `todo_list`
--

LOCK TABLES `todo_list` WRITE;
/*!40000 ALTER TABLE `todo_list` DISABLE KEYS */;
INSERT INTO `todo_list` VALUES ('todolist-001','我的待办事项','📝','#1890ff','2025-09-16 12:00:00','2025-09-16 12:00:00','user-001'),('todolist-002','工作清单','💼','#52c41a','2025-09-16 12:05:00','2025-09-16 12:05:00','user-001'),('todolist-003','生活杂项','🏠','#faad14','2025-09-16 12:10:00','2025-09-16 12:10:00','user-002'),('todolist-004','读书计划','📚','#722ed1','2025-09-16 12:15:00','2025-09-16 12:15:00','user-002'),('todolist-005','健身目标','🏃','#f5222d','2025-09-16 12:20:00','2025-09-16 12:20:00','user-003'),('todolist-006','旅行计划','✈️','#13c2c2','2025-09-16 12:25:00','2025-09-16 12:25:00','user-001');
/*!40000 ALTER TABLE `todo_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `todo_tag`
--

DROP TABLE IF EXISTS `todo_tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `todo_tag` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '#1890ff',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_todo_tag_user_id` (`user_id`),
  KEY `idx_todo_tag_parent_id` (`parent_id`),
  CONSTRAINT `todo_tag_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `todo_tag_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `todo_tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `todo_tag`
--

LOCK TABLES `todo_tag` WRITE;
/*!40000 ALTER TABLE `todo_tag` DISABLE KEYS */;
INSERT INTO `todo_tag` VALUES ('tag-001','学习',NULL,'user-001','#1890ff','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-002','React','tag-001','user-001','#52c41a','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-003','视频课程','tag-001','user-001','#faad14','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-004','后端','tag-001','user-001','#722ed1','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-005','TypeScript','tag-002','user-001','#f5222d','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-006','工作',NULL,'user-001','#13c2c2','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-007','会议','tag-006','user-001','#eb2f96','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-008','项目管理','tag-006','user-001','#597ef7','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-009','计划','tag-006','user-001','#fa8c16','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-010','执行','tag-006','user-001','#a0d911','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-011','团队协作','tag-006','user-001','#fadb14','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-012','生活',NULL,'user-002','#1890ff','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-013','礼物','tag-012','user-002','#eb2f96','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-014','运动','tag-012','user-002','#f5222d','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-015','阅读',NULL,'user-002','#722ed1','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-016','技术书籍','tag-015','user-002','#13c2c2','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-017','健身',NULL,'user-003','#f5222d','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-018','跑步','tag-017','user-003','#13c2c2','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-019','旅行',NULL,'user-001','#faad14','2026-01-27 16:38:18','2026-01-27 16:38:18'),('tag-020','准备','tag-019','user-001','#52c41a','2026-01-27 16:38:18','2026-01-27 16:38:18');
/*!40000 ALTER TABLE `todo_tag` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci COMMENT '个人简介',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `nickname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('user-001','admin','admin@example.com','$2b$10$WO8UGAY7UFUGCRXPgTelGuWFsCTn3ujBNOWhnzmytcCmYCUqyyHku','https://todo-avatar.oss-cn-beijing.aliyuncs.com/avatars/user-001/1758975597327.jpg','我是系统管理员，负责维护和管理系统','2026-01-27 16:38:18','2026-01-27 16:38:18',NULL),('user-002','testuser','test@example.com','$2b$10$WO8UGAY7UFUGCRXPgTelGuWFsCTn3ujBNOWhnzmytcCmYCUqyyHku','https://api.dicebear.com/7.x/avataaars/svg?seed=testuser','测试用户，用于系统功能测试','2026-01-27 16:38:18','2026-01-27 16:38:18',NULL),('user-003','demo','demo@example.com','$2b$10$WO8UGAY7UFUGCRXPgTelGuWFsCTn3ujBNOWhnzmytcCmYCUqyyHku','https://api.dicebear.com/7.x/avataaars/svg?seed=demo','演示用户，展示系统功能','2026-01-27 16:38:18','2026-01-27 16:38:18',NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_avatars`
--

DROP TABLE IF EXISTS `user_avatars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_avatars` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL COMMENT '关联oss_files表的ID',
  `user_id` varchar(36) NOT NULL COMMENT '关联用户表的ID',
  `is_default` tinyint(1) DEFAULT '0' COMMENT '是否为默认头像',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_file_id` (`file_id`),
  KEY `idx_user_default` (`user_id`,`is_default`) COMMENT '每个用户只能有一个默认头像',
  KEY `idx_user_avatars_created_at` (`created_at`),
  CONSTRAINT `user_avatars_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `oss_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户头像关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_avatars`
--

LOCK TABLES `user_avatars` WRITE;
/*!40000 ALTER TABLE `user_avatars` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_avatars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'todo_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-27 17:34:28
