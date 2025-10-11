import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoList } from './todo-list.entity';
import { User } from '../user/user.entity';
import { Task } from '../todo/todo.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class TodoListService {
  constructor(
    @InjectRepository(TodoList) 
    private todoListRepository: Repository<TodoList>,
    @Inject(EventEmitter2)
    private eventEmitter: EventEmitter2,
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
    const savedList = await this.todoListRepository.save(newList);
    
    // 触发清单创建事件
    this.eventEmitter.emit('list.updated', {
      type: 'create',
      listId: savedList.id,
      userId,
      timestamp: new Date(),
      list: savedList
    });
    
    return savedList;
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
    const updatedList = await this.todoListRepository.save(list);
    
    // 触发清单更新事件
    this.eventEmitter.emit('list.updated', {
      type: 'update',
      listId: id,
      userId,
      timestamp: new Date(),
      list: updatedList
    });
    
    return updatedList;
  }

  /**
   * 删除清单
   */
  async delete(id: string, userId: string, targetListId?: string, mode?: 'move' | 'delete'): Promise<boolean> {
    // 验证清单是否属于当前用户
    const list = await this.findOne(id, userId);
    
    // 获取清单下的所有任务
    const tasks = await this.todoListRepository.manager.find(Task, {
      where: { listId: id },
    });
    
    // 根据模式处理任务
    if (mode === 'move' && targetListId) {
      // 移动模式：将任务移动到目标清单并清除groupId
      for (const task of tasks) {
        task.listId = targetListId;
        task.groupId = null; // 清除任务的groupId
        await this.todoListRepository.manager.save(task);
      }
    } else if (mode === 'delete') {
      // 删除模式：将任务标记为已删除
      for (const task of tasks) {
        task.deletedAt = new Date();
        // 如果提供了targetListId，将任务移动到目标清单
        if (targetListId) {
          task.listId = targetListId;
          task.groupId = null; // 清除任务的groupId
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
    
    // 触发清单删除事件
    this.eventEmitter.emit('list.updated', {
      type: 'delete',
      listId: id,
      targetListId: targetListId,
      mode: mode,
      userId,
      timestamp: new Date(),
    });
    
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}