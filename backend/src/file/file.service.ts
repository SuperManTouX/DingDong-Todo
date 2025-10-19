import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OssFile } from './oss-file.entity';
import { UserAvatar } from './user-avatar.entity';
import { OssConfig } from '../config/oss.config';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(OssFile) private ossFileRepository: Repository<OssFile>,
    @InjectRepository(UserAvatar) private userAvatarRepository: Repository<UserAvatar>,
    private ossConfig: OssConfig,
  ) {}

  /**
   * 获取用户的所有历史头像
   * @param userId 用户ID
   * @returns 用户头像列表
   */
  async getUserAvatars(userId: string): Promise<OssFile[]> {
    const userAvatars = await this.userAvatarRepository.find({
      where: { userId },
      relations: ['file'],
      order: { createdAt: 'DESC' }, // 按创建时间倒序排列，最新的在前
    });

    // 提取头像文件信息
    return userAvatars.map(avatar => avatar.file);
  }

  /**
   * 获取用户的默认头像
   * @param userId 用户ID
   * @returns 默认头像文件或null
   */
  async getDefaultUserAvatar(userId: string): Promise<OssFile | null> {
    const userAvatar = await this.userAvatarRepository.findOne({
      where: { userId, isDefault: true },
      relations: ['file'],
    });

    return userAvatar ? userAvatar.file : null;
  }

  /**
   * 保存用户头像关联关系
   * @param userId 用户ID
   * @param fileId 文件ID
   * @param isDefault 是否为默认头像
   * @returns 创建的用户头像关联
   */
  async saveUserAvatar(userId: string, fileId: number, isDefault: boolean = false): Promise<UserAvatar> {
    // 如果设为默认头像，先将该用户其他头像设为非默认
    if (isDefault) {
      await this.userAvatarRepository.update({ userId }, { isDefault: false });
    }

    const userAvatar = this.userAvatarRepository.create({
      userId,
      fileId,
      isDefault,
    });

    return this.userAvatarRepository.save(userAvatar);
  }

  /**
   * 创建新的OSS文件记录
   * @param fileName 文件名
   * @param objectKey OSS对象键
   * @param fileSize 文件大小
   * @param ossUrl OSS文件URL
   * @returns 创建的OSS文件记录
   */
  async createOssFile(fileName: string, objectKey: string, fileSize: number = 0, ossUrl: string): Promise<OssFile> {
    // 从文件名提取文件类型
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    
    const ossFile = this.ossFileRepository.create({
      fileName,
      objectKey,
      fileType: fileExtension, // 设置文件类型，从文件名获取扩展名
      fileSize,
      ossUrl,
      createdAt: new Date(),
    });

    return this.ossFileRepository.save(ossFile);
  }

  /**
   * 删除用户历史头像
   * @param userId 用户ID
   * @param objectKey OSS对象键
   * @returns 删除结果
   */
  async deleteUserAvatar(userId: string, objectKey: string): Promise<boolean> {
    try {
      // 查找对应的文件记录
      const ossFile = await this.ossFileRepository.findOne({ where: { objectKey } });
      if (!ossFile) {
        throw new NotFoundException('文件不存在');
      }

      // 验证文件是否属于该用户
      const userAvatar = await this.userAvatarRepository.findOne({
        where: { userId, fileId: ossFile.id },
        relations: ['file'],
      });

      if (!userAvatar) {
        throw new NotFoundException('您无权删除此头像');
      }

      // 获取OSS临时凭证
      const credentials = await this.ossConfig.getStsCredentials(userId, 'delete-avatar', 3600);
      const ossClient = this.ossConfig.createOssClient(credentials);

      if (!ossClient) {
        console.error('创建OSS客户端失败');
        throw new Error('OSS客户端创建失败');
      }

      // 从OSS删除文件
      await ossClient.delete(objectKey);
      console.log(`成功从OSS删除文件: ${objectKey}`);

      // 从数据库删除用户头像关联
      await this.userAvatarRepository.remove(userAvatar);
      console.log(`成功删除用户头像关联: userId=${userId}, fileId=${ossFile.id}`);

      // 从数据库删除文件记录
      await this.ossFileRepository.remove(ossFile);
      console.log(`成功删除文件记录: id=${ossFile.id}, objectKey=${objectKey}`);

      return true;
    } catch (error) {
      console.error('删除用户头像失败:', error);
      throw error;
    }
  }
}