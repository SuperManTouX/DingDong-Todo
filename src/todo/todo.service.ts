import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, TreeRepository, EntityManager } from 'typeorm';
import { Task } from './todo.entity';
import { TaskTag } from '../task-tag/task-tag.entity';
import { BinService } from '../bin/bin.service';
import { TodoTag } from '../todo-tag/todo-tag.entity';
import { BatchUpdateOrderDto, TaskOrderUpdate } from './dto/batch-update-order.dto';

@Injectable()
export class TaskService {
  // 内存映射：任务ID -> 标签数组
  private taskTagsMap: Map<string, string[]> = new Map();
  
  constructor(
    @InjectRepository(Task) 
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskTag)
    private taskTagRepository: Repository<TaskTag>,
    @InjectRepository(TodoTag)
    private todoTagRepository: Repository<TodoTag>,
    @Inject(forwardRef(() => BinService))
    private binService: BinService,
    private entityManager: EntityManager
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
      timeOrderIndex: task.timeOrderIndex || 0,
      groupOrderIndex: task.groupOrderIndex || 0,
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
   * @param userId 用户ID
   * @param tasks 需要更新的任务数组，包含id、timeOrderIndex、groupOrderIndex等信息
   */
  async batchUpdateOrder(batchUpdateDto: BatchUpdateOrderDto, userId: string): Promise<{ message: string; updatedCount: number }> {
    // 使用事务处理批量更新
    await this.entityManager.transaction(async (manager) => {
      // 按listId和groupId分组任务
      const taskGroups: Record<string, Array<{ id: string; timeOrderIndex?: number; groupOrderIndex?: number; listId: string; groupId?: string }>> = {};
      
      for (const update of batchUpdateDto.tasks) {
        // 获取任务详情以验证权限
        const task = await this.findOne(update.id, userId);
        if (!task) {
          throw new NotFoundException(`Task with ID ${update.id} not found`);
        }
        
        // 创建组键：listId_groupId（如果groupId不存在则使用'ungrouped'）
        const groupKey = `${update.listId}_${update.groupId || 'ungrouped'}`;
        
        if (!taskGroups[groupKey]) {
          taskGroups[groupKey] = [];
        }
        taskGroups[groupKey].push(update);
      }
      
      // 对每个组进行排序更新
      for (const groupKey in taskGroups) {
        const groupTasks = taskGroups[groupKey];
        
        // 批量更新
        for (const update of groupTasks) {
          // 构建更新对象
          const updateData: any = {};
          if (update.timeOrderIndex !== undefined) {
            updateData.timeOrderIndex = update.timeOrderIndex;
          }
          if (update.groupOrderIndex !== undefined) {
            updateData.groupOrderIndex = update.groupOrderIndex;
          }
          updateData.updatedAt = new Date();
          
          await manager.update(Task, update.id, updateData);
        }
      }
    });
    
    // 返回成功响应
    return {
      message: '批量更新任务顺序成功',
      updatedCount: batchUpdateDto.tasks.length
    };
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
  
  /**
   * 根据类型获取任务列表
   * @param userId 用户ID
   * @param type 任务类型：today（今天）、nearlyWeek（近一周）、cp（已完成）、bin（回收站）或标签ID
   * @returns 任务列表
   */
  async getTasksByType(userId: string, type: string): Promise<any[]> {
    // 如果类型中包含"bin"，从回收站获取任务
    if (type.includes('bin')) {
      const binItems = await this.binService.findAllByUserId(userId);
      return binItems.map(binItem => ({
        ...binItem,
        taskTags: [] // 回收站项目可能没有标签信息
      }));
    }

    // 检查是否是标签查询
    if (type.startsWith('tag-')) {
      const tagId = type;
      
      // 查询标签及其所有子标签
      const allTagIds = await this.getAllTagIdsWithChildren(tagId, userId);
      
      if (allTagIds.length > 0) {
        // 查询包含这些标签中任意一个的任务
        const query = this.taskRepository.createQueryBuilder('task')
          .where('task.userId = :userId', { userId })
          .andWhere('task.isPinned = false')
          .leftJoinAndSelect('task.taskTags', 'taskTags')
          .innerJoin('task.taskTags', 'tt')
          .andWhere('tt.tagId IN (:...tagIds)', { tagIds: allTagIds })
          .orderBy('task.groupOrderIndex', 'ASC')
          .addOrderBy('task.updatedAt', 'DESC');
          
        const tasks = await query.getMany();
        return tasks.map(task => this.formatTaskResponse(task));
      } else {
        // 如果没有找到标签，返回空数组
        return [];
      }
    } 
    
    // 处理其他类型的查询
    const query = this.taskRepository.createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.isPinned = false')
      .leftJoinAndSelect('task.taskTags', 'taskTags');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    switch (type) {
      case 'today':
        // 返回今天截止的任务
        query.andWhere('DATE(task.deadline) = DATE(:today)', { today });
        break;
      
      case 'nearlyWeek':
        // 返回前后七天的任务
        query.andWhere('task.deadline >= :weekAgo AND task.deadline <= :weekLater', { 
          weekAgo, 
          weekLater 
        });
        break;
      
      case 'cp':
        // 返回已完成的任务
        query.andWhere('task.completed = true');
        break;
      
      default:
        // 如果是普通列表ID，返回该列表的任务
        query.andWhere('task.listId = :listId', { listId: type });
    }

    // 设置不同的排序方式
    if (type === 'today' || type === 'nearlyWeek' || type === 'cp') {
      // 按时间索引排序，离当前时间最近的排第一个
      query.orderBy('task.timeOrderIndex', 'ASC')
        .addOrderBy('task.deadline', 'ASC')
    } else if (type.startsWith('todolist-')) {
      // 对于任务列表，按组索引排序
      query.orderBy('task.groupOrderIndex', 'ASC')
    } else {
      // 默认排序
      query.orderBy('task.groupOrderIndex', 'ASC');
    }
    
    // 执行查询并格式化结果
    const tasks = await query.getMany();
    return tasks.map(task => this.formatTaskResponse(task));
  }

  /**
   * 获取标签ID及其所有子标签ID（递归查询）
   * @param tagId 标签ID
   * @param userId 用户ID
   * @returns 包含标签ID及其所有子标签ID的数组
   */
  private async getAllTagIdsWithChildren(tagId: string, userId: string): Promise<string[]> {
    const result: string[] = [];
    
    // 先检查标签是否存在且属于当前用户
    const rootTag = await this.todoTagRepository.findOne({
      where: { id: tagId, userId }
    });
    
    if (!rootTag) {
      return [];
    }
    
    // 递归获取所有子标签
    async function collectTagIds(currentTagId: string) {
      result.push(currentTagId);
      
      // 查询直接子标签
      const children = await this.todoTagRepository.find({
        where: { parentId: currentTagId, userId }
      });
      
      // 递归处理每个子标签
      for (const child of children) {
        await collectTagIds.bind(this)(child.id);
      }
    }
    
    await collectTagIds.bind(this)(tagId);
    return result;
  }

  /**
   * 按清单ID和分组获取任务列表
   * @param listId 清单ID
   * @param userId 用户ID
   * @param grouping 分组方式：'group'（按分组）或'time'（按时间）
   */
  async getTasksByListAndGrouping(listId: string, userId: string, grouping: string = 'group'): Promise<any> {
    // 查询所有非已完成的任务
    const activeTasks = await this.taskRepository.find({
      where: { listId, userId, completed: false },
      relations: ['taskTags'],
      order: grouping === 'time' 
        ? { deadline: 'ASC', timeOrderIndex: 'ASC', updatedAt: 'DESC' }
        : { groupId: 'ASC', groupOrderIndex: 'ASC', updatedAt: 'DESC' }
    });

    // 查询所有已完成的任务
    const completedTasks = await this.taskRepository.find({
      where: { listId, userId, completed: true },
      relations: ['taskTags'],
      order: grouping === 'time'
        ? { deadline: 'ASC', timeOrderIndex: 'ASC', updatedAt: 'DESC' }
        : { groupId: 'ASC', groupOrderIndex: 'ASC', updatedAt: 'DESC' }
    });

    // 查询置顶任务
    const pinnedTasks = await this.taskRepository.find({
      where: { listId, userId, isPinned: true },
      relations: ['taskTags'],
      order: { pinnedAt: 'DESC' }
    });

    // 格式化任务数据
    const formattedActiveTasks = activeTasks.map(task => this.formatTaskResponse(task));
    const formattedCompletedTasks = completedTasks.map(task => this.formatTaskResponse(task));
    const formattedPinnedTasks = pinnedTasks.map(task => this.formatTaskResponse(task));

    // 按分组组织任务
    const groupedTasks = {};
    const completedGroupedTasks = {};

    if (grouping === 'group') {
      // 按分组名分组
      formattedActiveTasks.forEach(task => {
        const groupId = task.groupId || '无分组';
        if (!groupedTasks[groupId]) {
          groupedTasks[groupId] = [];
        }
        groupedTasks[groupId].push(task);
      });

      formattedCompletedTasks.forEach(task => {
        const groupId = task.groupId || '无分组';
        if (!completedGroupedTasks[groupId]) {
          completedGroupedTasks[groupId] = [];
        }
        completedGroupedTasks[groupId].push(task);
      });
    } else if (grouping === 'time') {
      // 按时间分组
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // 初始化时间分组
      groupedTasks['今天'] = [];
      groupedTasks['明天'] = [];
      groupedTasks['最近七天'] = [];
      groupedTasks['之后'] = [];
      groupedTasks['未设置截止日期'] = [];

      completedGroupedTasks['今天'] = [];
      completedGroupedTasks['明天'] = [];
      completedGroupedTasks['最近七天'] = [];
      completedGroupedTasks['之后'] = [];
      completedGroupedTasks['未设置截止日期'] = [];

      // 对活动任务进行时间分组
      formattedActiveTasks.forEach(task => {
        if (!task.deadline) {
          groupedTasks['未设置截止日期'].push(task);
        } else {
          const deadlineDate = new Date(task.deadline);
          if (deadlineDate >= today && deadlineDate < tomorrow) {
            groupedTasks['今天'].push(task);
          } else if (deadlineDate >= tomorrow && deadlineDate < nextWeek) {
            groupedTasks['明天'].push(task);
          } else if (deadlineDate >= nextWeek) {
            groupedTasks['最近七天'].push(task);
          } else {
            groupedTasks['之后'].push(task);
          }
        }
      });

      // 对已完成任务进行时间分组
      formattedCompletedTasks.forEach(task => {
        if (!task.deadline) {
          completedGroupedTasks['未设置截止日期'].push(task);
        } else {
          const deadlineDate = new Date(task.deadline);
          if (deadlineDate >= today && deadlineDate < tomorrow) {
            completedGroupedTasks['今天'].push(task);
          } else if (deadlineDate >= tomorrow && deadlineDate < nextWeek) {
            completedGroupedTasks['明天'].push(task);
          } else if (deadlineDate >= nextWeek) {
            completedGroupedTasks['最近七天'].push(task);
          } else {
            completedGroupedTasks['之后'].push(task);
          }
        }
      });
    }

    return {
      pinnedTasks: formattedPinnedTasks,
      activeTasks: groupedTasks,
      completedTasks: completedGroupedTasks
    };
  }

  /**
   * 按关键词搜索任务
   * @param userId 用户ID
   * @param keyword 搜索关键词
   * @returns 匹配关键词的任务列表
   */
  async searchTasks(userId: string, keyword: string): Promise<any[]> {
    // 确保关键词不为空
    if (!keyword || keyword.trim() === '') {
      return [];
    }

    // 拆分关键词，处理空格分隔的多词搜索
    const keywords = keyword.trim().split(/\s+/);
    
    // 构建搜索查询
    const query = this.taskRepository.createQueryBuilder('task')
      .where('task.userId = :userId', { userId });
    
    // 对每个关键词添加OR条件，匹配title或text字段
    keywords.forEach((word, index) => {
      const paramName = `keyword_${index}`;
      const wordCondition = `(task.title LIKE :${paramName} OR task.text LIKE :${paramName})`;
      
      if (index === 0) {
        query.andWhere(wordCondition, { [paramName]: `%${word}%` });
      } else {
        query.orWhere(wordCondition, { [paramName]: `%${word}%` });
      }
    });
    
    // 添加连接和排序
    query.leftJoinAndSelect('task.taskTags', 'taskTags')
         .orderBy('task.updatedAt', 'DESC');

    const tasks = await query.getMany();
    return tasks.map(task => this.formatTaskResponse(task));
  }
  
  // 创建演示任务（接口别名）
  async createDemo(): Promise<any> {
    return this.createTestTask();
  }
}