import { useState } from 'react';
import { useTodoStore } from '@/store/todoStore';
import type { Todo, TodoCompleteAllAction } from '@/types';
import { ShowType, type ShowTypeValue } from '@/constants';
import dayjs from 'dayjs';

// 定义hook返回类型
interface UseTodoOperationsReturn {
  title: string;
  showType: ShowTypeValue;
  setTitle: (title: string) => void;
  setShowType: (type: ShowTypeValue) => void;
  handleAdded: () => void;
  handleSwitchShow: (showType: ShowTypeValue) => void;
  handleCompleteAll: (action: TodoCompleteAllAction) => void;
  handleDeleteAllCompleted: () => void;
  calculateUncompletedCount: () => number;
  renderTodos: () => Todo[];
  renderOtherTodos: () => Todo[];
  isAllDone: boolean;
}

// 任务操作相关的hook
export default function useTodoOperations(tasks: Todo[]): UseTodoOperationsReturn {
  const { dispatchTodo } = useTodoStore();
  const [title, setTitle] = useState<string>('');
  const [showType, setShowType] = useState<ShowTypeValue>(ShowType.uncompleted);
  let isAllDone = tasks.length > 0 && tasks.every((t) => t.completed);

  //点击添加按钮 - 添加根任务
  function handleAdded(): void {
    const { activeListId } = useTodoStore.getState();
    dispatchTodo({
      type: 'added',
      title: title,
      completed: false,
      listId: activeListId,
    });
    setTitle('');
  }

  //切换任务列表（全部，未完成，已完成）
  function handleSwitchShow(showType: ShowTypeValue) {
    setShowType(showType);
  }

  //todo模板初始化
  function renderTodos(): Todo[] {
    switch (showType) {
      case ShowType.all:
        return tasks;
      case ShowType.completed:
        return tasks.filter((t) => t.completed);
      case ShowType.uncompleted:
        return tasks.filter((t) => !t.completed);
      case ShowType.overdue:
        return tasks.filter((t) => dayjs(t.deadline).diff(dayjs(), 'day') >= 0);
      default:
        return [];
    }
  }

  function renderOtherTodos(): Todo[] {
    switch (showType) {
      case ShowType.all:
        return [];
      //   已完成
      case ShowType.completed:
        return tasks.filter((t) => !t.completed);
      //未完成
      case ShowType.uncompleted:
        return tasks.filter((t) => t.completed);
      //已逾期
      case ShowType.overdue:
        return tasks.filter((t) => dayjs(t.deadline).diff(dayjs(), 'day') < 0);
      default:
        return [];
    }
  }

  //当一键完成或一键取消完成的时候
  function handleCompleteAll(action: TodoCompleteAllAction) {
    const { activeListId } = useTodoStore.getState();
    dispatchTodo({ ...action, showType, listId: activeListId });
  }

  //计算未完成的个数
  function calculateUncompletedCount() {
    return tasks.reduce((l, n) => {
      if (!n.completed) return l + 1;
      return l;
    }, 0);
  }

  // 删除所有已完成
  function handleDeleteAllCompleted() {
    const { activeListId } = useTodoStore.getState();
    dispatchTodo({
      type: 'deletedAll',
      todoList: tasks,
      listId: activeListId,
    });
  }

  return {
    title,
    showType,
    setTitle,
    setShowType,
    handleAdded,
    handleSwitchShow,
    handleCompleteAll,
    handleDeleteAllCompleted,
    calculateUncompletedCount,
    renderTodos,
    renderOtherTodos,
    isAllDone
  };
}