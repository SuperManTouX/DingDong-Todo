import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bin } from './bin.entity';
import { Task } from '../todo/todo.entity';
import { TaskService } from '../todo/todo.service';

@Injectable()
export class BinService {
  constructor(
    @InjectRepository(Bin) 
    private binRepository: Repository<Bin>,
    @Inject(forwardRef(() => TaskService))
    private taskService: TaskService
  ) {}

  /**
   * 将任务添加到回收站
   */
  async addToBin(task: Task): Promise<Bin> {
    const binItem = this.binRepository.create({
      ...task,
      deletedAt: new Date()
    });
    
    return this.binRepository.save(binItem);
  }

  /**
   * 从回收站恢复任务及其所有层级子任务
   */
  async restoreFromBin(id: string, userId: string): Promise<Task> {
    // 验证任务存在且属于当前用户
    const binItem = await this.findOne(id, userId);
    
    // 创建一个映射来保存原始ID到新ID的对应关系，以及原始父ID信息
    const idMap = new Map<string, { newId: string; originalParentId: string | null }>();
    
    // 递归恢复当前任务及其所有子任务
    const restoredTask = await this.restoreNestedTasksFromBin(binItem.id, userId, idMap);
    
    // 更新恢复任务之间的父子关系
    await this.updateRestoredTasksParentIds(idMap, userId);
    
    return restoredTask;
  }
  
  /**
   * 递归从回收站恢复任务及其所有子任务
   * @param id 当前要恢复的回收站项目ID
   * @param userId 用户ID
   * @param idMap 原始ID到新ID和原始父ID的映射
   * @returns 恢复的任务对象
   */
  private async restoreNestedTasksFromBin(id: string, userId: string, idMap: Map<string, { newId: string; originalParentId: string | null }>): Promise<Task> {
    // 获取当前回收站项目
    const binItem = await this.findOne(id, userId);
    
    // 先保存原始父ID信息，因为后面会删除回收站项目
    const originalParentId = binItem.parentId;
    
    // 查找当前任务的所有直接子任务
    const childBinItems = await this.binRepository.find({
      where: {
        parentId: binItem.id,
        userId
      }
    });
    
    // 递归恢复每个子任务
    for (const childBinItem of childBinItems) {
      await this.restoreNestedTasksFromBin(childBinItem.id, userId, idMap);
    }
    
    // 从回收站删除当前项目
    await this.binRepository.delete(id);
    
    // 创建新任务，保留原始属性但生成新ID
    const newTaskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const restoredTask = {
      id: newTaskId,
      title: binItem.title,
      text: binItem.text,
      completed: binItem.completed,
      priority: binItem.priority,
      datetimeLocal: binItem.datetimeLocal,
      deadline: binItem.deadline,
      parentId: null, // 暂时设为null，后续会更新
      depth: binItem.depth,
      listId: binItem.listId,
      groupId: binItem.groupId,
      userId: binItem.userId,
      isPinned: binItem.isPinned || false,
      pinnedAt: binItem.pinnedAt || null,
      tags: [] // 标签需要单独处理
    };
    
    // 创建恢复的任务
    const createdTask = await this.taskService.create(restoredTask);
    
    // 保存原始ID到新ID和原始父ID的映射
    idMap.set(binItem.id, { newId: newTaskId, originalParentId });
    
    return createdTask;
  }
  
  /**
   * 更新恢复任务之间的父子关系
   * @param idMap 原始ID到新ID和原始父ID的映射
   * @param userId 用户ID
   */
  private async updateRestoredTasksParentIds(idMap: Map<string, { newId: string; originalParentId: string | null }>, userId: string): Promise<void> {
    // 遍历所有恢复的任务
    for (const [originalId, { newId, originalParentId }] of idMap.entries()) {
      try {
        if (originalParentId) {
          let parentTaskId: string | null = null;
          
          // 首先检查父任务是否也在当前恢复的任务集合中
          if (idMap.has(originalParentId)) {
            parentTaskId = idMap.get(originalParentId)?.newId || null;
          } else {
            // 如果父任务不在当前恢复的任务集合中，直接使用原始的parentId
            // 先验证用户有权限访问该父任务
            try {
              const parentTask = await this.taskService.findOne(originalParentId, userId);
              if (parentTask) {
                parentTaskId = originalParentId;
              }
            } catch (error) {
              // 父任务不存在或用户无权限访问，不更新父ID
              console.warn(`无法访问父任务 ${originalParentId}，将保持任务 ${newId} 为顶级任务`);
            }
          }
          
          if (parentTaskId) {
            // 使用taskService的update方法来更新父ID
            await this.taskService.update(newId, { parentId: parentTaskId }, userId);
          }
        }
      } catch (error) {
        // 处理可能的错误，但不中断整个过程
        console.error(`更新任务 ${newId} 的父ID时出错:`, error);
      }
    }
  }

  /**
   * 从回收站永久删除任务
   */
  async permanentlyDelete(id: string, userId: string): Promise<boolean> {
    await this.findOne(id, userId); // 验证任务存在且用户有权限
    const result = await this.binRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  /**
   * 获取用户的所有回收站内容
   */
  async findAllByUserId(userId: string): Promise<Bin[]> {
    return this.binRepository.find({
      where: { userId },
      order: { deletedAt: 'DESC' }
    });
  }

  /**
   * 获取单个回收站项目
   */
  async findOne(id: string, userId: string): Promise<Bin> {
    const binItem = await this.binRepository.findOne({ where: { id, userId } });
    if (!binItem) {
      throw new NotFoundException('回收站中未找到该项目或您没有权限访问');
    }
    return binItem;
  }

  /**
   * 清空回收站
   */
  async emptyBin(userId: string): Promise<void> {
    await this.binRepository.delete({ userId });
  }
}