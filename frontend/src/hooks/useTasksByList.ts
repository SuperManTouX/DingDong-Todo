import { useState, useEffect } from 'react';
import { getTasksByType } from '@/services/todoService';
import type { Todo } from '@/types';
import { useTodoStore } from '@/store/todoStore';

interface UseTasksByListReturn {
  tasks: Todo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 根据listId查找列表中的任务
 * @param listId 清单ID
 * @returns 任务列表及加载状态
 */
export const useTasksByList = (listId: string): UseTasksByListReturn => {
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 从store中获取任务，优先使用本地数据
  const storeTasks = useTodoStore((state) => state.tasks);

  const fetchTasks = async () => {
    if (!listId) {
      setTasks([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 首先尝试从store中过滤获取任务
      const localTasks = storeTasks.filter(task => task.listId === listId);
      
      if (localTasks.length > 0) {
        setTasks(localTasks);
      }
      
      // 使用getTasksByType API获取清单中的任务
      // 直接使用listId作为type参数，假设后端API支持这种查询方式
      const fetchedTasks = await getTasksByType(listId);
      
      // 确保只返回匹配当前listId的任务
      const filteredTasks = fetchedTasks.filter(task => task.listId === listId);
      setTasks(filteredTasks);
    } catch (err) {
      console.error('获取清单任务失败:', err);
      setError('获取任务失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 当listId变化时重新获取数据
  useEffect(() => {
    fetchTasks();
  }, [listId, storeTasks]); // 添加storeTasks依赖，当store更新时刷新

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
  };
};