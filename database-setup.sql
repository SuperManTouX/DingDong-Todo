-- 数据库创建脚本
-- 1. 创建数据库（如果需要）
CREATE DATABASE IF NOT EXISTS todo_db;
USE todo_db;

-- 删除表（按照依赖关系顺序删除）
DROP TABLE IF EXISTS focus_record CASCADE;
DROP TABLE IF EXISTS task_tag CASCADE;
DROP TABLE IF EXISTS bin CASCADE;
DROP TABLE IF EXISTS task CASCADE;
DROP TABLE IF EXISTS todo_tag CASCADE;
DROP TABLE IF EXISTS task_group CASCADE;
DROP TABLE IF EXISTS todo_list CASCADE;
DROP TABLE IF EXISTS user CASCADE;

-- 2. 创建用户表
CREATE TABLE IF NOT EXISTS user (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) NULL,
  bio TEXT NULL COMMENT '个人简介',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 创建待办事项列表表
CREATE TABLE IF NOT EXISTS todo_list (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  emoji VARCHAR(10) NULL,
  color VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 创建任务分组表
CREATE TABLE IF NOT EXISTS task_group (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  list_id VARCHAR(36) NOT NULL,
  group_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (list_id) REFERENCES todo_list(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 创建标签表
CREATE TABLE IF NOT EXISTS todo_tag (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id VARCHAR(36) NULL,
  user_id VARCHAR(36) NOT NULL,
  color VARCHAR(255) NULL DEFAULT '#1890ff',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES todo_tag(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 创建任务表
CREATE TABLE IF NOT EXISTS task (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  text TEXT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority INT NOT NULL DEFAULT 0,
  datetime_local VARCHAR(50) NULL COMMENT 'ISO 8601格式的日期时间',
  deadline VARCHAR(50) NULL COMMENT 'ISO 8601格式的截止日期',
  reminder_at VARCHAR(50) NULL COMMENT 'ISO 8601格式的提醒时间',
  is_reminded BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已发送提醒',
  parent_id VARCHAR(36) NULL,
  depth INT NOT NULL DEFAULT 0,
  list_id VARCHAR(36) NOT NULL,
  group_id VARCHAR(36) NULL,
  user_id VARCHAR(36) NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  pinned_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  time_order_index INT DEFAULT 0,   -- 时间分组内排序索引
  group_order_index INT DEFAULT 0,  -- 分组内排序索引
  FOREIGN KEY (list_id) REFERENCES todo_list(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES task_group(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES task(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加索引以优化置顶任务的查询性能
CREATE INDEX idx_task_is_pinned ON task(is_pinned);
CREATE INDEX idx_task_pinned_at ON task(pinned_at);
CREATE INDEX idx_task_user_pinned ON task(user_id, is_pinned, pinned_at);

-- 为排序相关字段创建索引
CREATE INDEX idx_task_time_order ON task(list_id, deadline, time_order_index);
CREATE INDEX idx_task_group_order ON task(list_id, group_id, group_order_index);
CREATE INDEX idx_task_pinned ON task(list_id, is_pinned DESC, updated_at DESC);

-- 7. 创建任务标签关联表
CREATE TABLE IF NOT EXISTS task_tag (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  tag_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES todo_tag(id) ON DELETE CASCADE,
  UNIQUE KEY unique_task_tag (task_id, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 创建回收站表（bin表）用于存储已删除的任务
CREATE TABLE IF NOT EXISTS bin (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  text TEXT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority INT NOT NULL DEFAULT 0,
  datetime_local VARCHAR(50) NULL COMMENT 'ISO 8601格式的日期时间',
  deadline VARCHAR(50) NULL COMMENT 'ISO 8601格式的截止日期',
  reminder_at VARCHAR(50) NULL COMMENT 'ISO 8601格式的提醒时间',
  is_reminded BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已发送提醒',
  parent_id VARCHAR(36) NULL,
  depth INT NOT NULL DEFAULT 0,
  list_id VARCHAR(36) NOT NULL,
  group_id VARCHAR(36) NULL,
  user_id VARCHAR(36) NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  pinned_at DATETIME NULL,
	time_order_index INT DEFAULT 0,
	group_order_index INT DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 插入用户数据 (标准化ID格式: user-xxx)
INSERT INTO user (id, username, email, password, avatar, bio, created_at, updated_at)
VALUES
  ('user-001', 'admin', 'admin@example.com', '$2b$10$3JvWUaWw1lWGwPKcdk2BDOl.rgXfJEhnQoksmRrdo735ONVJfXSSm', 'https://todo-avatar.oss-cn-beijing.aliyuncs.com/avatars/user-001/1758975597327.jpg', '我是系统管理员，负责维护和管理系统', NOW(), NOW()),
  ('user-002', 'testuser', 'test@example.com', '$2b$10$Gz7v8n9m0P1q2r3s4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J', 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser', '测试用户，用于系统功能测试', NOW(), NOW()),
  ('user-003', 'demo', 'demo@example.com', '$2b$10$H1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9A0B1C2D3E4F', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', '演示用户，展示系统功能', NOW(), NOW());

-- 9. 插入待办事项列表数据 (标准化ID格式: todolist-xxx)
INSERT INTO todo_list (id, title, emoji, color, created_at, updated_at, user_id)
VALUES
  ('todolist-001', '我的待办事项', '📝', '#1890ff', '2025-09-16 12:00:00', '2025-09-16 12:00:00', 'user-001'),
  ('todolist-002', '工作清单', '💼', '#52c41a', '2025-09-16 12:05:00', '2025-09-16 12:05:00', 'user-001'),
  ('todolist-003', '生活杂项', '🏠', '#faad14', '2025-09-16 12:10:00', '2025-09-16 12:10:00', 'user-002'),
  ('todolist-004', '读书计划', '📚', '#722ed1', '2025-09-16 12:15:00', '2025-09-16 12:15:00', 'user-002'),
  ('todolist-005', '健身目标', '🏃', '#f5222d', '2025-09-16 12:20:00', '2025-09-16 12:20:00', 'user-003'),
  ('todolist-006', '旅行计划', '✈️', '#13c2c2', '2025-09-16 12:25:00', '2025-09-16 12:25:00', 'user-001');

-- 10. 插入任务分组数据 (标准化ID格式: group-xxx)
INSERT INTO task_group (id, list_id, group_name, user_id, created_at, updated_at)
VALUES
  ('group-001', 'todolist-001', '学习相关', 'user-001', NOW(), NOW()),
  ('group-002', 'todolist-001', '相关', 'user-001', NOW(), NOW()),
  ('group-003', 'todolist-002', '高优先级任务', 'user-001', NOW(), NOW()),
  ('group-004', 'todolist-002', '日常任务', 'user-001', NOW(), NOW()),
  ('group-005', 'todolist-003', '今日完成', 'user-002', NOW(), NOW()),
  ('group-006', 'todolist-004', '本月阅读', 'user-002', NOW(), NOW()),
  ('group-007', 'todolist-005', '每周锻炼', 'user-003', NOW(), NOW()),
  ('group-008', 'todolist-006', '准备工作', 'user-001', NOW(), NOW());

-- 11. 插入标签数据 (标准化ID格式: tag-xxx)
INSERT INTO todo_tag (id, name, parent_id, user_id, color, created_at, updated_at)
VALUES
  ('tag-001', '学习', NULL, 'user-001', '#1890ff', NOW(), NOW()),
  ('tag-002', 'React', 'tag-001', 'user-001', '#52c41a', NOW(), NOW()),
  ('tag-003', '视频课程', 'tag-001', 'user-001', '#faad14', NOW(), NOW()),
  ('tag-004', '后端', 'tag-001', 'user-001', '#722ed1', NOW(), NOW()),
  ('tag-005', 'TypeScript', 'tag-002', 'user-001', '#f5222d', NOW(), NOW()),
  ('tag-006', '工作', NULL, 'user-001', '#13c2c2', NOW(), NOW()),
  ('tag-007', '会议', 'tag-006', 'user-001', '#eb2f96', NOW(), NOW()),
  ('tag-008', '项目管理', 'tag-006', 'user-001', '#597ef7', NOW(), NOW()),
  ('tag-009', '计划', 'tag-006', 'user-001', '#fa8c16', NOW(), NOW()),
  ('tag-010', '执行', 'tag-006', 'user-001', '#a0d911', NOW(), NOW()),
  ('tag-011', '团队协作', 'tag-006', 'user-001', '#fadb14', NOW(), NOW()),
  ('tag-012', '生活', NULL, 'user-002', '#1890ff', NOW(), NOW()),
  ('tag-013', '礼物', 'tag-012', 'user-002', '#eb2f96', NOW(), NOW()),
  ('tag-014', '运动', 'tag-012', 'user-002', '#f5222d', NOW(), NOW()),
  ('tag-015', '阅读', NULL, 'user-002', '#722ed1', NOW(), NOW()),
  ('tag-016', '技术书籍', 'tag-015', 'user-002', '#13c2c2', NOW(), NOW()),
  ('tag-017', '健身', NULL, 'user-003', '#f5222d', NOW(), NOW()),
  ('tag-018', '跑步', 'tag-017', 'user-003', '#13c2c2', NOW(), NOW()),
  ('tag-019', '旅行', NULL, 'user-001', '#faad14', NOW(), NOW()),
  ('tag-020', '准备', 'tag-019', 'user-001', '#52c41a', NOW(), NOW());



-- 12. 插入任务数据 (标准化ID格式: task-xxx)
-- 已完成的 INSERT 语句（仅展示核心字段，其余字段与之前保持一致）
INSERT INTO task (id, title, text, completed, priority, deadline, user_id, group_id, list_id, depth, parent_id, group_order_index, time_order_index, created_at, updated_at)
VALUES
-- ========== 用户 1 ==========
-- group-001 学习相关 未完成
('task-001','学习 React','学习React框架的基础知识和高级特性，包括组件、状态管理等内容',0,2,'2025-09-18','user-001','group-001','todolist-001',0,NULL,0,0,NOW(),NOW()),
('task-002','Sub 学习 React1','React组件基础学习，包括函数组件和类组件的使用方法',0,2,'2025-09-20','user-001','group-001','todolist-001',1,'task-001',1,1,NOW(),NOW()),
('task-003','Sub 学习 React2','React状态管理学习，包括useState、useEffect等Hooks的使用',0,2,'2025-09-17','user-001','group-001','todolist-001',1,'task-001',2,2,NOW(),NOW()),
('task-004','Sub 学习 React3','React路由配置和嵌套路由的使用方法',0,2,'2025-09-17','user-001','group-001','todolist-001',1,'task-001',3,3,NOW(),NOW()),
('task-007','学习 TypeScript 高级特性','学习TypeScript的泛型、类型保护、装饰器等高级特性',0,3,'2025-09-19','user-001','group-001','todolist-001',0,NULL,4,4,NOW(),NOW()),

-- group-002 学习相关 未完成
('task-005','刷完《React 进阶实战》视频课','完成React进阶实战课程的全部章节学习',0,2,'2025-09-16','user-001','group-002','todolist-001',0,NULL,0,0,NOW(),NOW()),
('task-006','整理个人知识库','将学习的知识系统化整理，形成个人知识体系',0,1,'2025-09-21','user-001','group-002','todolist-001',0,NULL,1,1,NOW(),NOW()),

-- group-003 工作相关 未完成
('task-009','编写API文档','为项目中的所有API接口编写详细的文档说明',0,2,'2025-09-16','user-001','group-003','todolist-002',0,NULL,0,0,NOW(),NOW()),
('task-012','团队培训会议','组织团队成员进行技术培训和知识分享',0,1,'2025-09-16','user-001','group-003','todolist-002',0,NULL,1,1,NOW(),NOW()),

-- group-003 工作相关 已完成
('task-008','完成需求评审','参与产品需求评审会议并提出技术实现方案',1,1,'2025-09-14','user-001','group-003','todolist-002',0,NULL,0,NULL,NOW(),NOW()),

-- group-004 工作相关 未完成
('task-010','准备周会材料','整理本周工作进度和下周工作计划',0,1,'2025-09-15','user-001','group-004','todolist-002',0,NULL,0,0,NOW(),NOW()),
('task-011','代码审查','审查团队成员提交的代码，确保代码质量',0,2,'2025-09-15','user-001','group-004','todolist-002',0,NULL,1,1,NOW(),NOW()),

-- ========== 用户 2 ==========
-- group-005 生活 未完成
('task-014','打扫房间','打扫卧室和书房的卫生，保持整洁',0,2,'2025-09-17','user-002','group-005','todolist-003',0,NULL,0,0,NOW(),NOW()),
('task-045','家庭大扫除','进行全屋深度清洁，包括厨房、卫生间等',0,2,'2025-09-19','user-002','group-005','todolist-003',0,NULL,1,1,NOW(),NOW()),
('task-046','打扫客厅','清洁客厅的地面、沙发和家具表面',0,2,'2025-09-19','user-002','group-005','todolist-003',1,'task-045',2,2,NOW(),NOW()),
('task-047','扫地','使用吸尘器清洁客厅地面',0,1,'2025-09-19','user-002','group-005','todolist-003',2,'task-046',3,3,NOW(),NOW()),
('task-048','拖地','使用拖把清洁客厅地面，保持干燥',0,1,'2025-09-19','user-002','group-005','todolist-003',2,'task-046',4,4,NOW(),NOW()),

-- group-005 生活 已完成
('task-013','购买生日礼物','为朋友挑选合适的生日礼物并包装',1,1,'2025-09-13','user-002','group-005','todolist-003',0,NULL,0,NULL,NOW(),NOW()),

-- group-006 阅读 未完成
('task-015','读完《代码整洁之道》','阅读罗伯特·C·马丁的代码整洁之道，学习代码规范',0,3,'2025-09-22','user-002','group-006','todolist-004',0,NULL,0,0,NOW(),NOW()),
('task-016','做读书笔记','整理《代码整洁之道》的读书笔记和心得体会',0,2,'2025-09-21','user-002','group-006','todolist-004',1,'task-015',1,1,NOW(),NOW()),
('task-017','计划下本月阅读书单','规划下个月的阅读内容和书单',0,1,'2025-09-23','user-002','group-006','todolist-004',0,NULL,2,2,NOW(),NOW()),

-- ========== 用户 3 ==========
-- group-007 运动 未完成
('task-018','跑步5公里','在公园或跑步机上完成5公里跑步锻炼',0,2,'2025-09-12','user-003','group-007','todolist-005',0,NULL,0,0,NOW(),NOW()),
('task-019','健身训练','进行上肢和核心力量训练，每组12-15次',0,3,'2025-09-13','user-003','group-007','todolist-005',0,NULL,1,1,NOW(),NOW()),

-- ========== 用户 1 旅行 ==========
-- group-008 旅行 未完成
('task-020','预订机票','查询并预订前往目的地的往返机票',0,2,'2025-09-10','user-001','group-008','todolist-006',0,NULL,0,0,NOW(),NOW()),
('task-021','预订酒店','在目的地预订合适的酒店住宿',0,2,'2025-09-11','user-001','group-008','todolist-006',0,NULL,1,1,NOW(),NOW()),
('task-022','制定行程计划','详细规划旅行期间的每日行程和景点安排',0,1,'2025-09-14','user-001','group-008','todolist-006',0,NULL,2,2,NOW(),NOW()),

-- ========== 用户 1 新增任务 (60条，约一半有层级) ==========
-- group-001 学习相关 新增任务（部分有层级）
('task-100','学习 Vue.js 基础','学习Vue.js框架的基础知识，包括响应式系统和组件开发',0,2,'2025-09-15','user-001','group-001','todolist-001',0,NULL,5,5,NOW(),NOW()),
('task-101','学习 Node.js','学习Node.js的基本概念和Express框架的使用',0,3,'2025-09-18','user-001','group-001','todolist-001',0,NULL,6,6,NOW(),NOW()),
('task-102','Sub 安装 Vue CLI','使用npm安装Vue CLI并创建新项目',0,2,'2025-09-20','user-001','group-001','todolist-001',1,'task-100',7,7,NOW(),NOW()),
('task-103','Sub 创建第一个 Vue 项目','使用Vue CLI创建第一个Vue.js项目并了解项目结构',0,2,'2025-09-16','user-001','group-001','todolist-001',1,'task-100',8,8,NOW(),NOW()),
('task-104','学习 Docker','学习Docker容器技术的基本概念和使用方法',0,3,'2025-09-17','user-001','group-001','todolist-001',0,NULL,9,9,NOW(),NOW()),
('task-105','Sub 学习 Git 分支管理','学习Git分支的创建、合并和管理',0,1,'2025-09-14','user-001','group-001','todolist-001',1,'task-104',10,10,NOW(),NOW()),
('task-106','Sub 学习 Git 工作流','了解Git Flow和GitHub Flow等工作流程',0,2,'2025-09-19','user-001','group-001','todolist-001',1,'task-104',11,11,NOW(),NOW()),
('task-107','Sub 配置 Webpack 开发环境','学习Webpack的基本配置和开发环境搭建',0,2,'2025-09-22','user-001','group-001','todolist-001',1,'task-101',12,12,NOW(),NOW()),
('task-108','Sub 学习 CSS Grid 布局','学习CSS Grid布局系统的使用方法',0,1,'2025-09-13','user-001','group-001','todolist-001',1,'task-101',13,13,NOW(),NOW()),
('task-109','学习 TypeScript 泛型','深入学习TypeScript泛型的使用场景和高级用法',0,3,'2025-09-21','user-001','group-001','todolist-001',0,NULL,14,14,NOW(),NOW()),

-- group-002 学习相关 新增任务（部分有层级）
('task-110','学习微服务架构','深入学习微服务架构的设计原则和实现方法',0,3,'2025-09-17','user-001','group-002','todolist-001',0,NULL,2,2,NOW(),NOW()),
('task-111','学习算法与数据结构','复习和学习算法与数据结构的基础知识',0,2,'2025-09-18','user-001','group-002','todolist-001',0,NULL,3,3,NOW(),NOW()),
('task-112','Sub 学习设计模式-创建型','学习工厂模式、单例模式等创建型设计模式',0,2,'2025-09-19','user-001','group-002','todolist-001',1,'task-111',4,4,NOW(),NOW()),
('task-113','Sub 学习设计模式-结构型','学习适配器模式、装饰器模式等结构型设计模式',0,3,'2025-09-20','user-001','group-002','todolist-001',1,'task-111',5,5,NOW(),NOW()),
('task-114','Sub 前端性能优化-资源加载','学习前端资源加载优化的方法和策略',0,2,'2025-09-15','user-001','group-002','todolist-001',1,'task-110',6,6,NOW(),NOW()),
('task-115','Sub 前端性能优化-渲染优化','学习前端渲染性能优化的技术和方法',0,2,'2025-09-16','user-001','group-002','todolist-001',1,'task-110',7,7,NOW(),NOW()),
('task-116','学习 RESTful API 设计','学习RESTful API的设计原则和最佳实践',0,1,'2025-09-14','user-001','group-002','todolist-001',0,NULL,8,8,NOW(),NOW()),
('task-117','Sub 响应式设计-媒体查询','学习CSS媒体查询的使用方法和技巧',0,1,'2025-09-22','user-001','group-002','todolist-001',1,'task-116',9,9,NOW(),NOW()),

-- group-003 工作相关 新增任务（部分有层级）
('task-118','编写项目文档','编写项目的技术文档和使用说明',0,2,'2025-09-15','user-001','group-003','todolist-002',0,NULL,2,2,NOW(),NOW()),
('task-119','优化数据库查询','优化项目中的数据库查询语句，提升性能',0,3,'2025-09-17','user-001','group-003','todolist-002',0,NULL,3,3,NOW(),NOW()),
('task-120','Sub 修复登录页面bug','修复登录页面的表单验证和错误提示bug',0,3,'2025-09-16','user-001','group-003','todolist-002',1,'task-119',4,4,NOW(),NOW()),
('task-121','Sub 修复数据保存bug','修复数据保存过程中的错误处理逻辑',0,2,'2025-09-18','user-001','group-003','todolist-002',1,'task-119',5,5,NOW(),NOW()),
('task-122','Sub 准备技术分享PPT','为团队技术分享会议准备PPT演示文稿',0,1,'2025-09-20','user-001','group-003','todolist-002',1,'task-118',6,6,NOW(),NOW()),
('task-123','Sub 准备技术分享内容','整理技术分享会议的具体内容和示例代码',0,2,'2025-09-19','user-001','group-003','todolist-002',1,'task-118',7,7,NOW(),NOW()),
('task-124','性能测试','对项目进行性能测试并生成测试报告',0,2,'2025-09-21','user-001','group-003','todolist-002',0,NULL,8,8,NOW(),NOW()),
('task-125','Sub 编写单元测试用例','为核心功能编写详细的单元测试用例',0,1,'2025-09-14','user-001','group-003','todolist-002',1,'task-124',9,9,NOW(),NOW()),
('task-126','Sub 运行单元测试','执行单元测试并分析测试结果',0,2,'2025-09-13','user-001','group-003','todolist-002',1,'task-124',10,10,NOW(),NOW()),
('task-127','配置CI/CD流程','配置持续集成和持续部署的自动化流程',0,3,'2025-09-22','user-001','group-003','todolist-002',0,NULL,11,11,NOW(),NOW()),

-- group-004 工作相关 新增任务（部分有层级）
('task-128','参加产品规划会议','参加产品规划会议并记录讨论要点',0,1,'2025-09-17','user-001','group-004','todolist-002',0,NULL,2,2,NOW(),NOW()),
('task-129','评审UI设计稿','评审新功能的UI设计稿并提供反馈',0,2,'2025-09-18','user-001','group-004','todolist-002',0,NULL,3,3,NOW(),NOW()),
('task-130','Sub 制定前端开发计划','制定前端功能开发的详细计划和时间表',0,2,'2025-09-16','user-001','group-004','todolist-002',1,'task-129',4,4,NOW(),NOW()),
('task-131','Sub 制定后端开发计划','制定后端API开发的详细计划和时间表',0,1,'2025-09-19','user-001','group-004','todolist-002',1,'task-129',5,5,NOW(),NOW()),
('task-132','Sub 编写用户故事-登录功能','编写登录功能的详细用户故事和验收标准',0,2,'2025-09-15','user-001','group-004','todolist-002',1,'task-128',6,6,NOW(),NOW()),
('task-133','Sub 编写用户故事-数据展示','编写数据展示功能的详细用户故事和验收标准',0,2,'2025-09-20','user-001','group-004','todolist-002',1,'task-128',7,7,NOW(),NOW()),
('task-134','安排团队任务','将开发任务分配给团队成员并设定截止日期',0,1,'2025-09-14','user-001','group-004','todolist-002',0,NULL,8,8,NOW(),NOW()),
('task-135','Sub 准备项目进度周报','整理本周项目进度并准备周报文档',0,2,'2025-09-21','user-001','group-004','todolist-002',1,'task-134',9,9,NOW(),NOW()),

-- group-008 旅行相关 新增任务（部分有层级）
('task-136','购买旅行保险','选择合适的旅行保险套餐并完成购买',0,2,'2025-09-15','user-001','group-008','todolist-006',0,NULL,3,3,NOW(),NOW()),
('task-137','Sub 兑换美元','在银行或兑换点兑换旅行所需的美元现金',0,1,'2025-09-16','user-001','group-008','todolist-006',1,'task-136',4,4,NOW(),NOW()),
('task-138','Sub 兑换当地货币','在银行或兑换点兑换旅行目的地的当地货币',0,1,'2025-09-17','user-001','group-008','todolist-006',1,'task-136',5,5,NOW(),NOW()),
('task-139','Sub 研究历史景点','收集和研究旅行目的地的历史景点信息',0,1,'2025-09-18','user-001','group-008','todolist-006',1,'task-022',6,6,NOW(),NOW()),
('task-140','Sub 研究自然景点','收集和研究旅行目的地的自然景点信息',0,2,'2025-09-19','user-001','group-008','todolist-006',1,'task-022',7,7,NOW(),NOW()),
('task-141','查找当地餐厅','搜索并记录旅行目的地的推荐餐厅',0,1,'2025-09-20','user-001','group-008','todolist-006',0,NULL,8,8,NOW(),NOW()),
('task-142','Sub 下载离线地图-市区','下载旅行目的地市区的离线地图',0,1,'2025-09-21','user-001','group-008','todolist-006',1,'task-141',9,9,NOW(),NOW()),

-- 新增日常任务组任务（部分有层级）
('task-143','完成日报','编写并提交每日工作进度报告',0,1,'2025-09-15','user-001','group-001','todolist-001',0,NULL,15,15,NOW(),NOW()),
('task-144','健身锻炼','进行日常健身锻炼，保持身体健康',0,2,'2025-09-16','user-001','group-001','todolist-001',0,NULL,16,16,NOW(),NOW()),
('task-145','Sub 阅读前端技术文章','阅读和学习最新的前端技术文章',0,1,'2025-09-17','user-001','group-001','todolist-001',1,'task-143',17,17,NOW(),NOW()),
('task-146','Sub 阅读后端技术文章','阅读和学习最新的后端技术文章',0,1,'2025-09-18','user-001','group-001','todolist-001',1,'task-143',18,18,NOW(),NOW()),
('task-147','Sub 备份项目代码','对项目代码进行定期备份',0,2,'2025-09-19','user-001','group-001','todolist-001',1,'task-144',19,19,NOW(),NOW()),
('task-148','Sub 备份数据库','对项目数据库进行定期备份',0,2,'2025-09-20','user-001','group-001','todolist-001',1,'task-144',20,20,NOW(),NOW()),
('task-149','回复重要邮件','回复积压的重要工作邮件',0,2,'2025-09-14','user-001','group-003','todolist-002',0,NULL,13,13,NOW(),NOW()),
('task-150','更新个人简历','根据最新技能和项目经验更新个人简历',0,1,'2025-09-21','user-001','group-002','todolist-001',0,NULL,11,11,NOW(),NOW()),
('task-151','Sub 准备学习笔记-React','整理React学习的笔记和重点',0,1,'2025-09-13','user-001','group-002','todolist-001',1,'task-150',12,12,NOW(),NOW()),
('task-152','Sub 准备学习笔记-TypeScript','整理TypeScript学习的笔记和重点',0,2,'2025-09-22','user-001','group-002','todolist-001',1,'task-150',13,13,NOW(),NOW()),
('task-153','编写技术博客','编写一篇技术博客分享开发经验',0,3,'2025-09-16','user-001','group-004','todolist-002',0,NULL,11,11,NOW(),NOW()),
('task-154','Sub 代码复审-前端部分','对前端代码进行详细的代码复审',0,2,'2025-09-17','user-001','group-004','todolist-002',1,'task-153',12,12,NOW(),NOW()),
('task-155','Sub 代码复审-后端部分','对后端代码进行详细的代码复审',0,2,'2025-09-18','user-001','group-004','todolist-002',1,'task-153',13,13,NOW(),NOW()),
('task-156','研究新技术','研究和学习项目可能用到的新技术',0,3,'2025-09-19','user-001','group-001','todolist-001',0,NULL,19,19,NOW(),NOW()),
('task-157','Sub 准备会议材料-PPT','制作会议所需的PPT演示文稿',0,2,'2025-09-20','user-001','group-001','todolist-001',1,'task-156',21,21,NOW(),NOW()),
('task-158','Sub 准备会议材料-文档','准备会议所需的详细文档资料',0,1,'2025-09-14','user-001','group-001','todolist-001',1,'task-156',22,22,NOW(),NOW()),
('task-159','制定下周计划','制定下周的工作计划和学习计划',0,2,'2025-09-15','user-001','group-004','todolist-002',0,NULL,13,13,NOW(),NOW()),
('task-160','Sub 总结工作进度-前端','总结前端部分的工作进度和问题',0,1,'2025-09-16','user-001','group-004','todolist-002',1,'task-159',14,14,NOW(),NOW()),
('task-161','Sub 总结工作进度-后端','总结后端部分的工作进度和问题',0,1,'2025-09-17','user-001','group-004','todolist-002',1,'task-159',15,15,NOW(),NOW()),
('task-162','优化工作流程','分析并优化团队的工作流程',0,2,'2025-09-18','user-001','group-003','todolist-002',0,NULL,17,17,NOW(),NOW()),
('task-163','Sub 学习产品知识-用户研究','学习用户研究的方法和技巧',0,1,'2025-09-19','user-001','group-003','todolist-002',1,'task-162',18,18,NOW(),NOW()),
('task-164','Sub 学习产品知识-需求分析','学习需求分析的方法和技巧',0,1,'2025-09-20','user-001','group-003','todolist-002',1,'task-162',19,19,NOW(),NOW()),
('task-165','更新技术栈','更新项目使用的技术栈到最新版本',0,3,'2025-09-14','user-001','group-001','todolist-001',0,NULL,20,20,NOW(),NOW()),
('task-166','Sub 准备演示文稿-内容','准备技术分享演示文稿的具体内容',0,2,'2025-09-15','user-001','group-001','todolist-001',1,'task-165',23,23,NOW(),NOW()),
('task-167','Sub 准备演示文稿-样式','美化技术分享演示文稿的样式设计',0,2,'2025-09-16','user-001','group-001','todolist-001',1,'task-165',24,24,NOW(),NOW()),
('task-168','Sub 分析用户反馈-正面','分析和总结用户的正面反馈',0,1,'2025-09-17','user-001','group-003','todolist-002',1,'task-164',20,20,NOW(),NOW()),
('task-169','Sub 分析用户反馈-负面','分析和总结用户的负面反馈并提出改进方案',0,3,'2025-09-18','user-001','group-003','todolist-002',1,'task-164',21,21,NOW(),NOW());

-- 13. 插入任务标签关联数据
INSERT INTO task_tag (task_id, tag_id, created_at)
VALUES
  -- 学习相关任务标签
  ('task-001', 'tag-001', NOW()),
  ('task-001', 'tag-002', NOW()),
  ('task-001', 'tag-004', NOW()),
  ('task-002', 'tag-001', NOW()),
  ('task-002', 'tag-002', NOW()),
  ('task-002', 'tag-003', NOW()),
  ('task-003', 'tag-001', NOW()),
  ('task-003', 'tag-002', NOW()),
  ('task-004', 'tag-001', NOW()),
  ('task-004', 'tag-002', NOW()),
  ('task-005', 'tag-001', NOW()),
  ('task-005', 'tag-003', NOW()),
  ('task-005', 'tag-004', NOW()),
  ('task-006', 'tag-001', NOW()),
  ('task-007', 'tag-001', NOW()),
  ('task-007', 'tag-002', NOW()),
  ('task-007', 'tag-005', NOW()),
  
  -- 工作相关任务标签
  ('task-008', 'tag-006', NOW()),
  ('task-008', 'tag-007', NOW()),
  ('task-008', 'tag-008', NOW()),
  ('task-009', 'tag-006', NOW()),
  ('task-009', 'tag-009', NOW()),
  ('task-010', 'tag-006', NOW()),
  ('task-010', 'tag-007', NOW()),
  ('task-010', 'tag-009', NOW()),
  ('task-011', 'tag-006', NOW()),
  ('task-011', 'tag-010', NOW()),
  ('task-011', 'tag-011', NOW()),
  ('task-012', 'tag-006', NOW()),
  ('task-012', 'tag-007', NOW()),
  ('task-012', 'tag-011', NOW()),
  
  -- 生活相关任务标签
  ('task-013', 'tag-012', NOW()),
  ('task-013', 'tag-013', NOW()),
  ('task-014', 'tag-012', NOW()),
  ('task-014', 'tag-014', NOW()),
  
  -- 阅读相关任务标签
  ('task-015', 'tag-015', NOW()),
  ('task-015', 'tag-016', NOW()),
  ('task-016', 'tag-015', NOW()),
  ('task-017', 'tag-015', NOW()),
  ('task-017', 'tag-016', NOW()),
  
  -- 健身相关任务标签
  ('task-018', 'tag-017', NOW()),
  ('task-018', 'tag-018', NOW()),
  ('task-019', 'tag-017', NOW()),
  
  -- 旅行相关任务标签
  ('task-020', 'tag-019', NOW()),
  ('task-020', 'tag-020', NOW()),
  ('task-021', 'tag-019', NOW()),
  ('task-021', 'tag-020', NOW()),
  ('task-022', 'tag-019', NOW()),
  ('task-022', 'tag-020', NOW()),
  
  -- 新增的任务标签关联数据
  -- 学习相关任务额外标签
  ('task-001', 'tag-005', NOW()),
  ('task-003', 'tag-003', NOW()),
  ('task-004', 'tag-003', NOW()),
  ('task-004', 'tag-005', NOW()),
  ('task-005', 'tag-002', NOW()),
  ('task-005', 'tag-005', NOW()),
  ('task-006', 'tag-004', NOW()),
  
  -- 工作相关任务额外标签
  ('task-008', 'tag-010', NOW()),
  ('task-009', 'tag-010', NOW()),
  ('task-009', 'tag-011', NOW()),
  ('task-010', 'tag-010', NOW()),
  ('task-011', 'tag-008', NOW()),
  ('task-012', 'tag-008', NOW()),
  ('task-012', 'tag-009', NOW()),
  
  -- 生活相关任务额外标签
  ('task-013', 'tag-014', NOW()),
  ('task-014', 'tag-013', NOW()),
  
  -- 阅读相关任务额外标签
  ('task-015', 'tag-001', NOW()),
  ('task-016', 'tag-016', NOW()),
  ('task-017', 'tag-001', NOW()),
  
  -- 健身相关任务额外标签
  ('task-018', 'tag-012', NOW()),
  ('task-019', 'tag-012', NOW()),
  ('task-019', 'tag-018', NOW()),
  
  -- 旅行相关任务额外标签
  ('task-020', 'tag-006', NOW()),
  ('task-021', 'tag-006', NOW()),
  ('task-022', 'tag-009', NOW());
  


-- 14. 插入回收站数据 (标准化ID格式: bin-xxx)
INSERT INTO bin (id, title, text, completed, priority, datetime_local, deadline, parent_id, depth, list_id, group_id, user_id, created_at, updated_at, deleted_at)
VALUES
  -- 用户1删除的任务
  ('bin-001', '旧任务 - 完成项目提案', '这是一个已删除的旧任务', true, 2, '2025-09-10T10:00:00.000Z', '2025-09-12T00:00:00.000Z', NULL, 0, 'todolist-002', 'group-003', 'user-001', '2025-09-10 10:00:00', '2025-09-11 15:00:00', '2025-09-13 09:30:00'),
  ('bin-002', '旧任务 - 团队会议记录', '记录讨论的要点和行动项', false, 1, '2025-09-05T14:00:00.000Z', '2025-09-06T00:00:00.000Z', NULL, 0, 'todolist-002', 'group-004', 'user-001', '2025-09-05 14:00:00', '2025-09-05 15:30:00', '2025-09-12 16:20:00'),
  ('bin-003', '已取消的学习任务', '由于时间冲突取消的学习计划', false, 3, '2025-09-08T09:00:00.000Z', '2025-09-09T00:00:00.000Z', NULL, 0, 'todolist-001', 'group-001', 'user-001', '2025-09-08 09:00:00', '2025-09-08 09:00:00', '2025-09-10 11:45:00'),
  
  -- 用户2删除的任务
  ('bin-004', '旧任务 - 购买日用品', '每周购物清单', true, 2, '2025-09-07T18:00:00.000Z', '2025-09-08T00:00:00.000Z', NULL, 0, 'todolist-003', NULL, 'user-002', '2025-09-07 18:00:00', '2025-09-07 19:30:00', '2025-09-11 09:15:00'),
  ('bin-005', '已完成的阅读任务', '《程序员修炼之道》阅读笔记', true, 3, '2025-09-01T10:00:00.000Z', '2025-09-05T00:00:00.000Z', NULL, 0, 'todolist-004', 'group-006', 'user-002', '2025-09-01 10:00:00', '2025-09-04 16:45:00', '2025-09-09 14:30:00'),
  
  -- 用户3删除的任务
  ('bin-006', '已完成的健身任务', '完成30天健身挑战', true, 2, '2025-09-01T07:00:00.000Z', '2025-09-05T00:00:00.000Z', NULL, 0, 'todolist-005', 'group-007', 'user-003', '2025-09-01 07:00:00', '2025-09-05 18:30:00', '2025-09-08 08:20:00'),
  ('bin-007', '取消的户外活动', '由于天气原因取消的徒步计划', false, 1, '2025-09-09T09:00:00.000Z', '2025-09-10T00:00:00.000Z', NULL, 0, 'todolist-005', NULL, 'user-003', '2025-09-09 09:00:00', '2025-09-09 09:00:00', '2025-09-09 11:30:00');

-- 15. 创建OSS文件相关表
-- 创建OSS文件主表
CREATE TABLE IF NOT EXISTS oss_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL COMMENT '文件名',
  object_key VARCHAR(255) NOT NULL COMMENT 'OSS对象键（缩短长度以避免索引过长）',
  file_type VARCHAR(50) NOT NULL COMMENT '文件类型/扩展名',
  file_size BIGINT NOT NULL COMMENT '文件大小（字节）',
  oss_url VARCHAR(255) NOT NULL COMMENT 'OSS文件完整URL（缩短长度）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_object_key (object_key(191)),  -- 限制索引长度为191个字符
  INDEX idx_file_type (file_type)
) COMMENT 'OSS文件主表';

-- 创建任务附件关联表
CREATE TABLE IF NOT EXISTS task_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_id INT NOT NULL COMMENT '关联oss_files表的ID',
  task_id VARCHAR(36) NOT NULL COMMENT '关联任务表的ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_task_id (task_id),
  INDEX idx_file_id (file_id),
  FOREIGN KEY (file_id) REFERENCES oss_files(id) ON DELETE CASCADE
) COMMENT '任务附件关联表';

-- 创建用户头像关联表
CREATE TABLE IF NOT EXISTS user_avatars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_id INT NOT NULL COMMENT '关联oss_files表的ID',
  user_id VARCHAR(36) NOT NULL COMMENT '关联用户表的ID',
  is_default BOOLEAN DEFAULT FALSE COMMENT '是否为默认头像',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_file_id (file_id),
  INDEX idx_user_default (user_id, is_default) COMMENT '每个用户只能有一个默认头像',
  FOREIGN KEY (file_id) REFERENCES oss_files(id) ON DELETE CASCADE
) COMMENT '用户头像关联表';

-- 16. 创建索引以优化查询性能
ALTER TABLE task ADD INDEX idx_task_user_id (user_id);
ALTER TABLE task ADD INDEX idx_task_list_id (list_id);
ALTER TABLE task ADD INDEX idx_task_group_id (group_id);
ALTER TABLE todo_list ADD INDEX idx_todo_list_user_id (user_id);
ALTER TABLE task_group ADD INDEX idx_task_group_list_id (list_id);
ALTER TABLE todo_tag ADD INDEX idx_todo_tag_user_id (user_id);
ALTER TABLE todo_tag ADD INDEX idx_todo_tag_parent_id (parent_id);
ALTER TABLE bin ADD INDEX idx_bin_user_id (user_id);
ALTER TABLE bin ADD INDEX idx_bin_deleted_at (deleted_at);

-- 为OSS相关表添加索引
ALTER TABLE oss_files ADD INDEX idx_oss_files_created_at (created_at);
ALTER TABLE task_attachments ADD INDEX idx_task_attachments_created_at (created_at);
ALTER TABLE user_avatars ADD INDEX idx_user_avatars_created_at (created_at);

-- 17. 创建专注记录表（在所有依赖表数据插入后创建）
CREATE TABLE IF NOT EXISTS focus_record (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  task_id VARCHAR(36) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_minutes INT NULL COMMENT '持续时间（分钟）',
  notes TEXT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  mode ENUM('pomodoro', 'normal') NOT NULL DEFAULT 'pomodoro',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加触发器，自动计算持续时间
DELIMITER //
CREATE TRIGGER calculate_duration_before_insert
BEFORE INSERT ON focus_record
FOR EACH ROW
BEGIN
  SET NEW.duration_minutes = TIMESTAMPDIFF(MINUTE, NEW.start_time, NEW.end_time);
END//

CREATE TRIGGER calculate_duration_before_update
BEFORE UPDATE ON focus_record
FOR EACH ROW
BEGIN
  SET NEW.duration_minutes = TIMESTAMPDIFF(MINUTE, NEW.start_time, NEW.end_time);
END//
DELIMITER ;

-- 为专注记录表添加索引
ALTER TABLE focus_record ADD INDEX idx_focus_record_user_id (user_id);
ALTER TABLE focus_record ADD INDEX idx_focus_record_task_id (task_id);
ALTER TABLE focus_record ADD INDEX idx_focus_record_created_at (created_at);

-- 插入专注记录测试数据 (标准化ID格式: focus-xxx) - 在task表数据插入后进行
INSERT INTO focus_record (id, user_id, task_id, start_time, end_time, duration_minutes, notes, completed, mode, created_at, updated_at)
VALUES
  ('focus-001', 'user-001', 'task-001', '2025-09-16 09:00:00', '2025-09-16 09:25:00', 25, '专注学习React基础', true, 'pomodoro', '2025-09-16 09:00:00', '2025-09-16 09:25:00'),
  ('focus-002', 'user-001', 'task-002', '2025-09-16 09:35:00', '2025-09-16 10:00:00', 25, '学习React Hooks', true, 'pomodoro', '2025-09-16 09:35:00', '2025-09-16 10:00:00'),
  ('focus-003', 'user-001', 'task-007', '2025-09-16 14:00:00', '2025-09-16 15:30:00', 90, '深入学习TypeScript高级特性', true, 'normal', '2025-09-16 14:00:00', '2025-09-16 15:30:00'),
  ('focus-004', 'user-002', 'task-015', '2025-09-16 20:00:00', '2025-09-16 20:25:00', 25, '阅读代码整洁之道', true, 'pomodoro', '2025-09-16 20:00:00', '2025-09-16 20:25:00'),
  ('focus-005', 'user-003', 'task-018', '2025-09-17 07:00:00', '2025-09-17 07:45:00', 45, '晨跑训练', true, 'normal', '2025-09-17 07:00:00', '2025-09-17 07:45:00'),
  ('focus-006', 'user-001', 'task-009', '2025-09-17 10:00:00', '2025-09-17 10:25:00', 25, '完成API文档编写', true, 'pomodoro', '2025-09-17 10:00:00', '2025-09-17 10:25:00');
-- 执行此脚本以创建数据库表并插入示例数据。注意：密码已进行哈希处理（示例密码为123456、password123和demo123）。