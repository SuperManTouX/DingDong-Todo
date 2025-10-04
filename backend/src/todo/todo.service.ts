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
      where: { userId, isPinned: false },
      relations: ['list', 'group', 'user', 'taskTags'],
      order: {
        updatedAt: 'DESC' // 非置顶任务按更新时间倒序
      }
    });
    
    // 格式化返回数据，确保与前端数据结构一致
    return tasks.map(task => this.formatTaskResponse(task));
  }
  
  // 创建一个带有标签的测试任务，用于演示功能
  async createTestTask(): Promise<any> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    
    const testTask = {
      id: 'task-demo-with-tags',
      title: '演示任务带标签',
      completed: false,
      priority: 2,
      datetimeLocal: now.toISOString(), // 使用ISO 8601格式
      deadline: tomorrow.toISOString(), // 使用ISO 8601格式
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
    
    // 确保日期字段使用ISO 8601格式
    const processedTaskData = {
      ...taskData,
      datetimeLocal: taskData.datetimeLocal ? this.ensureISOString(taskData.datetimeLocal) : null,
      deadline: taskData.deadline ? this.ensureISOString(taskData.deadline) : null,
      reminder_at: taskData.reminder_at ? this.ensureISOString(taskData.reminder_at) : null,
    };
    
    // 明确任务ID
    const taskId = task.id || `task-${Date.now()}`;
    
    const newTask = this.taskRepository.create({
      ...processedTaskData,
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
  
  // 辅助方法：确保日期值是ISO 8601格式的字符串
  private ensureISOString(dateValue: any): string {
    if (!dateValue) return '';
    
    // 如果已经是字符串且看起来像ISO格式，直接返回
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(dateValue)) {
      return dateValue;
    }
    
    // 如果是日期对象或可以转换为日期，转换为ISO字符串
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // 对于其他情况，尝试直接返回原值
    return String(dateValue);
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
      reminder_at: task.reminder_at || null,
      is_reminded: task.is_reminded || false,
      parentId: task.parentId || null,
      depth: task.depth,
      tags: tags,
      listId: task.listId,
      groupId: task.groupId,
      userId: task.userId,
      isPinned: task.isPinned || false,
      pinnedAt: task.pinnedAt || null,
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
    
    // 确保日期字段使用ISO 8601格式
    const processedTaskData = {
      ...taskDataWithoutTags,
      datetimeLocal: taskDataWithoutTags.datetimeLocal !== undefined ? 
        this.ensureISOString(taskDataWithoutTags.datetimeLocal) : existingTask.datetimeLocal,
      deadline: taskDataWithoutTags.deadline !== undefined ? 
        this.ensureISOString(taskDataWithoutTags.deadline) : existingTask.deadline,
      reminder_at: taskDataWithoutTags.reminder_at !== undefined ? 
        this.ensureISOString(taskDataWithoutTags.reminder_at) : existingTask.reminder_at,
    };
    
    Object.assign(existingTask, processedTaskData, { updatedAt: new Date() });
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
  
  /**
   * 获取当前用户的所有置顶任务
   */
  async getPinnedTodos(userId: string, listId: string): Promise<any[]> {
    const tasks = await this.taskRepository.find({
      where: { userId, isPinned: true, listId },
      relations: ['list', 'group', 'user', 'taskTags'],
      order: {
        pinnedAt: 'DESC' // 按置顶时间倒序
      }
    });
    
    // 格式化返回数据
    return tasks.map(task => this.formatTaskResponse(task));
  }
  
  /**
   * 切换任务置顶状态
   */
  async togglePin(id: string, userId: string): Promise<any> {
    // 先验证任务存在且属于当前用户
    const task = await this.findOne(id, userId);
    const existingTask = await this.taskRepository.findOne({ where: { id } });
    
    if (!existingTask) {
      throw new NotFoundException(`任务不存在`);
    }
    
    // 切换置顶状态
    const newPinState = !existingTask.isPinned;
    existingTask.isPinned = newPinState;
    existingTask.pinnedAt = newPinState ? new Date() : null;
    existingTask.updatedAt = new Date();
    
    // 保存当前任务的更新
    const updatedTask = await this.taskRepository.save(existingTask);
    
    // 递归处理所有子任务的置顶状态
    await this.toggleChildTasksPin(id, userId, newPinState);
    
    return this.formatTaskResponse(updatedTask);
  }
  
  /**
   * 递归切换所有子任务的置顶状态
   */
  private async toggleChildTasksPin(parentId: string, userId: string, isPinned: boolean): Promise<void> {
    // 查找当前任务的所有直接子任务
    const childTasks = await this.taskRepository.find({
      where: { parentId, userId },
    });
    
    // 递归处理每个子任务
    for (const childTask of childTasks) {
      // 更新子任务的置顶状态
      childTask.isPinned = isPinned;
      childTask.pinnedAt = isPinned ? new Date() : null;
      childTask.updatedAt = new Date();
      await this.taskRepository.save(childTask);
      
      // 递归处理子任务的子任务
      await this.toggleChildTasksPin(childTask.id, userId, isPinned);
    }
  }
  
  /**
   * 批量更新任务顺序
   */
  async batchUpdateOrder(tasks: any[], userId: string): Promise<void> {
    // 验证所有任务都属于当前用户
    const taskIds = tasks.map(task => task.id);
    const userTasks = await this.taskRepository.find({
      where: { id: In(taskIds), userId },
      select: ['id']
    });
    
    const userTaskIds = new Set(userTasks.map(task => task.id));
    
    for (const task of tasks) {
      if (!userTaskIds.has(task.id)) {
        throw new NotFoundException(`任务 ${task.id} 不存在或您没有权限访问`);
      }
    }
    
    // 批量更新顺序
    for (const task of tasks) {
      await this.taskRepository.update(
        { id: task.id },
        { updatedAt: new Date() }
      );
    }
  }
  
  // 获取所有任务
  async findAll(userId: string): Promise<any[]> {
    return this.findAllByUserId(userId);
  }
  
  // 删除任务（接口别名）
  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.delete(id, userId);
    return { message: '任务已成功删除' };
  }
  
  // 创建演示任务（接口别名）
  async createDemo(): Promise<any> {
    return this.createTestTask();
  }
}