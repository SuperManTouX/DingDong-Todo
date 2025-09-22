import { useState, useCallback } from "react";
import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/types";
import { PointerSensor, KeyboardSensor, useSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { SpecialLists } from "@/constants";

// 定义hook返回类型
interface UseTodoHierarchyReturn {
  expandedTasks: Record<string, boolean>;
  sensors: any[];
  toggleTaskExpand: (taskId: string) => void;
  hasSubTasks: (taskId: string) => boolean;
  getHierarchicalTasks: (type?: boolean) => (Todo | Todo[])[];
  getHierarchicalTasksForGroup: (tasks: Todo[]) => (Todo | Todo[])[];
  handleDragOver: (event: any) => void;
  handleDragEnd: (event: any) => void;
}

// 任务层次结构和拖拽相关的hook
export default function useTodoHierarchy(
  tasks: Todo[],
  renderTodos: () => Todo[],
  renderOtherTodos: () => Todo[],
): UseTodoHierarchyReturn {
  const { dispatchTodo, activeListId, updateGroup } = useTodoStore();
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({
    // 默认可以在这里设置一些任务的展开状态
  });
  const [tempTasks, setTempTasks] = useState<Todo[] | null>(null);

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
  // 拖动时
  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 获取拖动和放置的任务
    const draggedTask = tasks.find((item) => item.id === activeId);
    const targetTask = tasks.find((item) => item.id === overId);

    if (!draggedTask || !targetTask) return;

    // 根据目标时间分组自动更新拖动任务的deadline以实现预览效果
    // 参考Test.tsx的实现方式，直接更新TodoStore中的任务
    // 如果是时间分组
    if (activeListId in SpecialLists) {
      dispatchTodo({
        type: "changed",
        todo: {
          ...draggedTask,
          // 根据目标时间分组更新deadline，确保任务在目标分组中可见
          deadline: targetTask.deadline
            ? targetTask.deadline
            : draggedTask.deadline,
        },
      });
    } else {
      dispatchTodo({
        type: "changed",
        todo: {
          ...draggedTask,
          // 根据目标分组更新groupId，确保任务在目标分组中可见
          groupId: targetTask.groupId
            ? targetTask.groupId
            : draggedTask.groupId,
        },
      });
    }
  };

  // 拖动排序方法 - 使用@dnd-kit处理拖拽排序和层级转换
  const handleDragEnd = useCallback(
    (event: any) => {
      /*const { active, over } = event;

      // 如果拖拽被取消或没有有效的放置目标，清除临时状态
      if (!over || active.id === over.id) {
        setTempTasks(null);
        return;
      }

      // 获取拖动任务和放置目标任务
      const activeId = active.id as string;
      const overId = over.id as string;

      const draggedTask = tasks.find((item) => item.id === activeId);
      const targetTask = tasks.find((item) => item.id === overId);

      if (!draggedTask || !targetTask) {
        setTempTasks(null);
        return;
      }

      // 检查目标是否为FilterGroup
      const isTargetFilterGroup = over.data?.current?.type === "FilterGroup";

      // 使用handleDragOver中已经处理好的临时状态作为最终结果
      if (tempTasks) {
        if (isTargetFilterGroup && over.data?.current?.groupKey) {
          // 如果是拖入FilterGroup，添加到目标分组的localTask
          dispatchTodo({
            type: "add_to_group",
            todoList: tempTasks,
            groupKey: over.data.current.groupKey,
            listId: targetTask.listId,
          });
        } else {
          // 一次性替换整个列表，使用目标任务的listId
          dispatchTodo({
            type: "replaced",
            todoList: tempTasks,
            listId: targetTask.listId,
          });
        }
      }

      // 清除临时状态
      setTempTasks(null);*/
    },
    [tasks, tempTasks, dispatchTodo],
  );

  return {
    expandedTasks,
    sensors,
    handleDragOver,
    toggleTaskExpand,
    hasSubTasks,
    getHierarchicalTasks,
    getHierarchicalTasksForGroup,
    handleDragEnd,
  };
}
