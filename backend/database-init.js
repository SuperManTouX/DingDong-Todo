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
      multipleStatements: true // 允许执行多条SQL语句
    });
    
    console.log('成功连接到数据库');
    
    // 执行SQL脚本
    console.log('开始执行数据库初始化脚本...');
    await connection.query(sqlContent);
    console.log('数据库初始化完成！');
    
    // 关闭连接
    await connection.end();
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

initDatabase();