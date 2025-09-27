import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './todo.entity';
import { TaskTag } from '../task-tag/task-tag.entity';
import { BinService } from '../bin/bin.service';

@Injectable()
export class TaskService {
  // 内存映射：任务ID -> 标签数组
  private taskTagsMap: Map<string, string[]> = new Map();
  
  constructor(
    @InjectRepository(Task) 
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskTag)
    private taskTagRepository: Repository<TaskTag>,
    @Inject(forwardRef(() => BinService))
    private binService: BinService
  ) {}

  /**
   * 获取当前用户的所有任务
   */
  async findAllByUserId(userId: string): Promise<any[]> {
    const tasks = await this.taskRepository.find({
      where: { userId },
      relations: ['list', 'group', 'user', 'taskTags'],
    });
    
    // 格式化返回数据，确保与前端数据结构一致
    return tasks.map(task => this.formatTaskResponse(task));
  }
  
  // 创建一个带有标签的测试任务，用于演示功能
  async createTestTask(): Promise<any> {
    const testTask = {
      id: 'task-demo-with-tags',
      title: '演示任务带标签',
      completed: false,
      priority: 2,
      datetimeLocal: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
      deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      parentId: null,
      depth: 0,
      tags: ['tag-001', 'tag-002'],
      listId: 'list-001',
      groupId: 'group-001',
      userId: 'user-001'
    };
    
    return this.create(testTask);
  }

  /**
   * 根据ID获取单个任务，确保属于当前用户
   */
  async findOne(id: string, userId: string): Promise<any | null> {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
      relations: ['list', 'group', 'user'],
    });
    
    if (!task) {
      throw new NotFoundException(`任务不存在或您没有权限访问`);
    }
    
    return this.formatTaskResponse(task);
  }

  /**
   * 创建新任务
   */
  async create(task: any): Promise<any> {
    // 提取tags数组并从task对象中移除它，因为Task实体中没有这个字段
    const { tags, ...taskData } = task;
    
    // 明确任务ID
    const taskId = task.id || `task-${Date.now()}`;
    
    const newTask = this.taskRepository.create({
      ...taskData,
      id: taskId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // 保存任务
    const savedTask = await this.taskRepository.save(newTask);
    
    // 处理标签关联
    const tagsArray = Array.isArray(tags) ? tags : [];
    
    // 保存标签关联到数据库
    if (tagsArray.length > 0) {
      // 先删除可能存在的旧关联
      await this.taskTagRepository.delete({ taskId });
      
      // 创建新的关联记录
      const taskTagEntities = tagsArray.map(tagId => 
        this.taskTagRepository.create({
          taskId,
          tagId,
          createdAt: new Date()
        })
      );
      await this.taskTagRepository.save(taskTagEntities);
    }
    
    // 在内存映射中保存任务的标签信息
    this.taskTagsMap.set(taskId, tagsArray);
    
    // 构造返回结果，直接包含标签信息
    return this.formatTaskResponse({
      ...savedTask,
      tags: tagsArray
    });
  }
  
  // 辅助方法：格式化任务响应数据，确保与前端数据结构一致
  private formatTaskResponse(task: any): any {
    // 优先从任务对象中获取tags属性（创建任务时附加的）
    // 其次从数据库关联的taskTags中获取
    // 如果都没有，则从内存映射中获取
    let tags: string[] = [];
    if (Array.isArray((task as any).tags)) {
      tags = (task as any).tags;
    } else if (task.taskTags && Array.isArray(task.taskTags)) {
      // 从数据库关联的taskTags中提取tagId
      tags = task.taskTags.map(taskTag => taskTag.tagId);
    } else if (task.id && this.taskTagsMap.has(task.id)) {
      tags = this.taskTagsMap.get(task.id) || [];
    }
    
    return {
      id: task.id,
      title: task.title,
      text: task.text,
      completed: task.completed,
      priority: task.priority,
      datetimeLocal: task.datetimeLocal,
      deadline: task.deadline,
      parentId: task.parentId || null,
      depth: task.depth,
      tags: tags,
      listId: task.listId,
      groupId: task.groupId,
      userId: task.userId,
      // 注意：根据前端数据结构，createdAt和updatedAt可能不需要返回
    };
  }

  /**
   * 更新任务信息
   */
  async update(id: string, task: Partial<Task>, userId: string): Promise<Task | null> {
    // 先验证任务存在且属于当前用户
    await this.findOne(id, userId);
    
    const existingTask = await this.taskRepository.findOne({ where: { id } });
    if (!existingTask) {
      return null;
    }
    
    // 提取标签信息
    const tags = (task as any).tags;
    
    // 从task对象中移除标签字段，因为Task实体中没有这个字段
    const { tags: _, ...taskDataWithoutTags } = task as any;
    
    Object.assign(existingTask, taskDataWithoutTags, { updatedAt: new Date() });
    const updatedTask = await this.taskRepository.save(existingTask);
    
    // 处理标签关联
    if (Array.isArray(tags)) {
      // 保存标签关联到数据库
      // 先删除可能存在的旧关联
      await this.taskTagRepository.delete({ taskId: id });
      
      // 创建新的关联记录
      if (tags.length > 0) {
        const taskTagEntities = tags.map(tagId => 
          this.taskTagRepository.create({
            taskId: id,
            tagId,
            createdAt: new Date()
          })
        );
        await this.taskTagRepository.save(taskTagEntities);
      }
      
      // 更新内存中的标签映射
      this.taskTagsMap.set(id, tags);
    }
    
    return this.formatTaskResponse(updatedTask);
  }

  /**
   * 删除任务（将任务及其所有嵌套子任务移至回收站）
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // 先验证任务存在且属于当前用户
    await this.findOne(id, userId);
    
    // 递归处理所有嵌套子任务，将它们移至回收站
    await this.moveNestedTasksToBin(id, userId);
    
    return true;
  }
  
  /**
   * 批量清空指定groupId的所有任务的groupId字段
   */
  async clearTasksGroupId(groupId: string, userId: string): Promise<void> {
    // 查找所有属于该分组的任务
    const tasks = await this.taskRepository.find({
      where: { groupId, userId },
    });
    
    // 批量更新任务的groupId为undefined
    for (const task of tasks) {
      task.groupId = undefined;
      task.updatedAt = new Date();
    }
    
    // 批量保存更新后的任务
    if (tasks.length > 0) {
      await this.taskRepository.save(tasks);
    }
  }
  private async moveNestedTasksToBin(taskId: string, userId: string): Promise<void> {
    // 查找当前任务的所有直接子任务
    const childTasks = await this.taskRepository.find({
      where: { parentId: taskId, userId },
    });
    
    // 递归处理每个子任务
    for (const childTask of childTasks) {
      await this.moveNestedTasksToBin(childTask.id, userId);
    }
    
    // 获取当前任务的完整信息
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    
    if (task) {
      // 将任务添加到回收站
      await this.binService.addToBin(task);
      
      // 删除任务的标签关联
      await this.taskTagRepository.delete({ taskId });
      
      // 从任务表中删除
      await this.taskRepository.delete(taskId);
      
      // 删除内存中的标签映射
      this.taskTagsMap.delete(taskId);
    }
  }
}