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
  FOREIGN KEY (list_id) REFERENCES todo_list(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES task_group(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES task(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加索引以优化置顶任务的查询性能
CREATE INDEX idx_task_is_pinned ON task(is_pinned);
CREATE INDEX idx_task_pinned_at ON task(pinned_at);
CREATE INDEX idx_task_user_pinned ON task(user_id, is_pinned, pinned_at);

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
INSERT INTO task (id, title, text, completed, priority, datetime_local, deadline, parent_id, depth, list_id, group_id, user_id, created_at, updated_at)
VALUES
  -- 用户1的学习相关任务
  ('task-001', '学习 React', '学习React基础和进阶内容，包括组件、状态管理等', false, 2, '2025-09-16T12:00:00.000Z', '2025-09-22T00:00:00.000Z', NULL, 0, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-002', 'Sub 学习 React1', 'React组件生命周期和Hooks学习', false, 2, '2025-09-16T12:00:00.000Z', '2025-09-30T00:00:00.000Z', 'task-001', 1, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-003', 'Sub 学习 React2', 'React路由和状态管理学习', false, 2, '2025-09-16T12:00:00.000Z', '2025-09-18T00:00:00.000Z', 'task-001', 1, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-004', 'Sub 学习 React3', 'React性能优化和最佳实践', false, 2, '2025-09-16T12:00:00.000Z', '2025-09-18T00:00:00.000Z', 'task-001', 1, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-005', '刷完《React 进阶实战》视频课', '完成10小时的React进阶实战视频课程', false, 2, '2025-09-16T12:00:00.000Z', '2025-09-20T00:00:00.000Z', NULL, 0, 'todolist-001', 'group-002', 'user-001', NOW(), NOW()),
  ('task-006', '整理个人知识库', '将学习资料分类整理，建立知识体系', false, 1, '2025-09-16T12:00:00.000Z', '2025-09-25T00:00:00.000Z', NULL, 0, 'todolist-001', 'group-002', 'user-001', NOW(), NOW()),
  ('task-007', '学习 TypeScript 高级特性', '学习泛型、类型守卫、装饰器等高级特性', false, 3, '2025-09-16T14:00:00.000Z', '2025-09-28T00:00:00.000Z', NULL, 0, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  
  -- 用户1的工作相关任务
  ('task-008', '完成需求评审', '与团队讨论并确定项目需求和范围', true, 1, '2025-09-16T12:05:00.000Z', '2025-09-14T00:00:00.000Z', NULL, 0, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-009', '编写API文档', '使用Swagger为后端API编写详细文档', false, 2, '2025-09-17T10:00:00.000Z', '2025-09-20T00:00:00.000Z', NULL, 0, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-010', '准备周会材料', '收集项目进度，准备周会汇报内容', false, 1, '2025-09-17T15:00:00.000Z', '2025-09-18T00:00:00.000Z', NULL, 0, 'todolist-002', 'group-004', 'user-001', NOW(), NOW()),
  ('task-011', '代码审查', '审查团队成员提交的代码，确保质量', false, 2, '2025-09-18T09:00:00.000Z', '2025-09-19T00:00:00.000Z', NULL, 0, 'todolist-002', 'group-004', 'user-001', NOW(), NOW()),
  ('task-012', '团队培训会议', '组织技术分享会，提升团队技能', false, 1, '2025-09-20T14:00:00.000Z', '2025-09-20T00:00:00.000Z', NULL, 0, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  
  -- 用户2的任务
  ('task-013', '购买生日礼物', '为朋友挑选生日礼物并包装', true, 1, '2025-09-15T18:00:00.000Z', '2025-09-15T00:00:00.000Z', NULL, 0, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-014', '打扫房间', '打扫客厅、卧室和厨房，保持整洁', false, 2, '2025-09-17T10:00:00.000Z', '2025-09-17T00:00:00.000Z', NULL, 0, 'todolist-003', NULL, 'user-002', NOW(), NOW()),
  ('task-015', '读完《代码整洁之道》', '阅读并理解代码整洁之道的核心原则', false, 3, '2025-09-16T09:00:00.000Z', '2025-09-30T00:00:00.000Z', NULL, 0, 'todolist-004', 'group-006', 'user-002', NOW(), NOW()),
  ('task-016', '做读书笔记', '整理《代码整洁之道》的关键知识点和感悟', false, 2, '2025-09-19T15:00:00.000Z', '2025-09-25T00:00:00.000Z', 'task-015', 1, 'todolist-004', 'group-006', 'user-002', NOW(), NOW()),
  ('task-017', '计划下本月阅读书单', '根据兴趣和需求，制定下个月的阅读计划', false, 1, '2025-09-25T10:00:00.000Z', '2025-09-28T00:00:00.000Z', NULL, 0, 'todolist-004', 'group-006', 'user-002', NOW(), NOW()),
  
  -- 用户3的任务
  ('task-018', '跑步5公里', '在公园完成5公里跑步锻炼', false, 2, '2025-09-17T07:00:00.000Z', '2025-09-17T00:00:00.000Z', NULL, 0, 'todolist-005', 'group-007', 'user-003', NOW(), NOW()),
  ('task-019', '健身训练', '进行力量训练，重点锻炼上肢', false, 3, '2025-09-18T18:00:00.000Z', '2025-09-18T00:00:00.000Z', NULL, 0, 'todolist-005', 'group-007', 'user-003', NOW(), NOW()),
  
  -- 用户1的旅行计划任务
  ('task-020', '预订机票', '查询并预订往返机票，比较价格和时间', false, 2, '2025-09-20T10:00:00.000Z', '2025-09-25T00:00:00.000Z', NULL, 0, 'todolist-006', 'group-008', 'user-001', NOW(), NOW()),
  ('task-021', '预订酒店', '根据行程安排预订合适的酒店住宿', false, 2, '2025-09-22T10:00:00.000Z', '2025-09-27T00:00:00.000Z', NULL, 0, 'todolist-006', 'group-008', 'user-001', NOW(), NOW()),
  ('task-022', '制定行程计划', '详细规划每天的行程安排和景点游览', false, 1, '2025-09-24T14:00:00.000Z', '2025-09-30T00:00:00.000Z', NULL, 0, 'todolist-006', 'group-008', 'user-001', NOW(), NOW()),
  
  -- 新增30条多层级任务数据（从task-023开始）
  -- 项目开发任务树（用户1）
  ('task-023', '前端项目重构', '对现有前端项目进行全面重构，提升性能', false, 3, '2025-10-01T10:00:00.000Z', '2025-10-20T00:00:00.000Z', NULL, 0, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-024', '技术栈选型', '评估并选择合适的前端技术栈和框架', false, 3, '2025-10-01T14:00:00.000Z', '2025-10-03T00:00:00.000Z', 'task-023', 1, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-025', '框架对比分析', '对React、Vue和Angular进行详细对比分析', false, 2, '2025-10-02T10:00:00.000Z', '2025-10-03T00:00:00.000Z', 'task-024', 2, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-026', '组件库评估', '评估多个UI组件库的适用性和功能', false, 2, '2025-10-02T14:00:00.000Z', '2025-10-04T00:00:00.000Z', 'task-024', 2, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-027', '架构设计', '设计前端项目的整体架构和模块划分', false, 3, '2025-10-04T10:00:00.000Z', '2025-10-08T00:00:00.000Z', 'task-023', 1, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-028', '目录结构规划', '规划项目的文件目录结构和命名规范', false, 2, '2025-10-04T14:00:00.000Z', '2025-10-05T00:00:00.000Z', 'task-027', 2, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-029', '状态管理方案', '选择并实现适合项目的状态管理方案', false, 2, '2025-10-05T10:00:00.000Z', '2025-10-07T00:00:00.000Z', 'task-027', 2, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-030', 'API接口设计', '设计前后端交互的API接口规范', false, 2, '2025-10-05T14:00:00.000Z', '2025-10-08T00:00:00.000Z', 'task-027', 2, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-031', '代码实现', '根据设计文档进行具体的代码实现', false, 2, '2025-10-09T09:00:00.000Z', '2025-10-18T00:00:00.000Z', 'task-023', 1, 'todolist-002', 'group-004', 'user-001', NOW(), NOW()),
  ('task-032', '核心组件开发', '开发项目所需的核心UI组件和业务组件', false, 2, '2025-10-09T10:00:00.000Z', '2025-10-15T00:00:00.000Z', 'task-031', 2, 'todolist-002', 'group-004', 'user-001', NOW(), NOW()),
  ('task-033', '用户界面实现', '根据设计稿实现用户界面和交互效果', false, 2, '2025-10-12T10:00:00.000Z', '2025-10-17T00:00:00.000Z', 'task-031', 2, 'todolist-002', 'group-004', 'user-001', NOW(), NOW()),
  ('task-034', '数据层对接', '实现前端与后端API的数据交互逻辑', false, 2, '2025-10-14T14:00:00.000Z', '2025-10-18T00:00:00.000Z', 'task-031', 2, 'todolist-002', 'group-004', 'user-001', NOW(), NOW()),
  ('task-035', '测试与优化', '对项目进行全面测试和性能优化', false, 3, '2025-10-19T10:00:00.000Z', '2025-10-20T00:00:00.000Z', 'task-023', 1, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  
  -- 学习计划任务树（用户1）
  ('task-036', '学习前端新技术', '了解和学习最新的前端技术和趋势', false, 2, '2025-10-01T09:00:00.000Z', '2025-10-30T00:00:00.000Z', NULL, 0, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-037', '学习Vue 3', '系统学习Vue 3框架的核心概念和用法', false, 2, '2025-10-02T10:00:00.000Z', '2025-10-15T00:00:00.000Z', 'task-036', 1, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-038', '安装开发环境', '搭建Vue 3的开发环境和项目脚手架', false, 1, '2025-10-02T14:00:00.000Z', '2025-10-03T00:00:00.000Z', 'task-037', 2, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-039', '基础语法学习', '学习Vue 3的模板语法、组件基础等', false, 2, '2025-10-03T10:00:00.000Z', '2025-10-07T00:00:00.000Z', 'task-037', 2, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-040', '组合式API实践', '深入学习和实践Vue 3的组合式API', false, 2, '2025-10-08T10:00:00.000Z', '2025-10-12T00:00:00.000Z', 'task-037', 2, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-041', '创建示例项目', '使用Vue 3创建一个完整的示例项目', false, 3, '2025-10-13T10:00:00.000Z', '2025-10-15T00:00:00.000Z', 'task-037', 2, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-042', '学习WebAssembly', '了解WebAssembly的基本概念和应用场景', false, 2, '2025-10-16T10:00:00.000Z', '2025-10-25T00:00:00.000Z', 'task-036', 1, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-043', '理论学习', '学习WebAssembly的工作原理和编译过程', false, 2, '2025-10-16T14:00:00.000Z', '2025-10-20T00:00:00.000Z', 'task-042', 2, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-044', '简单应用开发', '使用WebAssembly开发一个简单的应用实例', false, 3, '2025-10-21T10:00:00.000Z', '2025-10-25T00:00:00.000Z', 'task-042', 2, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  
  -- 生活任务树（用户2）
  ('task-045', '家庭大扫除', '对整个家庭进行全面的清洁和整理', false, 2, '2025-10-05T09:00:00.000Z', '2025-10-05T00:00:00.000Z', NULL, 0, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-046', '打扫客厅', '清洁客厅的地面、家具和窗户', false, 2, '2025-10-05T09:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-045', 1, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-047', '扫地', '使用吸尘器清洁客厅的地毯和角落', false, 1, '2025-10-05T09:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-046', 2, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-048', '拖地', '使用拖把清洁客厅的硬质地面', false, 1, '2025-10-05T10:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-046', 2, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-049', '打扫卧室', '整理和清洁所有卧室空间', false, 2, '2025-10-05T11:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-045', 1, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-050', '整理衣柜', '整理和分类衣柜中的衣物', false, 2, '2025-10-05T11:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-049', 2, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-051', '更换床单', '更换所有卧室的床单和枕套', false, 1, '2025-10-05T12:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-049', 2, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-052', '打扫厨房', '彻底清洁厨房的各个区域和电器', false, 3, '2025-10-05T13:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-045', 1, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-053', '清洗油烟机', '拆卸并清洗厨房油烟机的滤网和部件', false, 3, '2025-10-05T13:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-052', 2, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-054', '清洁灶台', '清洁厨房灶台和周围墙面', false, 2, '2025-10-05T14:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-052', 2, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-055', '整理冰箱', '清理和整理冰箱内的食物和物品', false, 2, '2025-10-05T15:30:00.000Z', '2025-10-05T00:00:00.000Z', 'task-052', 2, 'todolist-003', 'group-005', 'user-002', NOW(), NOW());

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
  ('task-022', 'tag-009', NOW()),
  
  -- 新项目开发任务树的标签
  ('task-023', 'tag-006', NOW()),
  ('task-023', 'tag-009', NOW()),
  ('task-023', 'tag-010', NOW()),
  ('task-024', 'tag-006', NOW()),
  ('task-024', 'tag-009', NOW()),
  ('task-025', 'tag-001', NOW()),
  ('task-025', 'tag-002', NOW()),
  ('task-026', 'tag-001', NOW()),
  ('task-026', 'tag-002', NOW()),
  ('task-027', 'tag-006', NOW()),
  ('task-027', 'tag-009', NOW()),
  ('task-028', 'tag-006', NOW()),
  ('task-028', 'tag-010', NOW()),
  ('task-029', 'tag-001', NOW()),
  ('task-029', 'tag-002', NOW()),
  ('task-030', 'tag-001', NOW()),
  ('task-030', 'tag-004', NOW()),
  ('task-031', 'tag-006', NOW()),
  ('task-031', 'tag-010', NOW()),
  ('task-032', 'tag-001', NOW()),
  ('task-032', 'tag-002', NOW()),
  ('task-033', 'tag-001', NOW()),
  ('task-033', 'tag-002', NOW()),
  ('task-034', 'tag-001', NOW()),
  ('task-034', 'tag-004', NOW()),
  ('task-035', 'tag-006', NOW()),
  ('task-035', 'tag-010', NOW()),
  
  -- 新学习计划任务树的标签
  ('task-036', 'tag-001', NOW()),
  ('task-036', 'tag-003', NOW()),
  ('task-037', 'tag-001', NOW()),
  ('task-037', 'tag-002', NOW()),
  ('task-037', 'tag-003', NOW()),
  ('task-038', 'tag-001', NOW()),
  ('task-038', 'tag-003', NOW()),
  ('task-039', 'tag-001', NOW()),
  ('task-039', 'tag-002', NOW()),
  ('task-039', 'tag-003', NOW()),
  ('task-040', 'tag-001', NOW()),
  ('task-040', 'tag-002', NOW()),
  ('task-040', 'tag-003', NOW()),
  ('task-041', 'tag-001', NOW()),
  ('task-041', 'tag-002', NOW()),
  ('task-041', 'tag-003', NOW()),
  ('task-042', 'tag-001', NOW()),
  ('task-042', 'tag-004', NOW()),
  ('task-043', 'tag-001', NOW()),
  ('task-043', 'tag-003', NOW()),
  ('task-044', 'tag-001', NOW()),
  ('task-044', 'tag-004', NOW()),
  
  -- 新生活任务树的标签
  ('task-045', 'tag-012', NOW()),
  ('task-046', 'tag-012', NOW()),
  ('task-047', 'tag-012', NOW()),
  ('task-047', 'tag-014', NOW()),
  ('task-048', 'tag-012', NOW()),
  ('task-048', 'tag-014', NOW()),
  ('task-049', 'tag-012', NOW()),
  ('task-050', 'tag-012', NOW()),
  ('task-051', 'tag-012', NOW()),
  ('task-052', 'tag-012', NOW()),
  ('task-052', 'tag-014', NOW()),
  ('task-053', 'tag-012', NOW()),
  ('task-053', 'tag-014', NOW()),
  ('task-054', 'tag-012', NOW()),
  ('task-054', 'tag-014', NOW()),
  ('task-055', 'tag-012', NOW()),
  ('task-055', 'tag-014', NOW());

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

-- 15. 创建索引以优化查询性能
ALTER TABLE task ADD INDEX idx_task_user_id (user_id);
ALTER TABLE task ADD INDEX idx_task_list_id (list_id);
ALTER TABLE task ADD INDEX idx_task_group_id (group_id);
ALTER TABLE todo_list ADD INDEX idx_todo_list_user_id (user_id);
ALTER TABLE task_group ADD INDEX idx_task_group_list_id (list_id);
ALTER TABLE todo_tag ADD INDEX idx_todo_tag_user_id (user_id);
ALTER TABLE todo_tag ADD INDEX idx_todo_tag_parent_id (parent_id);
ALTER TABLE bin ADD INDEX idx_bin_user_id (user_id);
ALTER TABLE bin ADD INDEX idx_bin_deleted_at (deleted_at);

-- 16. 创建专注记录表（在所有依赖表数据插入后创建）
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