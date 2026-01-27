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

-- 2. 为习惯添加基本的打卡记录

-- 为user-001的habit-005添加打卡记录
INSERT INTO habit_check_in (id, habit_id, user_id, check_in_date, status, notes, created_at, updated_at)
VALUES
  ('checkin-048', 'habit-005', 'user-001', CURDATE() - INTERVAL 9 DAY, 'completed', 'Day 1', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY),
  ('checkin-049', 'habit-005', 'user-001', CURDATE() - INTERVAL 8 DAY, 'completed', 'Day 2', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),
  ('checkin-050', 'habit-005', 'user-001', CURDATE() - INTERVAL 7 DAY, 'completed', 'Day 3', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
  ('checkin-051', 'habit-005', 'user-001', CURDATE() - INTERVAL 6 DAY, 'completed', 'Day 4', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY),
  ('checkin-052', 'habit-005', 'user-001', CURDATE() - INTERVAL 5 DAY, 'completed', 'Day 5', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
  ('checkin-053', 'habit-005', 'user-001', CURDATE() - INTERVAL 4 DAY, 'skipped', 'Missed', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),
  ('checkin-054', 'habit-005', 'user-001', CURDATE() - INTERVAL 3 DAY, 'completed', 'Day 6', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  ('checkin-055', 'habit-005', 'user-001', CURDATE() - INTERVAL 2 DAY, 'completed', 'Day 7', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
  ('checkin-056', 'habit-005', 'user-001', CURDATE() - INTERVAL 1 DAY, 'completed', 'Day 8', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
  ('checkin-057', 'habit-005', 'user-001', CURDATE(), 'completed', 'Day 9', NOW(), NOW());

-- 为user-002的habit-007添加打卡记录
INSERT INTO habit_check_in (id, habit_id, user_id, check_in_date, status, notes, created_at, updated_at)
VALUES
  ('checkin-058', 'habit-007', 'user-002', CURDATE() - INTERVAL 12 DAY, 'completed', 'Started', NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 12 DAY),
  ('checkin-059', 'habit-007', 'user-002', CURDATE() - INTERVAL 1 DAY, 'completed', 'Continuing', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY);

-- 为user-003的habit-009添加打卡记录
INSERT INTO habit_check_in (id, habit_id, user_id, check_in_date, status, notes, created_at, updated_at)
VALUES
  ('checkin-060', 'habit-009', 'user-003', CURDATE() - INTERVAL 19 DAY, 'completed', 'First entry', NOW() - INTERVAL 19 DAY, NOW() - INTERVAL 19 DAY),
  ('checkin-061', 'habit-009', 'user-003', CURDATE(), 'completed', 'Latest entry', NOW(), NOW());

-- 3. 创建连续打卡统计记录
INSERT INTO habit_streak (id, habit_id, user_id, current_streak, longest_streak, total_check_ins, last_check_in_date, updated_at)
VALUES
  ('streak-005', 'habit-005', 'user-001', 5, 5, 9, CURDATE(), NOW()),
  ('streak-006', 'habit-006', 'user-001', 0, 0, 0, NULL, NOW()),
  ('streak-007', 'habit-007', 'user-002', 1, 1, 2, CURDATE() - INTERVAL 1 DAY, NOW()),
  ('streak-008', 'habit-008', 'user-002', 0, 0, 0, NULL, NOW()),
  ('streak-009', 'habit-009', 'user-003', 1, 1, 2, CURDATE(), NOW()),
  ('streak-010', 'habit-010', 'user-003', 0, 0, 0, NULL, NOW());