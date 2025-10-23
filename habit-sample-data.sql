-- 习惯打卡功能示例数据补充
USE todo_db;

-- 1. 为现有用户添加习惯数据 (只使用存在的用户ID: user-001, user-002, user-003)
INSERT INTO habit (id, user_id, title, description, frequency, custom_frequency_days, start_date, target_days, reminder_time, is_reminder_enabled, color, emoji, created_at, updated_at)
VALUES
  -- 用户user-001的习惯
  ('habit-005', 'user-001', '每日喝水', '每天至少喝8杯水', 'daily', NULL, '2024-01-18', 21, '09:00:00', TRUE, '#4299e1', '💧', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),
  ('habit-006', 'user-001', '学习编程', '每天学习编程1小时', 'daily', NULL, '2024-01-10', 100, '19:00:00', TRUE, '#48bb78', '💻', NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY),
  
  -- 用户user-002的习惯
  ('habit-007', 'user-002', '英语学习', '每天背30个单词', 'daily', NULL, '2024-01-15', 60, '21:30:00', TRUE, '#ed8936', '📝', NOW() - INTERVAL 13 DAY, NOW() - INTERVAL 13 DAY),
  ('habit-008', 'user-002', '周末跑步', '每周六、日跑步5公里', 'custom', '6,0', '2024-01-20', 20, '08:00:00', TRUE, '#f56565', '🏃', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),
  
  -- 用户user-003的习惯
  ('habit-009', 'user-003', '写日记', '记录每日心情和收获', 'daily', NULL, '2024-01-08', 365, '22:00:00', TRUE, '#9f7aea', '📔', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY),
  ('habit-010', 'user-003', '垃圾分类', '正确分类垃圾', 'daily', NULL, '2024-01-22', 30, NULL, FALSE, '#38b2ac', '♻️', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY);

-- 2. 为新添加的习惯添加完整的打卡记录
-- 为用户user-001的habit-005（每日喝水）添加打卡记录
INSERT INTO habit_check_in (id, habit_id, user_id, check_in_date, status, notes, created_at, updated_at)
VALUES
  ('checkin-006', 'habit-005', 'user-001', CURDATE() - INTERVAL 9 DAY, 'completed', '今天喝了10杯水', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY),
  ('checkin-007', 'habit-005', 'user-001', CURDATE() - INTERVAL 8 DAY, 'completed', '喝了8杯水达标', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),
  ('checkin-008', 'habit-005', 'user-001', CURDATE() - INTERVAL 7 DAY, 'completed', '保持良好', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
  ('checkin-009', 'habit-005', 'user-001', CURDATE() - INTERVAL 6 DAY, 'abandoned', '忘记喝水了', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY),
  ('checkin-010', 'habit-005', 'user-001', CURDATE() - INTERVAL 5 DAY, 'completed', '重新开始', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
  ('checkin-011', 'habit-005', 'user-001', CURDATE() - INTERVAL 4 DAY, 'completed', '状态不错', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),
  ('checkin-012', 'habit-005', 'user-001', CURDATE() - INTERVAL 3 DAY, 'completed', '继续保持', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  ('checkin-013', 'habit-005', 'user-001', CURDATE() - INTERVAL 2 DAY, 'completed', '喝了9杯水', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
  ('checkin-014', 'habit-005', 'user-001', CURDATE() - INTERVAL 1 DAY, 'completed', '达成目标', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
  ('checkin-015', 'habit-005', 'user-001', CURDATE(), 'completed', '今天刚开始', NOW(), NOW());

-- 为用户user-002的habit-007（英语学习）添加打卡记录
INSERT INTO habit_check_in (id, habit_id, user_id, check_in_date, status, notes, created_at, updated_at)
VALUES
  ('checkin-016', 'habit-007', 'user-002', CURDATE() - INTERVAL 12 DAY, 'completed', '学习了30个新单词', NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 12 DAY),
  ('checkin-017', 'habit-007', 'user-002', CURDATE() - INTERVAL 11 DAY, 'completed', '复习了之前的单词', NOW() - INTERVAL 11 DAY, NOW() - INTERVAL 11 DAY),
  ('checkin-018', 'habit-007', 'user-002', CURDATE() - INTERVAL 10 DAY, 'abandoned', '工作太忙，没学习', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),
  ('checkin-019', 'habit-007', 'user-002', CURDATE() - INTERVAL 9 DAY, 'completed', '补上了昨天的任务', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY),
  ('checkin-020', 'habit-007', 'user-002', CURDATE() - INTERVAL 8 DAY, 'completed', '学习状态很好', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),
  ('checkin-021', 'habit-007', 'user-002', CURDATE() - INTERVAL 7 DAY, 'completed', '坚持打卡一周了', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
  ('checkin-022', 'habit-007', 'user-002', CURDATE() - INTERVAL 6 DAY, 'completed', '学习效率高', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY),
  ('checkin-023', 'habit-007', 'user-002', CURDATE() - INTERVAL 5 DAY, 'completed', '掌握了新的学习方法', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
  ('checkin-024', 'habit-007', 'user-002', CURDATE() - INTERVAL 4 DAY, 'completed', '继续努力', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),
  ('checkin-025', 'habit-007', 'user-002', CURDATE() - INTERVAL 3 DAY, 'skipped', '临时有事，明天补上', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  ('checkin-026', 'habit-007', 'user-002', CURDATE() - INTERVAL 2 DAY, 'completed', '补上了前天的任务', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
  ('checkin-027', 'habit-007', 'user-002', CURDATE() - INTERVAL 1 DAY, 'completed', '今天超额完成', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY);

-- 为用户user-003的habit-009（写日记）添加打卡记录
INSERT INTO habit_check_in (id, habit_id, user_id, check_in_date, status, notes, created_at, updated_at)
VALUES
  ('checkin-028', 'habit-009', 'user-003', CURDATE() - INTERVAL 19 DAY, 'completed', '开始记录生活', NOW() - INTERVAL 19 DAY, NOW() - INTERVAL 19 DAY),
  ('checkin-029', 'habit-009', 'user-003', CURDATE() - INTERVAL 18 DAY, 'completed', '记录了工作心得', NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY),
  ('checkin-030', 'habit-009', 'user-003', CURDATE() - INTERVAL 17 DAY, 'completed', '心情不错', NOW() - INTERVAL 17 DAY, NOW() - INTERVAL 17 DAY),
  ('checkin-031', 'habit-009', 'user-003', CURDATE() - INTERVAL 16 DAY, 'completed', '思考了未来规划', NOW() - INTERVAL 16 DAY, NOW() - INTERVAL 16 DAY),
  ('checkin-032', 'habit-009', 'user-003', CURDATE() - INTERVAL 15 DAY, 'completed', '坚持就是胜利', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY),
  ('checkin-033', 'habit-009', 'user-003', CURDATE() - INTERVAL 14 DAY, 'completed', '一周记录总结', NOW() - INTERVAL 14 DAY, NOW() - INTERVAL 14 DAY),
  ('checkin-034', 'habit-009', 'user-003', CURDATE() - INTERVAL 13 DAY, 'completed', '记录了有趣的事情', NOW() - INTERVAL 13 DAY, NOW() - INTERVAL 13 DAY),
  ('checkin-035', 'habit-009', 'user-003', CURDATE() - INTERVAL 12 DAY, 'completed', '写下了目标', NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 12 DAY),
  ('checkin-036', 'habit-009', 'user-003', CURDATE() - INTERVAL 11 DAY, 'completed', '反思了不足之处', NOW() - INTERVAL 11 DAY, NOW() - INTERVAL 11 DAY),
  ('checkin-037', 'habit-009', 'user-003', CURDATE() - INTERVAL 10 DAY, 'abandoned', '太累了，忘记写', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),
  ('checkin-038', 'habit-009', 'user-003', CURDATE() - INTERVAL 9 DAY, 'completed', '重新开始', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY),
  ('checkin-039', 'habit-009', 'user-003', CURDATE() - INTERVAL 8 DAY, 'completed', '记录了学习收获', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),
  ('checkin-040', 'habit-009', 'user-003', CURDATE() - INTERVAL 7 DAY, 'completed', '心情平静', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
  ('checkin-041', 'habit-009', 'user-003', CURDATE() - INTERVAL 6 DAY, 'completed', '工作顺利', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY),
  ('checkin-042', 'habit-009', 'user-003', CURDATE() - INTERVAL 5 DAY, 'completed', '记录了小确幸', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
  ('checkin-043', 'habit-009', 'user-003', CURDATE() - INTERVAL 4 DAY, 'completed', '又坚持了一周', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),
  ('checkin-044', 'habit-009', 'user-003', CURDATE() - INTERVAL 3 DAY, 'completed', '思考人生', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  ('checkin-045', 'habit-009', 'user-003', CURDATE() - INTERVAL 2 DAY, 'completed', '记录生活点滴', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
  ('checkin-046', 'habit-009', 'user-003', CURDATE() - INTERVAL 1 DAY, 'completed', '今天的感悟', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
  ('checkin-047', 'habit-009', 'user-003', CURDATE(), 'completed', '开始新的一天', NOW(), NOW());



-- 3. 为所有新添加的习惯创建连续打卡统计记录
INSERT INTO habit_streak (id, habit_id, user_id, current_streak, longest_streak, total_check_ins, last_check_in_date, updated_at)
VALUES
  ('streak-005', 'habit-005', 'user-001', 5, 5, 9, CURDATE(), NOW()),
  ('streak-006', 'habit-006', 'user-001', 0, 0, 0, NULL, NOW()),
  ('streak-007', 'habit-007', 'user-002', 2, 7, 10, CURDATE() - INTERVAL 1 DAY, NOW()),
  ('streak-008', 'habit-008', 'user-002', 0, 0, 0, NULL, NOW()),
  ('streak-009', 'habit-009', 'user-003', 11, 15, 19, CURDATE(), NOW()),
  ('streak-010', 'habit-010', 'user-003', 0, 0, 0, NULL, NOW());

-- 4. 为一些特定的习惯添加特殊情况的打卡记录（例如自定义频率的周末跑步）
-- 为用户user-002的habit-008（周末跑步）添加打卡记录（周六和周日）
INSERT INTO habit_check_in (id, habit_id, user_id, check_in_date, status, notes, created_at, updated_at)
VALUES
  -- 第一周周末
  ('checkin-089', 'habit-008', 'user-002', CURDATE() - INTERVAL 8 DAY, 'completed', '周六跑了5公里', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),
  ('checkin-090', 'habit-008', 'user-002', CURDATE() - INTERVAL 7 DAY, 'completed', '周日跑了6公里', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
  
  -- 第二周周末
  ('checkin-091', 'habit-008', 'user-002', CURDATE() - INTERVAL 1 DAY, 'completed', '又到周六，坚持跑步', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY);

-- 更新habit-008的连续打卡统计
UPDATE habit_streak
SET 
  current_streak = 1,
  longest_streak = 2,
  total_check_ins = 3,
  last_check_in_date = CURDATE() - INTERVAL 1 DAY,
  updated_at = NOW()
WHERE habit_id = 'habit-008';



-- 5. 添加一些包含不同状态转换的数据
-- 为用户user-003的habit-010（垃圾分类）添加打卡记录，展示状态变化
INSERT INTO habit_check_in (id, habit_id, user_id, check_in_date, status, notes, created_at, updated_at)
VALUES
  ('checkin-093', 'habit-010', 'user-003', CURDATE() - INTERVAL 5 DAY, 'completed', '第一次正确分类', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
  ('checkin-094', 'habit-010', 'user-003', CURDATE() - INTERVAL 4 DAY, 'completed', '已经学会分类了', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),
  ('checkin-095', 'habit-010', 'user-003', CURDATE() - INTERVAL 3 DAY, 'abandoned', '赶时间，忘记分类了', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  ('checkin-096', 'habit-010', 'user-003', CURDATE() - INTERVAL 2 DAY, 'completed', '重新开始', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
  ('checkin-097', 'habit-010', 'user-003', CURDATE() - INTERVAL 1 DAY, 'completed', '养成意识了', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
  ('checkin-098', 'habit-010', 'user-003', CURDATE(), 'completed', '今天也做到了', NOW(), NOW());

-- 更新habit-010的连续打卡统计
UPDATE habit_streak
SET 
  current_streak = 3,
  longest_streak = 2,
  total_check_ins = 5,
  last_check_in_date = CURDATE(),
  updated_at = NOW()
WHERE habit_id = 'habit-010';