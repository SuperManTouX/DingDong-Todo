import { useCallback } from 'react';
import { useTodoStore } from './todoStore';
import type { Todo, TodoListData } from '@/types';
import dayjs from 'dayjs';

// 自定义hook：获取和操作当前激活的任务组
export const useActiveTodoGroup = () => {
  const { 
    activeGroupId, 
    todoListGroups, 
    setActiveGroupId, 
    dispatchTodo 
  } = useTodoStore();
  
  // 获取当前激活的任务组
  const activeGroup = todoListGroups.find(group => group.id === activeGroupId);
  
  // 更新当前激活的任务组名称
  const updateActiveGroupName = useCallback((title: string) => {
    if (activeGroupId) {
      dispatchTodo({
        type: 'updateListGroup',
        groupId: activeGroupId,
        title
      });
    }
  }, [activeGroupId, dispatchTodo]);
  
  // 清空当前激活的任务组
  const clearActiveGroup = useCallback(() => {
    if (activeGroupId) {
      dispatchTodo({
        type: 'replaced',
        todoList: [],
        groupId: activeGroupId
      });
    }
  }, [activeGroupId, dispatchTodo]);
  
  return {
    activeGroup,
    activeGroupId,
    setActiveGroupId,
    updateActiveGroupName,
    clearActiveGroup
  };
};

// 自定义hook：任务操作
export const useTodoActions = () => {
  const { dispatchTodo, activeGroupId } = useTodoStore();
  
  // 添加新任务
  const addTodo = useCallback((
    title: string,
    parentId?: string | null,
    depth: number = 0
  ) => {
    if (activeGroupId) {
      dispatchTodo({
        type: 'added',
        title,
        completed: false,
        parentId: parentId || null,
        depth,
        groupId: activeGroupId
      });
    }
  }, [activeGroupId, dispatchTodo]);
  
  // 切换任务完成状态
  const toggleTodo = useCallback((todoId: string, completed: boolean) => {
    const state = useTodoStore.getState();
    const todo = state.getTodoById(todoId);
    
    if (todo && todo.groupId) {
      dispatchTodo({
        type: 'toggle',
        todoId,
        newCompleted: completed,
        groupId: todo.groupId
      });
    }
  }, [dispatchTodo]);
  
  // 更新任务
  const updateTodo = useCallback((todo: Todo) => {
    dispatchTodo({
      type: 'changed',
      todo
    });
  }, [dispatchTodo]);
  
  // 删除任务
  const deleteTodo = useCallback((todoId: string) => {
    const state = useTodoStore.getState();
    const todo = state.getTodoById(todoId);
    
    if (todo && todo.groupId) {
      dispatchTodo({
        type: 'deleted',
        deleteId: todoId,
        groupId: todo.groupId
      });
    }
  }, [dispatchTodo]);
  
  // 删除所有已完成任务
  const deleteAllCompleted = useCallback(() => {
    if (activeGroupId) {
      dispatchTodo({
        type: 'deletedAll',
        groupId: activeGroupId
      });
    }
  }, [activeGroupId, dispatchTodo]);
  
  // 完成所有任务
  const completeAllTodos = useCallback((complete: boolean) => {
    if (activeGroupId) {
      dispatchTodo({
        type: 'completedAll',
        completeOrUncomplete: complete,
        groupId: activeGroupId
      });
    }
  }, [activeGroupId, dispatchTodo]);
  
  // 添加子任务
  const addSubTask = useCallback((parentId: string, title: string) => {
    const state = useTodoStore.getState();
    const parentTodo = state.getTodoById(parentId);
    
    if (parentTodo && parentTodo.groupId) {
      addTodo(title, parentId, (parentTodo.depth || 0) + 1);
    }
  }, [addTodo]);
  
  // 更新任务优先级
  const updateTodoPriority = useCallback((todoId: string, priority: Priority) => {
    const state = useTodoStore.getState();
    const todo = state.getTodoById(todoId);
    
    if (todo) {
      updateTodo({ ...todo, priority });
    }
  }, [updateTodo]);
  
  // 更新任务截止日期
  const updateTodoDeadline = useCallback((todoId: string, deadline: string | null) => {
    const state = useTodoStore.getState();
    const todo = state.getTodoById(todoId);
    
    if (todo) {
      updateTodo({ ...todo, deadline });
    }
  }, [updateTodo]);
  
  return {
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    deleteAllCompleted,
    completeAllTodos,
    addSubTask,
    updateTodoPriority,
    updateTodoDeadline
  };
};

// 自定义hook：任务标签操作
export const useTodoTagActions = () => {
  const { dispatchTodo } = useTodoStore();
  
  // 添加标签到任务
  const addTagToTodo = useCallback((todoId: string, tagId: string) => {
    const state = useTodoStore.getState();
    const todo = state.getTodoById(todoId);
    
    if (todo && todo.groupId) {
      dispatchTodo({
        type: 'addTagToTodo',
        todoId,
        tagId,
        groupId: todo.groupId
      });
    }
  }, [dispatchTodo]);
  
  // 从任务移除标签
  const removeTagFromTodo = useCallback((todoId: string, tagId: string) => {
    const state = useTodoStore.getState();
    const todo = state.getTodoById(todoId);
    
    if (todo && todo.groupId) {
      dispatchTodo({
        type: 'removeTagFromTodo',
        todoId,
        tagId,
        groupId: todo.groupId
      });
    }
  }, [dispatchTodo]);
  
  // 更新任务标签列表
  const updateTodoTags = useCallback((todoId: string, tags: string[]) => {
    const state = useTodoStore.getState();
    const todo = state.getTodoById(todoId);
    
    if (todo && todo.groupId) {
      dispatchTodo({
        type: 'updateTodoTags',
        todoId,
        tags,
        groupId: todo.groupId
      });
    }
  }, [dispatchTodo]);
  
  return {
    addTagToTodo,
    removeTagFromTodo,
    updateTodoTags
  };
};

// 自定义hook：任务组管理
export const useTodoListGroups = () => {
  const { todoListGroups, dispatchTodo, setActiveGroupId } = useTodoStore();
  
  // 添加新任务组
  const addTodoListGroup = useCallback((title: string, emoji?: string, color?: string) => {
    dispatchTodo({
      type: 'addListGroup',
      title,
      emoji: emoji || '📝',
      color: color || '#9370DB'
    });
  }, [dispatchTodo]);
  
  // 更新任务组
  const updateTodoListGroup = useCallback((groupId: string, updates: Partial<Omit<TodoListData, 'id' | 'tasks' | 'createdAt' | 'updatedAt'>>) => {
    dispatchTodo({
      type: 'updateListGroup',
      groupId,
      ...updates
    });
  }, [dispatchTodo]);
  
  // 删除任务组
  const deleteTodoListGroup = useCallback((groupId: string) => {
    dispatchTodo({
      type: 'deleteListGroup',
      groupId
    });
    
    // 确保删除后有一个激活的任务组
    const state = useTodoStore.getState();
    if (state.todoListGroups.length > 0 && state.activeGroupId === groupId) {
      setActiveGroupId(state.todoListGroups[0].id);
    }
  }, [dispatchTodo, setActiveGroupId]);
  
  // 获取任务组统计信息
  const getGroupStatistics = useCallback((groupId: string) => {
    const group = todoListGroups.find(g => g.id === groupId);
    if (!group) return { total: 0, completed: 0, uncompleted: 0, percentage: 0 };
    
    const total = group.tasks.length;
    const completed = group.tasks.filter(t => t.completed).length;
    const uncompleted = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, uncompleted, percentage };
  }, [todoListGroups]);
  
  // 获取所有任务组统计信息
  const getAllGroupsStatistics = useCallback(() => {
    return todoListGroups.map(group => ({
      id: group.id,
      title: group.title,
      ...getGroupStatistics(group.id)
    }));
  }, [todoListGroups, getGroupStatistics]);
  
  return {
    todoListGroups,
    addTodoListGroup,
    updateTodoListGroup,
    deleteTodoListGroup,
    getGroupStatistics,
    getAllGroupsStatistics
  };
};

// 自定义hook：标签管理
export const useTags = () => {
  const { todoTags, dispatchTag } = useTodoStore();
  
  // 添加新标签
  const addTag = useCallback((name: string, color: string, parentId?: string | null) => {
    dispatchTag({
      type: 'addTag',
      payload: {
        name,
        color,
        parentId: parentId || null
      }
    });
  }, [dispatchTag]);
  
  // 更新标签
  const updateTag = useCallback((id: string, updates: Partial<Omit<Tag, 'id'>>) => {
    dispatchTag({
      type: 'updateTag',
      payload: {
        id,
        updates
      }
    });
  }, [dispatchTag]);
  
  // 删除标签
  const deleteTag = useCallback((id: string) => {
    dispatchTag({
      type: 'deleteTag',
      payload: id
    });
  }, [dispatchTag]);
  
  // 获取标签树
  const getTagTree = useCallback(() => {
    const buildTree = (parentId: string | null = null): any[] => {
      return todoTags
        .filter(tag => tag.parentId === parentId)
        .map(tag => ({
          ...tag,
          children: buildTree(tag.id)
        }));
    };
    
    return buildTree();
  }, [todoTags]);
  
  return {
    todoTags,
    addTag,
    updateTag,
    deleteTag,
    getTagTree
  };
};

// 自定义hook：任务搜索和过滤
export const useTodoSearch = () => {
  const { todoListGroups } = useTodoStore();
  
  // 按关键词搜索任务
  const searchTodos = useCallback((keyword: string, groupId?: string) => {
    let results: Todo[] = [];
    
    const groupsToSearch = groupId 
      ? todoListGroups.filter(group => group.id === groupId)
      : todoListGroups;
    
    keyword = keyword.toLowerCase().trim();
    
    if (keyword) {
      groupsToSearch.forEach(group => {
        const matchingTodos = group.tasks.filter(todo => 
          todo.title.toLowerCase().includes(keyword) ||
          (todo.description && todo.description.toLowerCase().includes(keyword))
        );
        results = [...results, ...matchingTodos];
      });
    }
    
    return results;
  }, [todoListGroups]);
  
  // 按日期范围过滤任务
  const filterTodosByDate = useCallback((
    startDate: string | null,
    endDate: string | null,
    groupId?: string
  ) => {
    let results: Todo[] = [];
    
    const groupsToFilter = groupId 
      ? todoListGroups.filter(group => group.id === groupId)
      : todoListGroups;
    
    groupsToFilter.forEach(group => {
      const filteredTodos = group.tasks.filter(todo => {
        if (!todo.deadline) return false;
        
        const todoDate = dayjs(todo.deadline);
        const start = startDate ? dayjs(startDate) : dayjs().subtract(30, 'day');
        const end = endDate ? dayjs(endDate) : dayjs().add(30, 'day');
        
        return todoDate.isBetween(start, end, null, '[]');
      });
      
      results = [...results, ...filteredTodos];
    });
    
    return results;
  }, [todoListGroups]);
  
  // 按优先级过滤任务
  const filterTodosByPriority = useCallback((priority: Priority, groupId?: string) => {
    let results: Todo[] = [];
    
    const groupsToFilter = groupId 
      ? todoListGroups.filter(group => group.id === groupId)
      : todoListGroups;
    
    groupsToFilter.forEach(group => {
      const filteredTodos = group.tasks.filter(todo => todo.priority === priority);
      results = [...results, ...filteredTodos];
    });
    
    return results;
  }, [todoListGroups]);
  
  return {
    searchTodos,
    filterTodosByDate,
    filterTodosByPriority
  };
};

// 自定义hook：任务选择
export const useSelectedTodo = () => {
  const { selectTodoId, setSelectTodoId } = useTodoStore();
  const selectedTodo = selectTodoId ? useTodoStore.getState().getTodoById(selectTodoId) : null;
  
  // 选择任务
  const selectTodo = useCallback((todoId: string | null) => {
    setSelectTodoId(todoId);
  }, [setSelectTodoId]);
  
  // 清除选择
  const clearSelection = useCallback(() => {
    setSelectTodoId(null);
  }, [setSelectTodoId]);
  
  return {
    selectedTodo,
    selectTodoId,
    selectTodo,
    clearSelection
  };
};