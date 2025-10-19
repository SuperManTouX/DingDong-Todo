import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, TreeRepository, EntityManager, Connection, QueryRunner, Not, Between,  IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task } from './todo.entity';
import { TaskTag } from '../task-tag/task-tag.entity';
import { TodoTag } from '../todo-tag/todo-tag.entity';
import { TodoList } from '../todo-list/todo-list.entity';
import { TaskGroup } from '../task-group/task-group.entity';
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
    @InjectRepository(TodoList)
    private todoListRepository: Repository<TodoList>,
    @InjectRepository(TaskGroup)
    private taskGroupRepository: Repository<TaskGroup>,
    private entityManager: EntityManager,
    private connection: Connection,
    @Inject(EventEmitter2)
    private eventEmitter: EventEmitter2,
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
      relations: ['list', 'group', 'user', 'taskTags'],
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
    const formattedTask = this.formatTaskResponse({
      ...savedTask,
      tags: tagsArray
    });
    
    // 发送SSE事件，通知前端任务已创建
    // 前端逻辑：直接将add数组中的所有节点添加到tasks数组中，不关心父节点关系
    this.eventEmitter.emit('todo.updated', {
      userId: taskData.userId,
      action: 'update_tree_node_with_children',
      parent: null, // 根据前端逻辑，这里可以设置为null
      childrenChanges: {
        add: [formattedTask] // 所有新创建的任务都放在add数组中
      }
    });
    
    return formattedTask;
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
      deletedAt: task.deletedAt || null,
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
    
    // 检查是否更新了completed状态
    const isCompletedUpdated = taskDataWithoutTags.completed !== undefined && 
                               taskDataWithoutTags.completed !== existingTask.completed;
    
    Object.assign(existingTask, processedTaskData, { updatedAt: new Date() });
    const updatedTask = await this.taskRepository.save(existingTask);
    
    // 如果更新了completed状态，递归更新所有子任务的completed状态
    if (isCompletedUpdated && taskDataWithoutTags.completed !== undefined) {
      await this.updateChildTasksCompleted(id, userId, taskDataWithoutTags.completed);
    }
    
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
    
    // 获取格式化后的任务
    const formattedTask = this.formatTaskResponse(updatedTask);
    
    // 检查是否为父任务且有子任务，需要更新子任务的某些属性
    if (updatedTask.parentId === null || updatedTask.parentId === undefined) {
      const childTasks = await this.taskRepository.find({ where: { parentId: updatedTask.id, userId } });
      
      // 如果是父任务，发送包含子任务的SSE事件
      if (childTasks.length > 0) {
        this.eventEmitter.emit('todo.updated', {
          userId,
          action: 'update_tree_node_with_children',
          parent: formattedTask,
          childrenChanges: {
            update: await this.getChildTasksWithFormat(updatedTask.id, userId)
          }
        });
      } else {
        // 普通任务更新，发送基本的SSE事件
        this.eventEmitter.emit('todo.updated', {
          userId,
          action: 'update_tree_node_with_children',
          parent: formattedTask,
          childrenChanges: { update: [] }
        });
      }
    } else {
      // 子任务更新，也需要通知前端
      this.eventEmitter.emit('todo.updated', {
        userId,
        action: 'update_tree_node_with_children',
        parent: formattedTask,
        childrenChanges: { update: [] }
      });
    }
    
    return formattedTask;
  }

  /**
   * 删除任务（软删除，将任务及其所有嵌套子任务标记为已删除）
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // 先验证任务存在且属于当前用户
    const task = await this.findOne(id, userId);
    
    // 递归处理所有嵌套子任务，将它们标记为已删除
    await this.moveNestedTasksToBin(id, userId);
    
    // 获取更新后的任务（已软删除）
    const deletedTask = await this.taskRepository.findOne({ where: { id, userId } });
    if (!deletedTask) {
      return false;
    }
    
    // 获取格式化后的任务
    const formattedTask = this.formatTaskResponse(deletedTask);
    
    // 使用已有的getChildTasksWithFormat方法获取所有子任务
    const allChildTasks = await this.getChildTasksWithFormat(id, userId);
    
    // 过滤出已被软删除的子任务
    const deletedChildTasks = allChildTasks.filter(task => task.deletedAt !== null);
    
    // 发送SSE事件，通知前端任务已被软删除（更新任务状态）
    this.eventEmitter.emit('todo.updated', {
      userId,
      action: 'update_tree_node_with_children',
      parent: formattedTask,
      childrenChanges: { update: deletedChildTasks }
    });
    
    return true;
  }
  
  /**
   * 移动任务及其所有子任务到指定清单
   * @param taskId 要移动的任务ID
   * @param userId 用户ID
   * @param newListId 新的清单ID
   * @returns 更新后的任务
   */
  async moveTaskToList(taskId: string, userId: string, newListId: string): Promise<Task> {
    // 先验证任务存在且属于当前用户
    const task = await this.findOne(taskId, userId);
    
    // 验证清单存在且属于当前用户
    const listExists = await this.todoListRepository.findOne({
      where: { id: newListId, userId }
    });
    if (!listExists) {
      throw new NotFoundException(`清单ID ${newListId} 不存在或不属于当前用户`);
    }
    
    // 使用事务确保数据一致性
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      // 首先处理子任务，只更新listId和清空groupId
      await this.moveSubTasksToList(taskId, userId, newListId, transactionalEntityManager);
      
      // 然后处理父任务，更新listId、清空groupId，并清除parentId
      await transactionalEntityManager.update(Task, { id: taskId, userId }, {
        listId: newListId,
        groupId: null,
        parentId: null,
        updatedAt: new Date()
      });
    });
    
    // 返回更新后的任务
    const updatedTask = await this.findOne(taskId, userId);
    
    // 发送SSE事件，通知前端任务已移动到新清单
    this.eventEmitter.emit('todo.updated', {
      userId,
      action: 'update_tree_node_with_children',
      parent: this.formatTaskResponse(updatedTask),
      childrenChanges: {
        update: await this.getChildTasksWithFormat(taskId, userId)
      }
    });
    
    return updatedTask;
  }

  /**
   * 递归移动子任务到指定清单，并清空groupId，但保留parentId
   */
  private async moveSubTasksToList(taskId: string, userId: string, newListId: string, entityManager: EntityManager): Promise<void> {
    // 查找当前任务的所有直接子任务
    const childTasks = await entityManager.find(Task, {
      where: { parentId: taskId, userId },
    });
    
    // 递归处理每个子任务
    for (const childTask of childTasks) {
      await this.moveSubTasksToList(childTask.id, userId, newListId, entityManager);
      
      // 更新子任务的清单ID并清空groupId，但保留parentId
      await entityManager.update(Task, { id: childTask.id, userId }, {
        listId: newListId,
        groupId: null,
        updatedAt: new Date()
      });
    }
  }
  async moveTaskToGroup(taskId: string, userId: string, newGroupId: string | null, listId: string): Promise<Task> {
    // 先验证任务存在且属于当前用户
    const task = await this.findOne(taskId, userId);
    
    // 如果指定了新分组ID，验证分组存在且属于当前用户
    if (newGroupId) {
      const groupExists = await this.taskGroupRepository.findOne({
        where: { id: newGroupId, userId }
      });
      if (!groupExists) {
        throw new NotFoundException(`分组ID ${newGroupId} 不存在或不属于当前用户`);
      }
    }
    
    // 验证清单存在且属于当前用户
    const listExists = await this.todoListRepository.findOne({
      where: { id: listId, userId }
    });
    if (!listExists) {
      throw new NotFoundException(`清单ID ${listId} 不存在或不属于当前用户`);
    }
    
    // 使用事务确保数据一致性
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      // 递归移动任务及其所有子任务
      await this.moveTaskAndSubTasksToGroup(taskId, userId, newGroupId, listId, transactionalEntityManager);
    });
    
    // 返回更新后的任务
    const updatedTask = await this.findOne(taskId, userId);
    
    // 发送SSE事件，通知前端任务已移动到新分组
    this.eventEmitter.emit('todo.updated', {
      userId,
      action: 'update_tree_node_with_children',
      parent: this.formatTaskResponse(updatedTask),
      childrenChanges: { update: [] }
    });
    
    return updatedTask;
  }
  
  /**
   * 递归移动任务及其子任务到指定分组
   */
  private async moveTaskAndSubTasksToGroup(taskId: string, userId: string, newGroupId: string | null, listId: string, entityManager: EntityManager): Promise<void> {
    // 查找当前任务的所有直接子任务
    const childTasks = await entityManager.find(Task, {
      where: { parentId: taskId, userId },
    });
    
    // 递归处理每个子任务
    for (const childTask of childTasks) {
      await this.moveTaskAndSubTasksToGroup(childTask.id, userId, newGroupId, listId, entityManager);
    }
    
    // 更新当前任务的分组ID和清单ID
    await entityManager.update(Task, { id: taskId, userId }, {
      groupId: newGroupId,
      listId: listId,
      updatedAt: new Date()
    });
  }
  private async moveNestedTasksToBin(taskId: string, userId: string): Promise<void> {
    // 查找当前任务的所有直接子任务（不管是否已删除）
    const childTasks = await this.taskRepository.find({
      where: { parentId: taskId, userId },
    });
    
    // 递归处理每个子任务
    for (const childTask of childTasks) {
      await this.moveNestedTasksToBin(childTask.id, userId);
    }
    
    // 软删除当前任务
    await this.taskRepository.update({ id: taskId, userId }, {
      deletedAt: new Date()
    });
    
    // 保留内存中的标签映射，便于后续可能的恢复操作
  }
  
  /**
   * 递归永久删除任务及其所有子任务
   */
  async permanentlyDelete(taskId: string, userId: string): Promise<boolean> {
    // 先验证任务存在且属于当前用户且已被软删除
    const task = await this.taskRepository.findOne({
      where: { id: taskId, userId, deletedAt: Not(IsNull()) }
    });
    
    if (!task) {
      throw new NotFoundException('任务不存在或您没有权限访问');
    }
    
    // 获取所有要删除的任务ID（包括子任务）
    const tasksToDelete = await this.getTasksToDeleteWithId(taskId, userId);
    
    // 使用事务确保数据一致性
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      await this.permanentlyDeleteNestedTasks(taskId, userId, transactionalEntityManager);
    });
    
    // 发送SSE事件，通知前端永久删除任务及其子任务
    this.eventEmitter.emit('todo.updated', {
      userId,
      action: 'update_tree_node_with_children',
      type: 'delete',
      parent: null,
      childrenChanges: {
        delete: tasksToDelete
      }
    });
    
    return true;
  }
  
  /**
   * 获取所有要删除的任务ID（包括子任务）
   */
  private async getTasksToDeleteWithId(taskId: string, userId: string): Promise<{id: string}[]> {
    const result: {id: string}[] = [{id: taskId}];
    
    // 查找当前任务的所有直接子任务
    const childTasks = await this.taskRepository.find({
      where: { parentId: taskId, userId, deletedAt: Not(IsNull()) }
    });
    
    // 递归获取每个子任务的ID
    for (const childTask of childTasks) {
      const childIds = await this.getTasksToDeleteWithId(childTask.id, userId);
      result.push(...childIds);
    }
    
    return result;
  }

  /**
   * 递归永久删除子任务
   */
  private async permanentlyDeleteNestedTasks(taskId: string, userId: string, entityManager: EntityManager): Promise<void> {
    // 查找当前任务的所有直接子任务
    const childTasks = await entityManager.find(Task, {
      where: { parentId: taskId, userId, deletedAt: Not(IsNull()) }
    });
    
    // 递归删除每个子任务
    for (const childTask of childTasks) {
      await this.permanentlyDeleteNestedTasks(childTask.id, userId, entityManager);
    }
    
    // 永久删除当前任务（先删除关联关系）
    await entityManager.delete('task_tag', { taskId });
    // 确保只删除已标记为删除的任务，增加安全保障
    await entityManager.delete(Task, { id: taskId, userId, deletedAt: Not(IsNull()) });
  }

  /**
   * 恢复已删除的任务及其子任务
   */
  async restore(taskId: string, userId: string): Promise<Task> {
    // 验证任务存在且属于当前用户
    const task = await this.taskRepository.findOne({
      where: { id: taskId, userId, deletedAt: Not(IsNull()) },
      relations: ['taskTags']
    });
    
    if (!task) {
      throw new NotFoundException('任务不存在或您没有权限访问');
    }
    
    // 使用事务确保数据一致性
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      // 检查父任务是否存在且未被删除
      let updateData: { deletedAt: null; parentId?: null; listId?: string; groupId?: string | null } = { deletedAt: null };
      
      if (task.parentId) {
        const parentTask = await transactionalEntityManager.findOne(Task, {
          where: { id: task.parentId, userId, deletedAt: IsNull() }
        });
        
        // 如果父任务不存在或已被删除，则将父任务设置为null
        if (!parentTask) {
          updateData.parentId = null;
        }
      }
      
      // 检查listId是否存在且属于当前用户
      if (task.listId) {
        const listExists = await transactionalEntityManager.findOne(TodoList, {
          where: { id: task.listId, userId }
        });
        
        // 如果list不存在，使用用户的第一个list
        if (!listExists) {
          const firstList = await transactionalEntityManager.findOne(TodoList, {
            where: { userId },
            order: { createdAt: 'ASC' }
          });
          if (firstList) {
            updateData.listId = firstList.id;
          }
        }
      }
      
      // 检查groupId是否存在且属于当前用户
      if (task.groupId) {
        const groupExists = await transactionalEntityManager.findOne(TaskGroup, {
          where: { id: task.groupId, userId }
        });
        
        // 如果group不存在，使用用户的第一个group，或者设为null
        if (!groupExists) {
          const firstGroup = await transactionalEntityManager.findOne(TaskGroup, {
            where: { userId },
            order: { createdAt: 'ASC' }
          });
          updateData.groupId = firstGroup ? firstGroup.id : null;
        }
      }
      
      // 恢复当前任务
      await transactionalEntityManager.update(Task, { id: taskId, userId }, updateData);
      
      // 查找子任务并递归恢复
      const childTasks = await transactionalEntityManager.find(Task, {
        where: { parentId: taskId, userId, deletedAt: Not(IsNull()) }
      });
      
      if (childTasks && childTasks.length > 0) {
        for (const childTask of childTasks) {
          await this.restoreNestedTasks(childTask.id, userId, transactionalEntityManager);
        }
      }
    });
    
    // 返回恢复后的任务
    const restoredTask = await this.findOne(taskId, userId);
    
    // 发送SSE事件，通知前端恢复任务及其子任务
    // 获取格式化后的任务
    const formattedTask = this.formatTaskResponse(restoredTask);
    
    // 获取恢复的子任务
    const childTasks = await this.getChildTasksWithFormat(taskId, userId);
    
    this.eventEmitter.emit('todo.updated', {
      userId,
      action: 'update_tree_node_with_children',
      parent: formattedTask,
      childrenChanges: {
        update: childTasks
      }
    });
    
    return restoredTask;
  }
  
  /**
   * 递归恢复子任务
   */
  private async restoreNestedTasks(taskId: string, userId: string, entityManager: EntityManager): Promise<void> {
    // 先获取当前子任务信息
    const task = await entityManager.findOne(Task, {
      where: { id: taskId, userId, deletedAt: Not(IsNull()) }
    });
    
    if (!task) {
      return;
    }
    
    // 检查父任务是否存在且未被删除
    let updateData: { deletedAt: null; parentId?: null; listId?: string; groupId?: string | null } = { deletedAt: null };
    
    if (task.parentId) {
      const parentTask = await entityManager.findOne(Task, {
        where: { id: task.parentId, userId, deletedAt: IsNull() }
      });
      
      // 如果父任务不存在或已被删除，则将父任务设置为null
      if (!parentTask) {
        updateData.parentId = null;
      }
    }
    
    // 检查listId是否存在且属于当前用户
    if (task.listId) {
      const listExists = await entityManager.findOne(TodoList, {
        where: { id: task.listId, userId }
      });
      
      // 如果list不存在，使用用户的第一个list
      if (!listExists) {
        const firstList = await entityManager.findOne(TodoList, {
          where: { userId },
          order: { createdAt: 'ASC' }
        });
        if (firstList) {
          updateData.listId = firstList.id;
        }
      }
    }
    
    // 检查groupId是否存在且属于当前用户
    if (task.groupId) {
      const groupExists = await entityManager.findOne(TaskGroup, {
        where: { id: task.groupId, userId }
      });
      
      // 如果group不存在，使用用户的第一个group，或者设为null
      if (!groupExists) {
        const firstGroup = await entityManager.findOne(TaskGroup, {
          where: { userId },
          order: { createdAt: 'ASC' }
        });
        updateData.groupId = firstGroup ? firstGroup.id : null;
      }
    }
    
    // 恢复当前子任务
    await entityManager.update(Task, { id: taskId, userId }, updateData);
    
    // 查找当前任务的子任务
    const childTasks = await entityManager.find(Task, {
      where: { parentId: taskId, userId, deletedAt: Not(IsNull()) }
    });
    
    // 递归恢复每个子任务
    if (childTasks && childTasks.length > 0) {
      for (const childTask of childTasks) {
        await this.restoreNestedTasks(childTask.id, userId, entityManager);
      }
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
    const formattedTasks = tasks.map(task => this.formatTaskResponse(task));
    
    return formattedTasks;
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
    
    // 发送SSE事件，通知前端更新树节点
    this.eventEmitter.emit('todo.updated', {
      userId,
      action: 'update_tree_node_with_children',
      parent: this.formatTaskResponse(updatedTask),
      childrenChanges: {
        update: await this.getChildTasksWithFormat(id, userId)
      }
    });
    
    return this.formatTaskResponse(updatedTask);
  }
  
  /**
   * 切换任务完成状态，并同步更新所有子任务的完成状态
   */
  async toggleTaskCompleted(id: string, userId: string): Promise<any> {
    // 先验证任务存在且属于当前用户
    await this.findOne(id, userId);
    const existingTask = await this.taskRepository.findOne({ where: { id } });
    
    if (!existingTask) {
      throw new NotFoundException(`任务不存在`);
    }
    
    // 切换完成状态
    const newCompletedState = !existingTask.completed;
    existingTask.completed = newCompletedState;
    existingTask.updatedAt = new Date();
    
    // 保存当前任务的更新
    const updatedTask = await this.taskRepository.save(existingTask);
    
    // 递归处理所有子任务的完成状态
    await this.updateChildTasksCompleted(id, userId, newCompletedState);
    
    // 发送SSE事件，通知前端更新树节点
    this.eventEmitter.emit('todo.updated', {
      userId,
      action: 'update_tree_node_with_children',
      parent: this.formatTaskResponse(updatedTask),
      childrenChanges: {
        update: await this.getChildTasksWithFormat(id, userId)
      }
    });
    
    return this.formatTaskResponse(updatedTask);
  }
  
  /**
   * 递归更新所有子任务的完成状态
   */
  private async updateChildTasksCompleted(parentId: string, userId: string, completed: boolean): Promise<void> {
    // 查找当前任务的所有直接子任务
    const childTasks = await this.taskRepository.find({
      where: { parentId, userId },
    });
    
    // 递归处理每个子任务
    for (const childTask of childTasks) {
      // 更新子任务的完成状态
      childTask.completed = completed;
      childTask.updatedAt = new Date();
      await this.taskRepository.save(childTask);
      
      // 递归处理子任务的子任务
      await this.updateChildTasksCompleted(childTask.id, userId, completed);
    }
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
   * 更新任务的父任务ID，并自动计算和更新depth值，同时更新所有子任务的depth
   * @param taskId 要更新的任务ID
   * @param newParentId 新的父任务ID
   * @param userId 当前用户ID
   * @returns 更新后的任务
   */
  async updateParentId(taskId: string, newParentId: string | null, userId: string) {
    // 验证任务是否存在且属于当前用户
    const task = await this.taskRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 检查是否形成循环引用
    if (newParentId) {
      const parentTask = await this.taskRepository.findOne({
        where: { id: newParentId, userId },
      });

      if (!parentTask&&newParentId!==null) {
        throw new NotFoundException('指定的父任务不存在');
      }

      // 检查循环引用
      if (await this.hasCircularDependency(newParentId, taskId)) {
        throw new BadRequestException('不能将任务设置为其子任务的子任务，会形成循环引用');
      }
    }

    // 计算新的depth值
    const newDepth = newParentId 
      ? (await this.getTaskDepth(newParentId)) + 1
      : 0;

    // 计算depth差值
    const depthDiff = newDepth - task.depth;

    // 开始事务
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 更新当前任务的parentId和depth
      task.parentId = newParentId;
      task.depth = newDepth;
      
      // 如果有父任务ID，获取父任务的listId和groupId，并更新当前任务的这两个属性
      if (newParentId) {
        const parentTask = await this.taskRepository.findOne({
          where: { id: newParentId, userId },
          select: ['listId', 'groupId'],
        });
        
        if (parentTask) {
          // 确保不为null
          task.listId = parentTask.listId || task.listId; // 如果父任务没有listId，保持原有的
          task.groupId = parentTask.groupId; // groupId可能允许为null或undefined
          
          // 递归更新所有子任务的listId和groupId
          if (parentTask.listId) { // 只有当父任务有listId时才更新子任务
            await this.updateChildTasksListAndGroup(queryRunner, taskId, parentTask.listId, parentTask.groupId);
          }
        }
      }
      
      await queryRunner.manager.save(task);

      // 如果depth发生变化，递归更新所有子任务的depth
      if (depthDiff !== 0) {
        await this.updateChildTasksDepth(queryRunner, taskId, depthDiff);
      }

      // 提交事务
      await queryRunner.commitTransaction();

      // 获取更新后的任务
      const updatedTask = await this.findOne(taskId, userId);
      
      // 发送SSE事件，通知前端更新树节点
      this.eventEmitter.emit('todo.updated', {
        userId,
        action: 'update_tree_node_with_children',
        parent: updatedTask,
        childrenChanges: {
          update: await this.getChildTasksWithFormat(taskId, userId)
        }
      });

      return updatedTask;
    } catch (error) {
      // 回滚事务
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // 释放连接
      await queryRunner.release();
    }
  }

  /**
   * 获取任务的深度
   * @param taskId 任务ID
   * @returns 任务深度
   */
  private async getTaskDepth(taskId: string): Promise<number> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      select: ['depth'],
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    return task.depth;
  }

  /**
   * 检查是否存在循环依赖
   * @param parentId 父任务ID
   * @param childId 子任务ID
   * @returns 是否存在循环依赖
   */
  private async hasCircularDependency(parentId: string, childId: string): Promise<boolean> {
    // 如果要检查的父任务ID就是子任务ID，直接返回true（循环）
    if (parentId === childId) {
      return true;
    }

    // 获取父任务的父任务
    const parentTask = await this.taskRepository.findOne({
      where: { id: parentId },
      select: ['parentId'],
    });

    // 如果父任务没有父任务，则不会形成循环
    if (!parentTask || !parentTask.parentId) {
      return false;
    }

    // 递归检查父任务的父任务是否会导致循环
    return this.hasCircularDependency(parentTask.parentId, childId);
  }

  /**
   * 递归更新所有子任务的depth
   * @param queryRunner 查询运行器
   * @param parentId 父任务ID
   * @param depthDiff depth差值
   */
  private async updateChildTasksDepth(
    queryRunner: QueryRunner,
    parentId: string,
    depthDiff: number
  ): Promise<void> {
    // 获取所有直接子任务
    const childTasks = await queryRunner.manager.find(Task, {
      where: { parentId },
    });

    // 更新每个子任务的depth
    for (const childTask of childTasks) {
      childTask.depth += depthDiff;
      await queryRunner.manager.save(childTask);

      // 递归更新子任务的子任务
      await this.updateChildTasksDepth(queryRunner, childTask.id, depthDiff);
    }
  }
  
  /**
   * 递归更新所有子任务的listId和groupId
   * @param queryRunner 查询运行器
   * @param parentId 父任务ID
   * @param newListId 要更新的listId
   * @param newGroupId 要更新的groupId
   */
  private async updateChildTasksListAndGroup(
    queryRunner: QueryRunner,
    parentId: string,
    newListId: string,
    newGroupId: string | null | undefined
  ): Promise<void> {
    // 获取所有直接子任务
    const childTasks = await queryRunner.manager.find(Task, {
      where: { parentId },
    });

    // 更新每个子任务的listId和groupId
    for (const childTask of childTasks) {
      childTask.listId = newListId; // listId必须是string
      if (newGroupId !== undefined) { // 只有当新的groupId不是undefined时才更新
        childTask.groupId = newGroupId;
      }
      await queryRunner.manager.save(childTask);

      // 递归更新子任务的子任务
      await this.updateChildTasksListAndGroup(queryRunner, childTask.id, newListId, newGroupId);
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
   * 递归获取格式化的子任务列表
   * @param parentId 父任务ID
   * @param userId 用户ID
   * @returns 格式化的子任务列表
   */
  private async getChildTasksWithFormat(parentId: string, userId: string): Promise<any[]> {
    // 查找当前任务的所有直接子任务
    const childTasks = await this.taskRepository.find({
      where: { parentId, userId },
      relations: ['taskTags'],
    });
    
    const formattedChildren: any[] = [];
    
    // 递归处理每个子任务
    for (const childTask of childTasks) {
      const formattedChild = this.formatTaskResponse(childTask);
      formattedChildren.push(formattedChild);
      
      // 递归获取子任务的子任务
      const grandChildren = await this.getChildTasksWithFormat(childTask.id, userId);
      formattedChildren.push(...grandChildren);
    }
    
    return formattedChildren;
  }
  async hardDelete(id: string, userId: string): Promise<boolean> {
    // 先验证任务存在且属于当前用户
    await this.findOne(id, userId);
    
    // 获取所有要删除的任务ID（包括子任务）
    const tasksToDelete = await this.getTasksToDeleteWithId(id, userId);
    
    // 使用事务确保数据一致性
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      // 递归删除所有子任务
      await this.permanentlyDeleteNestedTasks(id, userId, transactionalEntityManager);
    });
    
    // 发送SSE事件，通知前端硬删除任务及其子任务
    this.eventEmitter.emit('todo.updated', {
      userId,
      action: 'update_tree_node_with_children',
      type: 'delete',
      parent: null,
      childrenChanges: {
        delete: tasksToDelete
      }
    });
    
    return true;
  }

  /**
   * 硬删除用户的所有任务
   * @param userId 用户ID
   * @returns 是否删除成功
   */
  async hardDeleteAll(userId: string): Promise<boolean> {
    // 查找用户的所有已删除的根任务（没有父任务且已被删除的任务）
    const rootTasks = await this.taskRepository.find({
      where: { userId, parentId: IsNull(), deletedAt: Not(IsNull()) }
    });
    
    // 获取所有要删除的任务ID
    const tasksToDelete: {id: string}[] = [];
    
    for (const task of rootTasks) {
      const taskIds = await this.getTasksToDeleteWithId(task.id, userId);
      tasksToDelete.push(...taskIds);
    }
    
    // 使用事务确保数据一致性
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      // 递归删除每个根任务及其所有子任务
      for (const task of rootTasks) {
        await this.permanentlyDeleteNestedTasks(task.id, userId, transactionalEntityManager);
      }
    });
    
    // 发送SSE事件，通知前端硬删除所有任务
    this.eventEmitter.emit('todo.updated', {
      userId,
      action: 'update_tree_node_with_children',
      type: 'delete',
      parent: null,
      childrenChanges: {
        delete: tasksToDelete
      }
    });
    
    return true;
  }
  
  /**
   * 根据类型获取任务列表
   * @param userId 用户ID
   * @param type 任务类型：today（今天）、nearlyWeek（近一周）、cp（已完成）、bin（回收站）或标签ID
   * @returns 任务列表
   */
  async getTasksByType(userId: string, type: string): Promise<any[]> {
    // 如果类型中包含"bin"，从task表查询已删除的任务
    if (type.includes('bin')) {
      const query = this.taskRepository.createQueryBuilder('task')
        .where('task.userId = :userId', { userId })
        .andWhere('task.deletedAt IS NOT NULL')
        .leftJoinAndSelect('task.taskTags', 'taskTags')
        .orderBy('task.deletedAt', 'DESC');
        
      const tasks = await query.getMany();
      return tasks.map(task => this.formatTaskResponse(task));
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
          .andWhere('task.deletedAt IS NULL')
          .leftJoinAndSelect('task.taskTags', 'taskTags')
          .innerJoin('task.taskTags', 'tt')
          .andWhere('tt.tagId IN (:...tagIds)', { tagIds: allTagIds })
          // 不添加completed状态过滤，返回所有任务
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
      .andWhere('task.deletedAt IS NULL')
      .leftJoinAndSelect('task.taskTags', 'taskTags');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    switch (type) {
      case 'today':
        // 返回今天截止的任务，无论是否完成
        query.andWhere('DATE(task.deadline) = DATE(:today)', { today });
        break;
      
      case 'nearlyWeek':
        // 返回前后七天的任务，无论是否完成
        query.andWhere('task.deadline >= :weekAgo AND task.deadline <= :weekLater', { 
          weekAgo, 
          weekLater 
        });
        break;
      
      case 'cp':
        // 只有在'cp'类型时才返回已完成的任务
        query.andWhere('task.completed = true');
        break;
      
      default:
        // 如果是普通列表ID，返回该列表的所有任务，无论是否完成
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
  
  /**
   * 分页获取已完成任务，支持按类型过滤
   * @param userId 用户ID
   * @param page 页码（从1开始）
   * @param pageSize 每页数量
   * @param type 任务类型过滤
   * @returns 分页结果对象，包含任务列表和分页信息
   */
  async getCompletedTasksWithPagination(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    type?: string
  ): Promise<{
    tasks: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      // 获取过滤条件
      const whereConditions = await this.getAdditionalConditionsForCompletedTasks(type, userId);

      // 获取总记录数
      const total = await this.taskRepository.count({
        where: whereConditions
      });

      // 计算总页数
      const totalPages = Math.ceil(total / pageSize);

      // 获取任务列表
      const tasks = await this.taskRepository.find({
        where: whereConditions,
        relations: ['taskTags'],
        order: {
          createdAt: 'DESC',
          updatedAt: 'DESC'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      // 格式化任务数据
      const formattedTasks = tasks.map(task => this.formatTaskResponse(task));

      return {
        tasks: formattedTasks,
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      console.error('获取已完成任务分页出错:', error);
      // 返回空结果
      return {
        tasks: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }
  }

  /**
   * 获取已完成任务的额外过滤条件
   * @param type 任务类型
   * @param userId 用户ID
   * @returns 查询条件对象
   */
  private async getAdditionalConditionsForCompletedTasks(type?: string, userId?: string): Promise<any> {
    // 基础条件
    const conditions: any = {
      userId,
      completed: true
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 处理todolist前缀 - 保留前缀进行查询
    if (type && type.startsWith('todolist-')) {
      // 直接使用完整ID（包含前缀）
      return {
        ...conditions,
        listId: type, // 保留完整的todolist-* ID
        deletedAt: IsNull()
      };
    }

    // 处理tag前缀 - 保留前缀进行查询
    if (type && type.startsWith('tag-') && userId) {
      try {
        // 直接使用完整的标签ID（包含前缀）
        const tagId = type;
        
        // 获取标签及其所有子标签的ID
        const tagIds = await this.getAllTagIdsWithChildren(tagId, userId);
        
        if (tagIds && tagIds.length > 0) {
          // 查询有这些标签的任务ID列表
          const taskTags = await this.taskTagRepository.find({
            where: { tagId: In(tagIds) },
            select: ['taskId']
          });
          
          const taskIds = taskTags.map(tt => tt.taskId);
          
          if (taskIds.length > 0) {
            return {
              ...conditions,
              id: In(taskIds),
              deletedAt: IsNull()
            };
          }
        }
        // 如果没有找到匹配的任务，返回一个不会匹配的条件
        return { ...conditions, id: 'NON_EXISTENT_ID' };
      } catch (error) {
        console.error('标签过滤出错:', error);
        return { ...conditions, id: 'NON_EXISTENT_ID' };
      }
    }

    switch (type) {
      case 'today':
        // 今天完成的任务
        return {
          ...conditions,
          updatedAt: Between(
            new Date(today),
            new Date(today.setHours(23, 59, 59, 999))
          ),
          deletedAt: IsNull()
        };
      
      case 'nearlyWeek':
        // 当天之前七天，之后七天的已完成任务
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        sevenDaysLater.setHours(23, 59, 59, 999);
        
        return {
          ...conditions,
          updatedAt: Between(sevenDaysAgo, sevenDaysLater),
          deletedAt: IsNull()
        };
      
      case 'bin':
        // 已删除任务中的已完成任务
        return {
          ...conditions,
          deletedAt: Not(IsNull())
        };
      
      case 'cp':
      default:
        // 所有未删除的已完成任务
        return {
          ...conditions,
          deletedAt: IsNull()
        };
    }
  }

  // 创建演示任务（接口别名）
  async createDemo(): Promise<any> {
    return this.createTestTask();
  }
}