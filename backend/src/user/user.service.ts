import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { log } from 'node:console';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 注册新用户
   */
  async register(username: string, email: string, password: string, bio?: string): Promise<User> {
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
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
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
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 如果更新了密码，需要重新加密
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData, { updatedAt: new Date() });
    return this.userRepository.save(user);
  }

  /**
   * 更新用户头像
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.avatar = avatarUrl;
    user.updatedAt = new Date();
    
    return this.userRepository.save(user);
  }
}