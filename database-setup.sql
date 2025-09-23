-- 数据库创建脚本
-- 1. 创建数据库（如果需要）
CREATE DATABASE IF NOT EXISTS todo_db;
USE todo_db;

-- 2. 创建用户表
CREATE TABLE IF NOT EXISTS user (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 创建待办事项列表表
CREATE TABLE IF NOT EXISTS todo_list (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
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
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES todo_tag(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 创建任务表
CREATE TABLE IF NOT EXISTS task (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority INT NOT NULL DEFAULT 0,
  datetime_local DATETIME NULL,
  deadline DATE NULL,
  parent_id VARCHAR(36) NULL,
  depth INT NOT NULL DEFAULT 0,
  list_id VARCHAR(36) NOT NULL,
  group_id VARCHAR(36) NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (list_id) REFERENCES todo_list(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES task_group(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES task(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- 8. 插入用户数据 (标准化ID格式: user-xxx)
INSERT INTO user (id, username, email, password, avatar, created_at, updated_at)
VALUES
  ('user-001', 'admin', 'admin@example.com', '$2b$10$FZt6w7l8j2X9qk6B5F4pHeL8h3pD6L7V8n9m0P1q2r3s4t5u6v7w8', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', NOW(), NOW()),
  ('user-002', 'testuser', 'test@example.com', '$2b$10$Gz7v8n9m0P1q2r3s4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J', 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser', NOW(), NOW()),
  ('user-003', 'demo', 'demo@example.com', '$2b$10$H1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9A0B1C2D3E4F', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', NOW(), NOW());

-- 9. 插入待办事项列表数据 (标准化ID格式: todolist-xxx)
INSERT INTO todo_list (id, title, created_at, updated_at, user_id)
VALUES
  ('todolist-001', '我的待办事项', '2025-09-16 12:00:00', '2025-09-16 12:00:00', 'user-001'),
  ('todolist-002', '工作清单', '2025-09-16 12:05:00', '2025-09-16 12:05:00', 'user-001'),
  ('todolist-003', '生活杂项', '2025-09-16 12:10:00', '2025-09-16 12:10:00', 'user-002'),
  ('todolist-004', '读书计划', '2025-09-16 12:15:00', '2025-09-16 12:15:00', 'user-002'),
  ('todolist-005', '健身目标', '2025-09-16 12:20:00', '2025-09-16 12:20:00', 'user-003'),
  ('todolist-006', '旅行计划', '2025-09-16 12:25:00', '2025-09-16 12:25:00', 'user-001');

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
INSERT INTO todo_tag (id, name, parent_id, user_id, created_at, updated_at)
VALUES
  ('tag-001', '学习', NULL, 'user-001', NOW(), NOW()),
  ('tag-002', 'React', 'tag-001', 'user-001', NOW(), NOW()),
  ('tag-003', '视频课程', 'tag-001', 'user-001', NOW(), NOW()),
  ('tag-004', '后端', 'tag-001', 'user-001', NOW(), NOW()),
  ('tag-005', 'TypeScript', 'tag-002', 'user-001', NOW(), NOW()),
  ('tag-006', '工作', NULL, 'user-001', NOW(), NOW()),
  ('tag-007', '会议', 'tag-006', 'user-001', NOW(), NOW()),
  ('tag-008', '项目管理', 'tag-006', 'user-001', NOW(), NOW()),
  ('tag-009', '计划', 'tag-006', 'user-001', NOW(), NOW()),
  ('tag-010', '执行', 'tag-006', 'user-001', NOW(), NOW()),
  ('tag-011', '团队协作', 'tag-006', 'user-001', NOW(), NOW()),
  ('tag-012', '生活', NULL, 'user-002', NOW(), NOW()),
  ('tag-013', '礼物', 'tag-012', 'user-002', NOW(), NOW()),
  ('tag-014', '运动', 'tag-012', 'user-002', NOW(), NOW()),
  ('tag-015', '阅读', NULL, 'user-002', NOW(), NOW()),
  ('tag-016', '技术书籍', 'tag-015', 'user-002', NOW(), NOW()),
  ('tag-017', '健身', NULL, 'user-003', NOW(), NOW()),
  ('tag-018', '跑步', 'tag-017', 'user-003', NOW(), NOW()),
  ('tag-019', '旅行', NULL, 'user-001', NOW(), NOW()),
  ('tag-020', '准备', 'tag-019', 'user-001', NOW(), NOW());

-- 12. 插入任务数据 (标准化ID格式: task-xxx)
INSERT INTO task (id, title, completed, priority, datetime_local, deadline, parent_id, depth, list_id, group_id, user_id, created_at, updated_at)
VALUES
  -- 用户1的学习相关任务
  ('task-001', '学习 React', false, 2, '2025-09-16 12:00:00', '2025-09-22', NULL, 0, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-002', 'Sub 学习 React1', false, 2, '2025-09-16 12:00:00', '2025-09-30', 'task-001', 1, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-003', 'Sub 学习 React2', false, 2, '2025-09-16 12:00:00', '2025-09-18', 'task-001', 1, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-004', 'Sub 学习 React3', false, 2, '2025-09-16 12:00:00', '2025-09-18', 'task-001', 1, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  ('task-005', '刷完《React 进阶实战》视频课', false, 2, '2025-09-16 12:00:00', '2025-09-20', NULL, 0, 'todolist-001', 'group-002', 'user-001', NOW(), NOW()),
  ('task-006', '整理个人知识库', false, 1, '2025-09-16 12:00:00', '2025-09-25', NULL, 0, 'todolist-001', 'group-002', 'user-001', NOW(), NOW()),
  ('task-007', '学习 TypeScript 高级特性', false, 3, '2025-09-16 14:00:00', '2025-09-28', NULL, 0, 'todolist-001', 'group-001', 'user-001', NOW(), NOW()),
  
  -- 用户1的工作相关任务
  ('task-008', '完成需求评审', true, 1, '2025-09-16 12:05:00', '2025-09-14', NULL, 0, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-009', '编写API文档', false, 2, '2025-09-17 10:00:00', '2025-09-20', NULL, 0, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  ('task-010', '准备周会材料', false, 1, '2025-09-17 15:00:00', '2025-09-18', NULL, 0, 'todolist-002', 'group-004', 'user-001', NOW(), NOW()),
  ('task-011', '代码审查', false, 2, '2025-09-18 09:00:00', '2025-09-19', NULL, 0, 'todolist-002', 'group-004', 'user-001', NOW(), NOW()),
  ('task-012', '团队培训会议', false, 1, '2025-09-20 14:00:00', '2025-09-20', NULL, 0, 'todolist-002', 'group-003', 'user-001', NOW(), NOW()),
  
  -- 用户2的任务
  ('task-013', '购买生日礼物', true, 1, '2025-09-15 18:00:00', '2025-09-15', NULL, 0, 'todolist-003', 'group-005', 'user-002', NOW(), NOW()),
  ('task-014', '打扫房间', false, 2, '2025-09-17 10:00:00', '2025-09-17', NULL, 0, 'todolist-003', NULL, 'user-002', NOW(), NOW()),
  ('task-015', '读完《代码整洁之道》', false, 3, '2025-09-16 09:00:00', '2025-09-30', NULL, 0, 'todolist-004', 'group-006', 'user-002', NOW(), NOW()),
  ('task-016', '做读书笔记', false, 2, '2025-09-19 15:00:00', '2025-09-25', 'task-015', 1, 'todolist-004', 'group-006', 'user-002', NOW(), NOW()),
  ('task-017', '计划下本月阅读书单', false, 1, '2025-09-25 10:00:00', '2025-09-28', NULL, 0, 'todolist-004', 'group-006', 'user-002', NOW(), NOW()),
  
  -- 用户3的任务
  ('task-018', '跑步5公里', false, 2, '2025-09-17 07:00:00', '2025-09-17', NULL, 0, 'todolist-005', 'group-007', 'user-003', NOW(), NOW()),
  ('task-019', '健身训练', false, 3, '2025-09-18 18:00:00', '2025-09-18', NULL, 0, 'todolist-005', 'group-007', 'user-003', NOW(), NOW()),
  
  -- 用户1的旅行计划任务
  ('task-020', '预订机票', false, 2, '2025-09-20 10:00:00', '2025-09-25', NULL, 0, 'todolist-006', 'group-008', 'user-001', NOW(), NOW()),
  ('task-021', '预订酒店', false, 2, '2025-09-22 10:00:00', '2025-09-27', NULL, 0, 'todolist-006', 'group-008', 'user-001', NOW(), NOW()),
  ('task-022', '制定行程计划', false, 1, '2025-09-24 14:00:00', '2025-09-30', NULL, 0, 'todolist-006', 'group-008', 'user-001', NOW(), NOW());

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

-- 14. 创建索引以优化查询性能
ALTER TABLE task ADD INDEX idx_task_user_id (user_id);
ALTER TABLE task ADD INDEX idx_task_list_id (list_id);
ALTER TABLE task ADD INDEX idx_task_group_id (group_id);
ALTER TABLE todo_list ADD INDEX idx_todo_list_user_id (user_id);
ALTER TABLE task_group ADD INDEX idx_task_group_list_id (list_id);
ALTER TABLE todo_tag ADD INDEX idx_todo_tag_user_id (user_id);
ALTER TABLE todo_tag ADD INDEX idx_todo_tag_parent_id (parent_id);

-- 脚本完成提示
-- 执行此脚本以创建数据库表并插入示例数据。注意：密码已进行哈希处理（示例密码为123456、password123和demo123）。