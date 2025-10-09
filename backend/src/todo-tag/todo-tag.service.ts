import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoTag } from './todo-tag.entity';
import { TaskTag } from '../task-tag/task-tag.entity';

@Injectable()
export class TodoTagService {
  constructor(
    @InjectRepository(TodoTag) 
    private todoTagRepository: Repository<TodoTag>,
    @InjectRepository(TaskTag) 
    private taskTagRepository: Repository<TaskTag>,
  ) {}

  /**
   * 获取当前用户的所有标签
   */
  async findAllByUserId(userId: string): Promise<TodoTag[]> {
    return this.todoTagRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 根据ID获取单个标签
   */
  async findOne(id: string, userId: string): Promise<TodoTag> {
    const tag = await this.todoTagRepository.findOne({
      where: { id, userId },
    });
    if (!tag) {
      throw new NotFoundException(`标签不存在或您没有权限访问`);
    }
    return tag;
  }

  /**
   * 创建新标签
   */
  async create(name: string, userId: string, parentId?: string, color?: string): Promise<TodoTag> {
    if (parentId) {
      // 验证父标签属于当前用户
      await this.findOne(parentId, userId);
    }
    
    const newTag = this.todoTagRepository.create({
      id: `tag-${Date.now()}`,
      name,
      parentId,
      userId,
      color: color || '#1890ff',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.todoTagRepository.save(newTag);
  }

  /**
   * 更新标签信息
   */
  async update(id: string, updates: { name?: string; color?: string }, userId: string): Promise<TodoTag> {
    const tag = await this.findOne(id, userId);
    
    if (updates.name !== undefined) {
      tag.name = updates.name;
    }
    
    if (updates.color !== undefined) {
      tag.color = updates.color;
    }
    
    tag.updatedAt = new Date();
    return this.todoTagRepository.save(tag);
  }

  /**
   * 删除标签
   */
  async delete(id: string, userId: string): Promise<boolean> {
    await this.findOne(id, userId); // 验证标签存在且用户有权限
    
    // 先删除task_tag关系表中的相关记录
    await this.taskTagRepository.delete({ tagId: id });
    
    // 检查是否有子标签，如果有，先将子标签的parentId设置为null
    const childTags = await this.todoTagRepository.find({
      where: { parentId: id, userId },
    });
    
    for (const childTag of childTags) {
      childTag.parentId = null;
      await this.todoTagRepository.save(childTag);
    }
    
    const result = await this.todoTagRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}