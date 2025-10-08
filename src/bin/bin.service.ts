import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { TaskService } from '../todo/todo.service';

@Injectable()
export class BinService {
  constructor(
    @Inject(forwardRef(() => TaskService))
    private taskService: TaskService
  ) {}

  /**
   * 将任务添加到回收站（现在通过TaskService的delete方法实现软删除）
   */
  async addToBin(task: any): Promise<any> {
    // 这个方法现在不再直接使用，而是通过TaskService的delete方法实现软删除
    // 保留该方法以保持API兼容性
    await this.taskService.delete(task.id, task.userId);
    return { ...task, deletedAt: new Date() };
  }

  /**
   * 从回收站恢复任务（委托给TaskService的restore方法）
   */
  async restoreFromBin(id: string, userId: string): Promise<any> {
    return this.taskService.restore(id, userId);
  }
  
  /**
   * 从回收站永久删除任务
   * 委托给TaskService的permanentlyDelete方法实现物理删除
   */
  async permanentlyDelete(id: string, userId: string): Promise<boolean> {
    return this.taskService.permanentlyDelete(id, userId);
  }

  /**
   * 获取用户的所有回收站内容（委托给TaskService的getTasksByType方法）
   */
  async findAllByUserId(userId: string): Promise<any[]> {
    return this.taskService.getTasksByType(userId, 'bin');
  }

  /**
   * 获取单个回收站项目（委托给TaskService）
   */
  async findOne(id: string, userId: string): Promise<any> {
    // 在软删除机制下，直接使用TaskService查找已删除的任务
    try {
      // 尝试查找已删除的任务
      const tasks = await this.taskService.getTasksByType(userId, 'bin');
      const binItem = tasks.find(task => task.id === id);
      
      if (!binItem) {
        throw new NotFoundException('回收站中未找到该项目或您没有权限访问');
      }
      
      return binItem;
    } catch (error) {
      throw new NotFoundException('回收站中未找到该项目或您没有权限访问');
    }
  }

  /**
   * 清空回收站（物理删除所有已删除任务）
   */
  async emptyBin(userId: string): Promise<void> {
    // 获取用户的所有已删除任务
    const binTasks = await this.findAllByUserId(userId);
    
    // 对每个已删除任务执行永久删除操作
    for (const task of binTasks) {
      await this.permanentlyDelete(task.id, userId);
    }
  }
}