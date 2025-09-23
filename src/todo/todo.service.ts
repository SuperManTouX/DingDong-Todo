import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './todo.entity';

@Injectable()
export class TaskService {
  // 内存映射：任务ID -> 标签数组
  private taskTagsMap: Map<string, string[]> = new Map();
  
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findAll(): Promise<any[]> {
    const tasks = await this.taskRepository.find({
      relations: ['list', 'group', 'user'],
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

  async findOne(id: string): Promise<any | null> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['list', 'group', 'user'],
    });
    
    return task ? this.formatTaskResponse(task) : null;
  }

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
    
    // 在内存映射中保存任务的标签信息
    const tagsArray = Array.isArray(tags) ? tags : [];
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
    // 如果没有，则从内存映射中获取
    // 如果内存映射中也没有，则返回空数组
    let tags: string[] = [];
    if (Array.isArray((task as any).tags)) {
      tags = (task as any).tags;
    } else if (task.id && this.taskTagsMap.has(task.id)) {
      tags = this.taskTagsMap.get(task.id) || [];
    }
    
    return {
      id: task.id,
      title: task.title,
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

  async update(id: string, task: Partial<Task>): Promise<Task | null> {
    const existingTask = await this.findOne(id);
    if (!existingTask) {
      return null;
    }
    Object.assign(existingTask, task, { updatedAt: new Date() });
    return this.taskRepository.save(existingTask);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.taskRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}