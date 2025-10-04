import { useState, useCallback } from "react";
import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/types";
import { PointerSensor, KeyboardSensor, useSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { SpecialLists } from "@/constants";
import { throttle } from "lodash";

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
  const { dispatchTodo, activeListId, pinnedTasks, updateTodoLocally } =
    useTodoStore();
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

        // 仅在任务展开状态下添加子任务
        if (subTasks.length > 0 && expandedTasks[task.id]) {
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

  // 使用lodash的throttle函数创建节流处理函数
  const throttledDragUpdate = useCallback(
    throttle((active: any, over: any) => {
      const activeId = active.id as string;
      const overId = over.id as string;
      const overContainerId = over.data.current.sortable.containerId as string;
      // 获取拖动和放置的任务
      const draggedTask = tasks.find((item) => item.id === activeId);
      const targetTask = tasks.find((item) => item.id === overId);
      if (!draggedTask || !overContainerId) return;

      console.log(activeListId, SpecialLists);
      
      // 获取被拖动任务的所有子任务
      const findSubtasks = (parentId: string): Todo[] => {
        const directSubtasks = tasks.filter(
          (task) => task.parentId === parentId,
        );
        let allSubtasks: Todo[] = [...directSubtasks];

        // 递归查找所有嵌套子任务
        directSubtasks.forEach((subtask) => {
          allSubtasks = [...allSubtasks, ...findSubtasks(subtask.id)];
        });

        return allSubtasks;
      };

      const subtasks = findSubtasks(draggedTask.id);
      
      // 确定要更新的字段
      let updateFields: Partial<Todo> = {};

      if (activeListId.indexOf("tag") !== -1) {
        // 当激活的列表ID包含"tag"时，将draggedTask的listId更新为over的listId
        console.log("tag", targetTask);
        updateFields = {
          listId: targetTask.listId,
          groupId: null,
        };
      } else if (activeListId in SpecialLists) {
        updateFields = {
          // 如果有参考任务，则使用其deadline
          deadline: targetTask.deadline
            ? targetTask.deadline
            : draggedTask.deadline,
        };
      } else {
        updateFields = {
          // 使用确定的目标分组ID
          groupId: overContainerId,
        };
      }
      
      // 更新拖动的任务
      updateTodoLocally({
        ...draggedTask,
        ...updateFields,
      });
      
      // 更新所有子任务
      subtasks.forEach((subtask) => {
        updateTodoLocally({
          ...subtask,
          ...updateFields,
        });
      });
    }, 100), // 限制为每100ms最多执行一次
    [tasks, updateTodoLocally, activeListId],
  );

  // 拖动时 - 使用useCallback包装并调用节流函数
  const handleDragOver = useCallback(
    (event: any) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // 使用节流来限制状态更新频率
      throttledDragUpdate(active, over);
    },
    [throttledDragUpdate],
  );

  // 拖动排序方法 - 使用@dnd-kit处理拖拽排序和层级转换
  const handleDragEnd = useCallback(
    async (event: any) => {
      const { active, over } = event;
      console.log(over);

      // 获取拖动任务和放置目标任务
      const activeId = active.id as string;
      const overId = over.id as string;
      const overContainerId = over.data.current.sortable.containerId as string;

      const draggedTask = tasks.find((item) => item.id === activeId);
      const targetTask = tasks.find((item) => item.id === overId);
      if (!draggedTask || !overContainerId) {
        return;
      }

      // 获取被拖动任务的所有子任务
      const findSubtasks = (parentId: string): Todo[] => {
        const directSubtasks = tasks.filter(
          (task) => task.parentId === parentId,
        );
        let allSubtasks: Todo[] = [...directSubtasks];

        // 递归查找所有嵌套子任务
        directSubtasks.forEach((subtask) => {
          allSubtasks = [...allSubtasks, ...findSubtasks(subtask.id)];
        });

        return allSubtasks;
      };

      const subtasks = findSubtasks(draggedTask.id);
      // 更新被拖动任务及其所有子任务
      const updateTaskAndSubtasks = async () => {
        try {
          // 确定要更新的字段
          let updateFields: Partial<Todo> = {};

          if (activeListId in SpecialLists) {
            // 在特殊列表中，更新deadline
            updateFields.deadline =
              targetTask?.deadline || draggedTask.deadline;
          } else if (activeListId.indexOf("tag") !== -1) {
            // 在特殊列表中，更新deadline
            updateFields.listId = targetTask.listId;
            updateFields.groupId = null;
          } else {
            // 在普通列表中，更新groupId
            updateFields.groupId = overContainerId;
          }
          console.log(updateFields);
          // 更新拖动的任务
          await dispatchTodo({
            type: "changed",
            todo: {
              ...draggedTask,
              ...updateFields,
            },
          });

          // 更新所有子任务
          for (const subtask of subtasks) {
            await dispatchTodo({
              type: "changed",
              todo: {
                ...subtask,
                ...updateFields,
              },
            });
          }
        } catch (error) {
          console.error("更新任务和子任务失败:", error);
        }
      };

      // 执行更新
      await updateTaskAndSubtasks();
    },
    [tasks, dispatchTodo, activeListId],
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
