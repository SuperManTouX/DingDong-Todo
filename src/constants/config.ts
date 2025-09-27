// API相关配置
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 上传文件大小限制（5MB）
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

// 支持的图片类型
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

// 默认头像相关配置
export const AVATAR_CONFIG = {
  colors: [
    '#1890ff', // 蓝色
    '#52c41a', // 绿色
    '#faad14', // 橙色
    '#f5222d', // 红色
    '#722ed1', // 紫色
    '#fa541c', // 橘红
    '#13c2c2', // 青色
    '#eb2f96', // 粉色
    '#a0d911', // 黄绿
    '#fa8c16'  // 深橙
  ],
  fontSize: '24px',
  width: '40px',
  height: '40px'
};

// 响应状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};