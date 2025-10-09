import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoList } from './todo-list.entity';
import { User } from '../user/user.entity';

@Injectable()
export class TodoListService {
  constructor(
    @InjectRepository(TodoList) 
    private todoListRepository: Repository<TodoList>,
  ) {}

  /**
   * 获取当前用户的所有清单
   */
  async findAllByUserId(userId: string): Promise<TodoList[]> {
    return this.todoListRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 根据ID获取单个清单
   */
  async findOne(id: string, userId: string): Promise<TodoList> {
    const list = await this.todoListRepository.findOne({
      where: { id, userId },
    });
    if (!list) {
      throw new NotFoundException(`清单不存在或您没有权限访问`);
    }
    return list;
  }

  /**
   * 创建新清单
   */
  async create(createData: { title: string; emoji?: string; color?: string }, userId: string): Promise<TodoList> {
    const newList = this.todoListRepository.create({
      id: `todolist-${Date.now()}`,
      title: createData.title,
      emoji: createData.emoji,
      color: createData.color,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.todoListRepository.save(newList);
  }

  /**
   * 更新清单信息
   */
  async update(id: string, updateData: { title?: string; emoji?: string; color?: string }, userId: string): Promise<TodoList> {
    const list = await this.findOne(id, userId);
    if (updateData.title !== undefined) {
      list.title = updateData.title;
    }
    if (updateData.emoji !== undefined) {
      list.emoji = updateData.emoji;
    }
    if (updateData.color !== undefined) {
      list.color = updateData.color;
    }
    list.updatedAt = new Date();
    return this.todoListRepository.save(list);
  }

  /**
   * 删除清单
   */
  async delete(id: string, userId: string): Promise<boolean> {
    await this.findOne(id, userId); // 验证清单存在且用户有权限
    const result = await this.todoListRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}