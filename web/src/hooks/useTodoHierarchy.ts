import { useState, useCallback } from "react";
import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/types";
import { SpecialLists } from "@/constants";

// 定义hook返回类型
interface UseTodoHierarchyReturn {
  expandedTasks: Record<string, boolean>;
  toggleTaskExpand: (taskId: string) => void;
  hasSubTasks: (taskId: string) => boolean;
  getHierarchicalTasks: (type?: boolean) => (Todo | Todo[])[];
  getHierarchicalTasksForGroup: (tasks: Todo[]) => (Todo | Todo[])[];
}

// 任务层次结构和拖拽相关的hook
export default function useTodoHierarchy(
  tasks: Todo[],
  renderTodos: () => Todo[],
  renderOtherTodos: () => Todo[],
): UseTodoHierarchyReturn {
  const {
    dispatchTodo,
    activeListId,
    pinnedTasks,
    updateTodoLocally,
    getGroupsByListId,
  } = useTodoStore();
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({
    // 默认可以在这里设置一些任务的展开状态
  });


  // 判断当前是哪种分组模式
  const isGroupMode = useCallback(() => {
    // 如果不是特殊列表且不包含"tag"，则为分组模式
    return (
      !Object.keys(SpecialLists).includes(activeListId) &&
      activeListId.indexOf("tag") === -1
    );
  }, [activeListId]);

  // 切换任务展开状态
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // 检查任务是否有子任务
  const hasSubTasks = (taskId: string): boolean => {
    return (
      tasks.some((task) => task.parentId === taskId) ||
      pinnedTasks.some((task) => task.parentId === taskId)
    );
  };

  // 获取层次化的任务列表（考虑过滤条件）
  const getHierarchicalTasks = (type: boolean = true): (Todo | Todo[])[] => {
    if (!type && renderOtherTodos().length === 0) return [];
    // 首先获取过滤后的任务列表
    const filteredTodos = type ? renderTodos() : renderOtherTodos();
    return getHierarchicalTasksForGroup(filteredTodos);
  };

  // 获取特定任务数组的层次化结构
  const getHierarchicalTasksForGroup = (tasks: Todo[]): (Todo | Todo[])[] => {
    if (tasks.length === 0) return [];

    // 获取所有任务ID集合，用于快速检查父任务是否存在
    const taskIds = new Set(tasks.map((task) => task.id));

    // 记录已经添加到结果中的任务ID，避免重复添加
    const addedTaskIds = new Set<string>();

    // 收集所有子任务（包括嵌套的子任务）的通用函数
    const collectSubTasks = (items: (Todo | Todo[])[]): Todo[] => {
      const allSubTasks: Todo[] = [];

      const recursivelyCollect = (subItems: (Todo | Todo[])[]) => {
        subItems.forEach((item) => {
          if ("id" in item) {
            allSubTasks.push(item);
            addedTaskIds.add(item.id);
          } else {
            recursivelyCollect(item);
          }
        });
      };

      recursivelyCollect(items);
      return allSubTasks;
    };

    // 递归构建层次化任务结构
    const buildHierarchicalTasks = (
      parentId: string | null,
      isRootLevel: boolean = false,
    ): (Todo | Todo[])[] => {
      const result: (Todo | Todo[])[] = [];

      // 获取当前父任务的直接子任务
      const parentTasks = tasks.filter((task) => task.parentId === parentId);

      parentTasks.forEach((task) => {
        result.push(task);
        addedTaskIds.add(task.id);

        // 获取该任务的子任务
        const subTasks = buildHierarchicalTasks(task.id);

        if (subTasks.length > 0 && expandedTasks[task.id]) {
          // 仅在任务展开状态下添加子任务
          // 收集所有子任务（包括嵌套的子任务）
          const allSubTasks = collectSubTasks(subTasks);

          if (allSubTasks.length > 0) {
            result.push(allSubTasks);
          }
        }
      });

      return result;
    };

    // 从根任务开始构建层次结构
    const hierarchicalTasks = buildHierarchicalTasks(null, true);
    // 找出那些找不到父组件的子任务（父任务ID不在当前任务列表中）
    const orphanedTasks = tasks.filter(
      (task) =>
        task.parentId !== null &&
        !taskIds.has(task.parentId) &&
        !addedTaskIds.has(task.id),
    );

    // 将找不到父组件的子任务添加到顶层
    if (orphanedTasks.length > 0) {
      orphanedTasks.forEach((orphanedTask) => {
        hierarchicalTasks.push(orphanedTask);

        // 如果找不到父组件的子任务有自己的子任务，并且处于展开状态，也一并添加
        if (expandedTasks[orphanedTask.id]) {
          const subTasks = buildHierarchicalTasks(orphanedTask.id);
          if (subTasks.length > 0) {
            // 收集所有子任务（复用通用函数）
            const allSubTasks = collectSubTasks(subTasks);

            if (allSubTasks.length > 0) {
              hierarchicalTasks.push(allSubTasks);
            }
          }
        }
      });
    }

    return hierarchicalTasks;
  };



  return {
    expandedTasks,
    toggleTaskExpand,
    hasSubTasks,
    getHierarchicalTasks,
    getHierarchicalTasksForGroup,
  };
}
