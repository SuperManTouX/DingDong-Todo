import { useState } from "react";
import { useTodoStore } from "@/store/todoStore";
import type { Todo, TodoCompleteAllAction } from "@/types";

// 定义hook返回类型
interface UseTodoOperationsReturn {
  title: string;
  setTitle: (title: string) => void;
  handleAdded: () => void;
  handleCompleteAll: (action: TodoCompleteAllAction) => void;
  handleDeleteAllCompleted: () => void;
  calculateUncompletedCount: () => number;
  renderTodos: () => Todo[];
  renderOtherTodos: () => Todo[];
  isAllDone: boolean;
}

// 任务操作相关的hook
export default function useTodoOperations(
  tasks: Todo[],
): UseTodoOperationsReturn {
  const { dispatchTodo } = useTodoStore();
  const [title, setTitle] = useState<string>("");
  let isAllDone = tasks.length > 0 && tasks.every((t) => t.completed);

  //点击添加按钮 - 添加根任务
  function handleAdded(): void {
    const { activeListId } = useTodoStore.getState();
    dispatchTodo({
      type: "added",
      title: title,
      completed: false,
      listId: activeListId,
    });
    setTitle("");
  }

  //todo模板初始化
  function renderTodos(): Todo[] {
    return tasks.filter((t) => !t.completed);
  }

  function renderOtherTodos(): Todo[] {
    return tasks.filter((t) => t.completed);
  }

  //当一键完成或一键取消完成的时候
  function handleCompleteAll(action: TodoCompleteAllAction) {
    const { activeListId } = useTodoStore.getState();
    dispatchTodo({ ...action, listId: activeListId });
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
      type: "deletedAll",
      todoList: tasks,
      listId: activeListId,
    });
  }

  return {
    title,
    setTitle,
    handleAdded,
    handleCompleteAll,
    handleDeleteAllCompleted,
    calculateUncompletedCount,
    renderTodos,
    renderOtherTodos,
    isAllDone,
  };
}
