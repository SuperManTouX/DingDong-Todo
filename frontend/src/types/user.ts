export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar: string; // 用户头像URL
  nickname?: string; // 用户昵称
  // 可以添加其他用户信息字段
}