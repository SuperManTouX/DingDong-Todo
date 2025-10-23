-- 养成习惯打卡功能数据表
USE todo_db;

-- 1. 创建习惯表（存储用户的习惯设置）
CREATE TABLE IF NOT EXISTS habit (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT '习惯名称',
  description TEXT NULL COMMENT '习惯描述',
  frequency VARCHAR(50) NOT NULL COMMENT '打卡频率：daily（每日）, weekly（每周）, custom（自定义）',
  custom_frequency_days VARCHAR(100) NULL COMMENT '自定义频率的日期（例如：1,3,5表示周一、三、五）',
  start_date DATE NOT NULL COMMENT '开始日期',
  target_days INT NOT NULL DEFAULT 30 COMMENT '目标坚持天数',
  reminder_time TIME NULL COMMENT '提醒时间',
  is_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否启用提醒',
  color VARCHAR(255) NULL DEFAULT '#3b82f6' COMMENT '习惯颜色',
  emoji VARCHAR(10) NULL COMMENT '习惯表情符号',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已删除',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  INDEX idx_habit_user_id (user_id),
  INDEX idx_habit_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 创建打卡记录表（记录每日打卡行为）
CREATE TABLE IF NOT EXISTS habit_check_in (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  habit_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  check_in_date DATE NOT NULL COMMENT '打卡日期',
  status VARCHAR(20) NOT NULL COMMENT '状态：completed（已完成）, skipped（跳过）, abandoned（放弃）',
  notes TEXT NULL COMMENT '打卡备注',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habit(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  UNIQUE KEY idx_habit_date (habit_id, check_in_date),
  INDEX idx_habit_check_in_user_id (user_id),
  INDEX idx_habit_check_in_date (check_in_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 创建连续打卡记录表（跟踪连续打卡统计）
CREATE TABLE IF NOT EXISTS habit_streak (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  habit_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  current_streak INT NOT NULL DEFAULT 0 COMMENT '当前连续天数',
  longest_streak INT NOT NULL DEFAULT 0 COMMENT '最长连续天数',
  total_check_ins INT NOT NULL DEFAULT 0 COMMENT '总打卡次数',
  last_check_in_date DATE NULL COMMENT '最后一次打卡日期',
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habit(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  UNIQUE KEY idx_habit_streak (habit_id),
  INDEX idx_habit_streak_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入示例数据
-- 为用户1创建几个示例习惯
INSERT INTO habit (id, user_id, title, description, frequency, start_date, target_days, reminder_time, is_reminder_enabled, color, emoji, created_at, updated_at)
VALUES
  ('habit-001', 'user-001', '每日阅读', '每天阅读至少30分钟', 'daily', '2024-01-15', 30, '20:00:00', TRUE, '#3b82f6', '📚', NOW(), NOW()),
  ('habit-002', 'user-001', '健身锻炼', '每周一、三、五进行健身', 'custom', '2024-01-10', 60, '07:00:00', TRUE, '#f5222d', '💪', '1,3,5', NOW(), NOW()),
  ('habit-003', 'user-002', '早起打卡', '每天早上7点前起床', 'daily', '2024-01-05', 21, '07:00:00', TRUE, '#faad14', '🌅', NOW(), NOW()),
  ('habit-004', 'user-003', '冥想练习', '每天冥想10分钟', 'daily', '2024-01-12', 30, '21:00:00', TRUE, '#52c41a', '🧘', NOW(), NOW());

-- 插入一些示例打卡记录
INSERT INTO habit_check_in (id, habit_id, user_id, check_in_date, status, notes, created_at, updated_at)
VALUES
  ('checkin-001', 'habit-001', 'user-001', CURDATE() - INTERVAL 2 DAY, 'completed', '读完了第三章', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
  ('checkin-002', 'habit-001', 'user-001', CURDATE() - INTERVAL 1 DAY, 'completed', '读完了第四章', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
  ('checkin-003', 'habit-003', 'user-002', CURDATE() - INTERVAL 3 DAY, 'completed', '6:30起床', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  ('checkin-004', 'habit-003', 'user-002', CURDATE() - INTERVAL 2 DAY, 'completed', '6:45起床', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
  ('checkin-005', 'habit-003', 'user-002', CURDATE() - INTERVAL 1 DAY, 'abandoned', '睡过头了', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY);

-- 插入连续打卡统计数据
INSERT INTO habit_streak (id, habit_id, user_id, current_streak, longest_streak, total_check_ins, last_check_in_date, updated_at)
VALUES
  ('streak-001', 'habit-001', 'user-001', 2, 2, 2, CURDATE() - INTERVAL 1 DAY, NOW()),
  ('streak-002', 'habit-002', 'user-001', 0, 0, 0, NULL, NOW()),
  ('streak-003', 'habit-003', 'user-002', 0, 2, 2, CURDATE() - INTERVAL 3 DAY, NOW()),
  ('streak-004', 'habit-004', 'user-003', 0, 0, 0, NULL, NOW());

-- 创建存储过程来更新连续打卡统计
DELIMITER //
CREATE PROCEDURE update_habit_streak(IN p_habit_id VARCHAR(36), IN p_user_id VARCHAR(36), IN p_check_in_date DATE, IN p_status VARCHAR(20))
BEGIN
  DECLARE v_current_streak INT DEFAULT 0;
  DECLARE v_longest_streak INT DEFAULT 0;
  DECLARE v_total_check_ins INT DEFAULT 0;
  DECLARE v_last_check_in DATE DEFAULT NULL;
  
  -- 获取当前统计数据
  SELECT current_streak, longest_streak, total_check_ins, last_check_in_date
  INTO v_current_streak, v_longest_streak, v_total_check_ins, v_last_check_in
  FROM habit_streak
  WHERE habit_id = p_habit_id
  LIMIT 1;
  
  -- 如果是新的习惯记录，创建新的统计记录
  IF v_current_streak IS NULL THEN
    INSERT INTO habit_streak (id, habit_id, user_id, current_streak, longest_streak, total_check_ins, last_check_in_date, updated_at)
    VALUES (UUID(), p_habit_id, p_user_id, 0, 0, 0, NULL, NOW());
    SET v_current_streak = 0;
    SET v_longest_streak = 0;
    SET v_total_check_ins = 0;
  END IF;
  
  -- 根据打卡状态更新统计数据
  IF p_status = 'completed' THEN
    -- 增加总打卡次数
    SET v_total_check_ins = v_total_check_ins + 1;
    
    -- 检查是否是连续打卡
    IF v_last_check_in IS NOT NULL AND DATEDIFF(p_check_in_date, v_last_check_in) = 1 THEN
      -- 连续打卡，增加连续天数
      SET v_current_streak = v_current_streak + 1;
    ELSE
      -- 中断或首次打卡，重置连续天数
      SET v_current_streak = 1;
    END IF;
    
    -- 更新最长连续天数
    IF v_current_streak > v_longest_streak THEN
      SET v_longest_streak = v_current_streak;
    END IF;
    
    -- 更新最后打卡日期
    SET v_last_check_in = p_check_in_date;
  ELSEIF p_status = 'abandoned' THEN
    -- 放弃打卡，重置连续天数
    SET v_current_streak = 0;
  END IF;
  
  -- 更新统计记录
  UPDATE habit_streak
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    total_check_ins = v_total_check_ins,
    last_check_in_date = v_last_check_in,
    updated_at = NOW()
  WHERE habit_id = p_habit_id;
END //
DELIMITER ;

-- 创建触发器，在插入打卡记录后自动更新连续打卡统计
DELIMITER //
CREATE TRIGGER after_habit_check_in_insert
AFTER INSERT ON habit_check_in
FOR EACH ROW
BEGIN
  CALL update_habit_streak(NEW.habit_id, NEW.user_id, NEW.check_in_date, NEW.status);
END //
DELIMITER ;

-- 创建触发器，在更新打卡记录后自动更新连续打卡统计
DELIMITER //
CREATE TRIGGER after_habit_check_in_update
AFTER UPDATE ON habit_check_in
FOR EACH ROW
BEGIN
  CALL update_habit_streak(NEW.habit_id, NEW.user_id, NEW.check_in_date, NEW.status);
END //
DELIMITER ;