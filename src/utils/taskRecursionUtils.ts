import type { Todo } from '@/types';

/**
 * 通用的递归查找子任务函数
 * @param tasks 任务数组
 * @param parentId 父任务ID
 * @returns 包含所有子任务的数组
 */
export function findAllSubtasks(tasks: Todo[], parentId: string): Todo[] {
  const result: Todo[] = [];
  const directSubtasks = tasks.filter(t => t.parentId === parentId);
  
  directSubtasks.forEach(task => {
    result.push(task);
    // 递归添加所有嵌套子任务
    result.push(...findAllSubtasks(tasks, task.id));
  });
  
  return result;
}

/**
 * 递归收集任务及其所有子任务
 * @param tasks 任务数组
 * @param taskId 起始任务ID
 * @returns 包含起始任务及其所有子任务的数组
 */
export function collectTaskWithSubtasks(tasks: Todo[], taskId: string): Todo[] {
  const result: Todo[] = [];
  
  // 查找当前任务
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    // 先添加当前任务
    result.push(task);
    // 再添加所有子任务
    result.push(...findAllSubtasks(tasks, taskId));
  }
  
  return result;
}

/**
 * 构建层次化的任务结构
 * @param tasks 任务数组
 * @param parentId 父任务ID，默认为null（根任务）
 * @returns 层次化的任务结构
 */
export function buildHierarchicalTasks(tasks: Todo[], parentId: string | null = null): (Todo | Todo[])[] {
  const result: (Todo | Todo[])[] = [];
  
  // 获取当前父任务的直接子任务
  const parentTasks = tasks.filter((task) => task.parentId === parentId);
  
  parentTasks.forEach((task) => {
    result.push(task);
    
    // 获取该任务的子任务
    const subTasks = buildHierarchicalTasks(tasks, task.id);
    
    if (subTasks.length > 0) {
      // 收集所有子任务（包括嵌套的子任务）
      const allSubTasks: Todo[] = [];
      
      const collectSubTasks = (items: (Todo | Todo[])[]) => {
        items.forEach((item) => {
          if ("id" in item) {
            allSubTasks.push(item);
          } else {
            collectSubTasks(item);
          }
        });
      };
      
      collectSubTasks(subTasks);
      
      if (allSubTasks.length > 0) {
        result.push(allSubTasks);
      }
    }
  });
  
  return result;
}

/**
 * 查找任务在层次结构中的路径
 * @param tasks 任务数组
 * @param taskId 目标任务ID
 * @returns 从根任务到目标任务的路径
 */
export function findTaskPath(tasks: Todo[], taskId: string): Todo[] {
  const path: Todo[] = [];
  let currentTask = tasks.find(t => t.id === taskId);
  
  // 从目标任务向上查找直到根任务
  while (currentTask) {
    path.unshift(currentTask); // 添加到路径开头
    if (currentTask.parentId) {
      currentTask = tasks.find(t => t.id === currentTask.parentId);
    } else {
      currentTask = null;
    }
  }
  
  return path;
}

/**
 * 检查任务是否有活跃的子任务
 * @param tasks 任务数组
 * @param taskId 父任务ID
 * @returns 是否有未完成的子任务
 */
export function hasActiveSubtasks(tasks: Todo[], taskId: string): boolean {
  const subtasks = findAllSubtasks(tasks, taskId);
  // 检查是否有未完成的子任务
  return subtasks.some(subtask => !subtask.completed);
}

/**
 * 更新任务树中所有任务的某个属性
 * @param tasks 任务数组
 * @param parentId 父任务ID
 * @param property 属性名
 * @param value 属性值
 * @returns 更新后的任务数组
 */
export function updatePropertyInTaskTree(
  tasks: Todo[], 
  parentId: string | null, 
  property: keyof Todo, 
  value: any
): Todo[] {
  return tasks.map(task => {
    let updatedTask = { ...task };
    
    // 如果是当前父任务或其子任务
    if (task.parentId === parentId) {
      updatedTask[property] = value;
      // 递归更新子任务
      const subtasksUpdated = updatePropertyInTaskTree(tasks, task.id, property, value);
      // 合并更新后的子任务
      updatedTask = {
        ...updatedTask,
        ...subtasksUpdated.find(t => t.id === task.id)
      };
    }
    
    return updatedTask;
  });
}