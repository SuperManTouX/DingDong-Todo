// database-init.js - 数据库初始化脚本
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function initDatabase() {
  try {
    // 读取SQL文件内容
    const sqlContent = await fs.readFile(path.join(__dirname, 'database-setup.sql'), 'utf8');
    
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '111111',
      multipleStatements: false // 禁用多条语句执行
    });
    
    console.log('成功连接到数据库');
    
    // 简单处理：只执行创建数据库和表的部分，跳过存储过程和触发器
    // 分割SQL语句，忽略DELIMITER和触发器部分
    const statements = sqlContent
      .split(';')
      .filter(statement => {
        const trimmed = statement.trim();
        // 跳过DELIMITER语句和空语句
        return trimmed && !trimmed.startsWith('DELIMITER') && 
               !trimmed.includes('CREATE TRIGGER') && 
               !trimmed.includes('CREATE PROCEDURE');
      })
      .map(statement => statement.trim() + ';');
    
    console.log(`准备执行 ${statements.length} 条SQL语句...`);
    
    // 确保数据库存在
    await connection.query('CREATE DATABASE IF NOT EXISTS todo_db;');
    await connection.query('USE todo_db;');
    
    // 逐条执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      try {
        await connection.query(statements[i]);
        console.log(`已执行第 ${i+1}/${statements.length} 条语句`);
      } catch (err) {
        console.warn(`执行第 ${i+1} 条语句时出错（跳过）:`, err.sqlMessage);
      }
    }
    
    console.log('数据库初始化完成！');
    
    // 关闭连接
    await connection.end();
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

initDatabase();