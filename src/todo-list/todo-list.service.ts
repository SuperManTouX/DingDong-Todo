import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoList } from './todo-list.entity';
import { User } from '../user/user.entity';
import { Task } from '../todo/todo.entity';
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
   * @param id 清单ID
   * @param userId 用户ID
   * @param targetListId 目标清单ID（可选）
   * @param mode 处理模式：'move'（仅移动任务）或 'moveAndDelete'（移动后删除）或 undefined（默认模式：直接删除）
   * 说明：任务将使用软删除（设置deletedAt为当前时间），清单将从数据库中物理删除
   */
  async delete(id: string, userId: string, targetListId?: string, mode?: 'move' | 'moveAndDelete'): Promise<boolean> {
    await this.findOne(id, userId); // 验证清单存在且用户有权限
    
    // 获取所有相关任务
    const tasks = await this.todoListRepository.manager.find(Task, {
      where: { listId: id, userId },
    });
    
    if (targetListId) {
      // 验证目标清单存在且属于同一用户
      await this.findOne(targetListId, userId);
      
      // 将任务移入目标清单
      for (const task of tasks) {
        task.listId = targetListId;
        
        // 如果模式是 'moveAndDelete'，则在移动后软删除任务
        if (mode === 'moveAndDelete') {
          task.deletedAt = new Date();
        }
        
        await this.todoListRepository.manager.save(task);
      }
    } else {
      // 默认模式：软删除任务并清除listId
      for (const task of tasks) {
        task.deletedAt = new Date();
        task.listId = '';
        await this.todoListRepository.manager.save(task);
      }
    }
    
    // 从数据库中物理删除清单
    const result = await this.todoListRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}