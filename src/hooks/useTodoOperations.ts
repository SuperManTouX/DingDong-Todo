import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTodoStore } from "@/store/todoStore";
import { message } from "antd";
import type { Todo, TodoCompleteAllAction } from "@/types";

// 定义hook返回类型
interface UseTodoOperationsReturn {
  title: string;
  setTitle: (title: string) => void;
  handleAdded: () => Promise<void>;
  handleCompleteAll: (action: TodoCompleteAllAction) => Promise<void>;
  handleDeleteAllCompleted: () => Promise<void>;
  calculateUncompletedCount: () => number;
  renderTodos: () => Todo[];
  renderOtherTodos: () => Todo[];
  isAllDone: boolean;
  handleDeleteSelectedTodo: () => Promise<void>;
  handleUndoDelete: () => Promise<void>;
}

// 任务操作相关的hook
export default function useTodoOperations(
  tasks: Todo[],
  searchText: string = "",
): UseTodoOperationsReturn {
  const { dispatchTodo, loadData, selectTodoId } = useTodoStore();
  const [title, setTitle] = useState<string>("");
  // 保存最近删除的任务信息，用于撤销操作
  const [lastDeletedTask, setLastDeletedTask] = useState<Todo | null>(null);
  let isAllDone = tasks.length > 0 && tasks.every((t) => t.completed);

  //点击添加按钮 - 添加根任务
  async function handleAdded(): Promise<void> {
    console.log("创建新待办事项");
    try {
      const { activeListId } = useTodoStore.getState();
      await dispatchTodo({
        type: "added",
        title: "",
        completed: false,
        listId: activeListId,
      });
      loadData();
      setTitle("");
    } catch (error) {
      console.error("添加任务失败:", error);
      message.error("添加任务失败，请重试");
    }
  }

  // 删除选中的任务
  async function handleDeleteSelectedTodo(): Promise<void> {
    console.log("删除选中的待办事项");
    if (selectTodoId) {
      try {
        // 查找并保存被删除的任务信息
        const deletedTask = tasks.find((task) => task.id === selectTodoId);
        if (deletedTask) {
          setLastDeletedTask(deletedTask);
        }

        const { activeListId } = useTodoStore.getState();
        await dispatchTodo({
          type: "deleted",
          deleteId: selectTodoId,
          listId: activeListId,
        });
        message.success("待办事项已删除");
      } catch (error) {
        console.error("删除任务失败:", error);
        message.error("删除任务失败，请重试");
      }
    } else {
      message.warning("请先选择一个待办事项");
    }
  }

  // 撤销删除操作
  async function handleUndoDelete(): Promise<void> {
    console.log("撤销删除操作");
    if (lastDeletedTask) {
      try {
        const { activeListId } = useTodoStore.getState();
        // 重新添加被删除的任务
        await dispatchTodo({
          type: "added",
          title: lastDeletedTask.title || "",
          completed: lastDeletedTask.completed || false,
          listId: activeListId,
          // 如果有原始的任务ID，尝试恢复它（具体取决于store的实现）
          ...(lastDeletedTask.id && { originalId: lastDeletedTask.id }),
        });
        loadData();
        setLastDeletedTask(null);
        message.success("已撤销删除操作");
      } catch (error) {
        console.error("撤销删除失败:", error);
        message.error("撤销删除失败，请重试");
      }
    } else {
      message.warning("没有可撤销的删除操作");
    }
  }

  // 使用react-hotkeys-hook设置键盘快捷键
  // 新任务快捷键: Ctrl+N 或 Cmd+N
  useHotkeys(
    "ctrl+Q, cmd+Q",
    (e) => {
      // 显式阻止默认行为
      console.log("拦截Ctrl+N快捷键");
      e.preventDefault();
      e.stopPropagation();
      handleAdded();
      message.success("已创建新待办事项");
    },
    {
      // 重要：确保preventDefault在所有情况下都能生效
      preventDefault: true,
      // 在捕获阶段处理事件，这样可以比浏览器默认处理更早拦截
      enableOnFormTags: true,
      // 忽略文本输入框，避免在输入时触发快捷键
      ignoreTags: ["INPUT", "TEXTAREA"],
    },
    [handleAdded],
  );

  // 删除选中任务快捷键: Ctrl+D 或 Cmd+D
  useHotkeys(
    "ctrl+d, cmd+d",
    (e) => {
      console.log("拦截Ctrl+D快捷键");
      e.preventDefault();
      e.stopPropagation();
      handleDeleteSelectedTodo();
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
      ignoreTags: ["INPUT", "TEXTAREA"],
    },
    [handleDeleteSelectedTodo],
  );

  // 撤销删除快捷键: Ctrl+Z 或 Cmd+Z
  useHotkeys(
    "ctrl+z, cmd+z",
    (e) => {
      console.log("拦截Ctrl+Z快捷键");
      e.preventDefault();
      e.stopPropagation();
      handleUndoDelete();
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
      ignoreTags: ["INPUT", "TEXTAREA"],
    },
    [handleUndoDelete],
  );

  // 保存任务快捷键: Ctrl+S 或 Cmd+S
  useHotkeys(
    "ctrl+s, cmd+s",
    (e) => {
      console.log("拦截Ctrl+S快捷键");
      e.preventDefault();
      e.stopPropagation();
      message.success("待办事项已保存");
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
    },
    [],
  );

  // 过滤任务的函数，应用搜索文本过滤
  const filterTasksBySearch = (taskList: Todo[]): Todo[] => {
    if (!searchText.trim()) {
      return taskList;
    }
    
    const searchLower = searchText.toLowerCase().trim();
    return taskList.filter((task) => 
      (task.title && task.title.toLowerCase().includes(searchLower)) ||
      (task.text && task.text.toLowerCase().includes(searchLower))
    );
  };

  //todo模板初始化
  function renderTodos(): Todo[] {
    return filterTasksBySearch(tasks.filter((t) => !t.completed));
  }

  function renderOtherTodos(): Todo[] {
    return filterTasksBySearch(tasks.filter((t) => t.completed));
  }

  //当一键完成或一键取消完成的时候
  async function handleCompleteAll(action: TodoCompleteAllAction): Promise<void> {
    try {
      const { activeListId } = useTodoStore.getState();
      await dispatchTodo({ ...action, listId: activeListId });
    } catch (error) {
      console.error("批量更新任务状态失败:", error);
      message.error("批量更新任务状态失败，请重试");
    }
  }

  //计算未完成的个数
  function calculateUncompletedCount() {
    return renderTodos().length;
  }

  // 删除所有已完成
  async function handleDeleteAllCompleted(): Promise<void> {
    try {
      const { activeListId } = useTodoStore.getState();
      await dispatchTodo({
        type: "deletedAll",
        todoList: tasks,
        listId: activeListId,
      });
      message.success("已删除所有已完成任务");
    } catch (error) {
      console.error("删除所有已完成任务失败:", error);
      message.error("删除所有已完成任务失败，请重试");
    }
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
    handleDeleteSelectedTodo,
    handleUndoDelete,
  };
}
