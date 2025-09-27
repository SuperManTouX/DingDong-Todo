import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskGroup } from './task-group.entity';
import { TodoListService } from '../todo-list/todo-list.service';
import { TaskService } from '../todo/todo.service';

@Injectable()
export class TaskGroupService {
  constructor(
    @InjectRepository(TaskGroup) 
    private taskGroupRepository: Repository<TaskGroup>,
    private todoListService: TodoListService,
    @Inject(forwardRef(() => TaskService))
    private taskService: TaskService,
  ) {}

  /**
   * 获取当前用户的所有分组
   */
  async findAllByUserId(userId: string): Promise<TaskGroup[]> {
    return this.taskGroupRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 根据ID获取单个分组
   */
  async findOne(id: string, userId: string): Promise<TaskGroup> {
    const group = await this.taskGroupRepository.findOne({
      where: { id, userId },
    });
    if (!group) {
      throw new NotFoundException(`分组不存在或您没有权限访问`);
    }
    return group;
  }

  /**
   * 创建新分组
   */
  async create(listId: string, groupName: string, userId: string): Promise<TaskGroup> {
    // 验证清单属于当前用户
    await this.todoListService.findOne(listId, userId);
    
    const newGroup = this.taskGroupRepository.create({
      id: `group-${Date.now()}`,
      listId,
      groupName,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.taskGroupRepository.save(newGroup);
  }

  /**
   * 更新分组信息
   */
  async update(id: string, groupName: string, userId: string): Promise<TaskGroup> {
    const group = await this.findOne(id, userId);
    group.groupName = groupName;
    group.updatedAt = new Date();
    return this.taskGroupRepository.save(group);
  }

  /**
   * 删除分组
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // 验证分组存在且用户有权限
    const group = await this.findOne(id, userId);
    
    // 清空相关任务的groupId
    await this.taskService.clearTasksGroupId(id, userId);
    
    // 删除分组
    const result = await this.taskGroupRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}