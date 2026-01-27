import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { FileService } from '../file/file.service';
import { log } from 'node:console';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private fileService: FileService,
  ) {}

  /**
   * 注册新用户
   */
  async register(username: string, email: string, password: string, bio?: string, nickname?: string): Promise<User> {
    // 检查用户名是否已存在
    const existingUsername = await this.userRepository.findOneBy({ username });
    if (existingUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findOneBy({ email });
    if (existingEmail) {
      throw new ConflictException('邮箱已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser = this.userRepository.create({
      id: `user-${Date.now()}`,
      username,
      email,
      password: hashedPassword,
      bio,
      nickname,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.userRepository.save(newUser);
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: string): Promise<{ user: User | null; avatarHistory: any[] } | null> {
    const user = await this.userRepository.findOneBy({ id });
    
    if (!user) {
      return null;
    }

    // 获取用户的历史头像
    const avatarHistory = await this.fileService.getUserAvatars(id);
    
    // 过滤掉当前用户正在使用的头像（只返回历史头像，不包括当前头像）
    const filteredHistory = avatarHistory.filter(avatar => {
      // 移除URL中的查询参数进行比较
      const cleanUserAvatarUrl = user.avatar?.split('?')[0] || '';
      const cleanHistoryAvatarUrl = avatar.ossUrl?.split('?')[0] || '';
      return cleanUserAvatarUrl !== cleanHistoryAvatarUrl;
    });

    return {
      user,
      avatarHistory: filteredHistory.map(avatar => ({
        fileName: avatar.fileName,
        objectKey: avatar.objectKey,
        url: avatar.ossUrl,
        createdAt: avatar.createdAt,
        fileSize: avatar.fileSize,
      })),
    };
  }

  /**
   * 验证用户密码
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    log('validateUser', password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const result = await this.findById(id);
    if (!result || !result.user) {
      throw new NotFoundException('用户不存在');
    }

    const user = result.user;
    // 如果更新了密码，需要重新加密
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData, { updatedAt: new Date() });
    return this.userRepository.save(user);
  }

  /**
   * 更新用户头像并保存到历史记录
   * 1. 创建OSS文件记录到oss_files表
   * 2. 创建用户头像关联到user_avatars表
   * 3. 更新用户当前头像URL
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    console.log(`开始更新用户头像 - userId: ${userId}`);
    
    // 验证用户存在
    const result = await this.findById(userId);
    if (!result || !result.user) {
      console.error(`用户不存在 - userId: ${userId}`);
      throw new NotFoundException('用户不存在');
    }

    const user = result.user;
    
    try {
      // 从URL中提取objectKey和文件名
      // 处理不同格式的URL
      let objectKey: string;
      let fileName: string;
      
      // URL格式可能为: 
      // 1. https://bucket.region.aliyuncs.com/avatars/user-xxx/timestamp.ext
      // 2. https://bucket.region.aliyuncs.com/avatars/user-xxx/timestamp.ext?x-oss-process=...
      // 3. 可能包含其他参数或路径结构
      const cleanUrl = avatarUrl.split('?')[0]; // 移除查询参数
      const urlParts = cleanUrl.split('/');
      
      // 提取objectKey（从avatars开始的部分）
      const avatarIndex = urlParts.findIndex(part => part === 'avatars');
      if (avatarIndex >= 0) {
        // 从avatars开始构建objectKey
        objectKey = urlParts.slice(avatarIndex).join('/');
      } else {
        // 备用方案：使用最后几部分
        objectKey = urlParts.slice(-3).join('/'); // 尝试获取最后3部分
      }
      
      // 从objectKey中提取文件名
      fileName = objectKey.split('/').pop() || `avatar_${Date.now()}.jpg`;
      
      console.log(`解析头像信息 - objectKey: ${objectKey}, fileName: ${fileName}`);
      
      // 步骤1: 创建新的OSS文件记录到oss_files表
      console.log('创建OSS文件记录...');
      // 调用createOssFile时会自动从文件名提取文件类型
      const newOssFile = await this.fileService.createOssFile(fileName, objectKey, 0, avatarUrl);
      console.log(`OSS文件记录创建成功 - fileId: ${newOssFile.id}`);
      
      // 步骤2: 创建用户头像关联到user_avatars表，并设为默认头像
      console.log('创建用户头像关联记录...');
      await this.fileService.saveUserAvatar(userId, newOssFile.id, true);
      console.log('用户头像关联记录创建成功');
      
      // 步骤3: 更新用户当前头像URL
      user.avatar = avatarUrl;
      user.updatedAt = new Date();
      
      const updatedUser = await this.userRepository.save(user);
      console.log(`用户头像更新完成 - userId: ${userId}`);
      
      return updatedUser;
    } catch (error) {
      console.error('更新头像并保存到历史记录失败:', error);
      
      // 即使保存历史记录失败，也要更新用户头像URL作为备选方案
      try {
        console.log('尝试仅更新用户头像URL...');
        user.avatar = avatarUrl;
        user.updatedAt = new Date();
        return this.userRepository.save(user);
      } catch (updateError) {
        console.error('更新用户头像URL也失败:', updateError);
        throw new Error('更新头像失败，请稍后重试');
      }
    }
  }
}