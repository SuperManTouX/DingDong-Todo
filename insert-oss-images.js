// Node.js脚本：将用户头像图片数据插入数据库
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 图片数据
const avatarImages = [
  {
    fileName: "1758975264618.jpg",
    objectKey: "avatars/user-001/1758975264618.jpg",
    url: "https://todo-avatar.oss-cn-beijing.aliyuncs.com/avatars/user-001/1758975264618.jpg",
    lastModified: "2025-09-27T12:15:13.000Z",
    size: 83273
  },
  {
    fileName: "1758975597327.jpg",
    objectKey: "avatars/user-001/1758975597327.jpg",
    url: "https://todo-avatar.oss-cn-beijing.aliyuncs.com/avatars/user-001/1758975597327.jpg",
    lastModified: "2025-09-27T12:19:57.000Z",
    size: 16534
  },
  {
    fileName: "1759123402416.jpg",
    objectKey: "avatars/user-001/1759123402416.jpg",
    url: "https://todo-avatar.oss-cn-beijing.aliyuncs.com/avatars/user-001/1759123402416.jpg",
    lastModified: "2025-09-29T05:23:25.000Z",
    size: 9240
  },
  {
    fileName: "1760865675235.jpg",
    objectKey: "avatars/user-001/1760865675235.jpg",
    url: "https://todo-avatar.oss-cn-beijing.aliyuncs.com/avatars/user-001/1760865675235.jpg",
    lastModified: "2025-10-19T09:21:17.000Z",
    size: 88432
  }
];

const userId = 'user-001';

async function insertAvatarImages() {
  let connection = null;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dingdongtodo'
    });
    
    console.log('数据库连接成功');
    
    // 开始事务
    await connection.beginTransaction();
    
    // 插入oss_files表
    console.log('开始插入oss_files表...');
    const insertedIds = [];
    
    for (const image of avatarImages) {
      // 提取文件类型
      const fileType = image.fileName.split('.').pop().toLowerCase();
      // 格式化时间
      const formattedDate = new Date(image.lastModified).toISOString().slice(0, 19).replace('T', ' ');
      
      const [result] = await connection.execute(
        `INSERT INTO oss_files (file_name, object_key, file_type, file_size, oss_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [image.fileName, image.objectKey, fileType, image.size, image.url, formattedDate, formattedDate]
      );
      
      insertedIds.push(result.insertId);
      console.log(`已插入文件: ${image.fileName}, ID: ${result.insertId}`);
    }
    
    // 插入user_avatars表
    console.log('开始插入user_avatars表...');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    for (let i = 0; i < insertedIds.length; i++) {
      const isDefault = (i === insertedIds.length - 1); // 最后一张设为默认头像
      
      await connection.execute(
        `INSERT INTO user_avatars (file_id, user_id, is_default, created_at)
         VALUES (?, ?, ?, ?)`,
        [insertedIds[i], userId, isDefault, now]
      );
      
      console.log(`已关联头像: 文件ID ${insertedIds[i]}, 用户ID ${userId}, 默认: ${isDefault}`);
    }
    
    // 提交事务
    await connection.commit();
    console.log('\n✅ 所有数据插入成功！');
    console.log(`总计插入 ${avatarImages.length} 张头像图片`);
    console.log(`默认头像设置为: ${avatarImages[avatarImages.length - 1].fileName}`);
    
  } catch (error) {
    // 发生错误时回滚事务
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ 数据插入失败:', error.message);
  } finally {
    // 关闭数据库连接
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行脚本
insertAvatarImages().catch(console.error);