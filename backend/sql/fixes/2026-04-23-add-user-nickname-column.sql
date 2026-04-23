-- Fix: add missing `nickname` column to `user` table for TypeORM User entity compatibility
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user'
    AND COLUMN_NAME = 'nickname'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `user` ADD COLUMN `nickname` VARCHAR(255) NULL AFTER `password`',
  'SELECT \"nickname column already exists\"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
