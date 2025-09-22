import { useState, useCallback } from "react";
import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/types";
import { PointerSensor, KeyboardSensor, useSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// 定义hook返回类型
interface UseTodoHierarchyReturn {
  expandedTasks: Record<string, boolean>;
  sensors: any[];
  toggleTaskExpand: (taskId: string) => void;
  hasSubTasks: (taskId: string) => boolean;
  getHierarchicalTasks: (type?: boolean) => (Todo | Todo[])[];
  getHierarchicalTasksForGroup: (tasks: Todo[]) => (Todo | Todo[])[];
  handleDragEnd: (event: any) => void;
  sortableTaskIds: string[];
}

// 任务层次结构和拖拽相关的hook
export default function useTodoHierarchy(
  tasks: Todo[],
  renderTodos: () => Todo[],
  renderOtherTodos: () => Todo[],
): UseTodoHierarchyReturn {
  const { dispatchTodo } = useTodoStore();
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({
    // 默认可以在这里设置一些任务的展开状态
  });

  // 设置@dnd-kit传感器
  const sensors = [
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  ];

  // 切换任务展开状态
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // 检查任务是否有子任务
  const hasSubTasks = (taskId: string): boolean => {
    return tasks.some((task) => task.parentId === taskId);
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

    // 递归构建层次化任务结构
    const buildHierarchicalTasks = (
      parentId: string | null,
    ): (Todo | Todo[])[] => {
      const result: (Todo | Todo[])[] = [];

      // 获取当前父任务的直接子任务
      const parentTasks = tasks.filter((task) => task.parentId === parentId);

      parentTasks.forEach((task) => {
        result.push(task);

        // 获取该任务的子任务
        const subTasks = buildHierarchicalTasks(task.id);

        // 仅在任务展开状态下添加子任务
        if (subTasks.length > 0 && expandedTasks[task.id]) {
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
    };

    // 从根任务开始构建层次结构
    return buildHierarchicalTasks(null);
  };

  // 拖动排序方法 - 使用@dnd-kit处理拖拽排序和层级转换
  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;
      console.log(event);
      // 如果没有放置目标或放置在自身上，则不处理
      if (!over || active.id === over.id) {
        return;
      }

      // 获取拖动和放置的任务
      const draggedTask = tasks.find((item) => item.id === active.id);
      const targetTask = tasks.find((item) => item.id === over.id);

      if (!draggedTask || !targetTask) return;

      // 深拷贝任务列表以进行修改
      const updatedTasks: Todo[] = JSON.parse(JSON.stringify(tasks));
      const draggedIndex = updatedTasks.findIndex(
        (item) => item.id === active.id,
      );
      const targetIndex = updatedTasks.findIndex((item) => item.id === over.id);

      // 处理层级转换
      // 1. 如果拖动的是子任务（有parentId）到顶级任务位置（无parentId或parentId不同）
      if (
        draggedTask.parentId &&
        (!targetTask.parentId || targetTask.parentId !== draggedTask.parentId)
      ) {
        // 将子任务转换为父任务
        updatedTasks[draggedIndex].parentId = null;
        updatedTasks[draggedIndex].depth = 0;

        // 更新该任务的所有子任务的depth
        const updateChildDepths = (taskId: string, newDepth: number) => {
          updatedTasks.forEach((task) => {
            if (task.parentId === taskId) {
              task.depth = newDepth + 1;
              updateChildDepths(task.id, task.depth);
            }
          });
        };
        updateChildDepths(updatedTasks[draggedIndex].id, 0);
      }
      // 2. 如果拖动的是父任务（无parentId或depth为0）到子任务位置
      else if (
        (!draggedTask.parentId || draggedTask.depth === 0) &&
        targetTask.depth > 0
      ) {
        // 将父任务转换为子任务，成为目标任务的兄弟任务
        updatedTasks[draggedIndex].parentId = targetTask.parentId;
        updatedTasks[draggedIndex].depth = targetTask.depth;

        // 更新该任务的所有子任务的depth
        const updateChildDepths = (taskId: string, newDepth: number) => {
          updatedTasks.forEach((task) => {
            if (task.parentId === taskId) {
              task.depth = newDepth + 1;
              updateChildDepths(task.id, task.depth);
            }
          });
        };
        updateChildDepths(updatedTasks[draggedIndex].id, targetTask.depth);
      }

      // 执行排序操作
      const [removed] = updatedTasks.splice(draggedIndex, 1);
      updatedTasks.splice(targetIndex, 0, removed);
      // 一次性替换整个列表
      const { activeListId } = useTodoStore.getState();
      dispatchTodo({
        type: "replaced",
        todoList: updatedTasks,
        listId: activeListId,
      });
    },
    [tasks, dispatchTodo],
  );

  return {
    expandedTasks,
    sensors,
    toggleTaskExpand,
    hasSubTasks,
    getHierarchicalTasks,
    getHierarchicalTasksForGroup,
    handleDragEnd,
  };
}
