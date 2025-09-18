import type { TodoListData, TodoActionExtended } from "@/types";
import { Priority, ShowType } from "@/constants";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

// 重构后的reducer，处理TodoListData[]数组
export default function reducer(
  draft: TodoListData[],
  action: TodoActionExtended,
) {
  switch (action.type) {
    case "completedAll": {
      const { completeOrUncomplete, showType = ShowType.all, groupId } = action;
      const targetGroup = draft.find((group) => group.id === groupId);

      if (!targetGroup) return;

      switch (showType) {
        case ShowType.all:
          targetGroup.tasks.forEach((t) => {
            t.completed = completeOrUncomplete;
          });
          break;
        case ShowType.completed:
          targetGroup.tasks.forEach((t) => {
            if (t.completed) {
              t.completed = completeOrUncomplete;
            }
          });
          break;
        case ShowType.uncompleted:
          targetGroup.tasks.forEach((t) => {
            if (!t.completed) {
              t.completed = completeOrUncomplete;
            }
          });
          break;
        case ShowType.overdue:
          // 处理逾期任务
          targetGroup.tasks.forEach((t) => {
            const isOverdue =
              t.deadline && new Date(t.deadline) < new Date() && !t.completed;
            if (isOverdue) {
              t.completed = completeOrUncomplete;
            }
          });
          break;
      }
      targetGroup.updatedAt = dayjs().format();
      break;
    }
    case "toggle": {
      const { todoId, newCompleted, groupId } = action;
      const targetGroup = draft.find((group) => group.id === groupId);

      if (!targetGroup) return;

      const todo = targetGroup.tasks.find((t) => t.id === todoId);
      if (todo) {
        todo.completed = newCompleted;

        // 如果当前任务是父任务，同步所有子任务的状态
        // 查找所有直接子任务
        const childTasks = targetGroup.tasks.filter(
          (t) => t.parentId === todo.id,
        );
        if (childTasks.length > 0) {
          // 递归更新所有子任务及其子任务
          function updateChildTasks(parentId: string, newCompleted: boolean) {
            // @ts-ignore
            const children = targetGroup.tasks.filter(
              (t) => t.parentId === parentId,
            );
            children.forEach((child) => {
              child.completed = newCompleted;
              // 递归更新子任务的子任务
              updateChildTasks(child.id, newCompleted);
            });
          }

          updateChildTasks(todo.id, newCompleted);
        }

        // 如果该任务是子任务，检查父任务是否应该完成
        if (todo.parentId) {
          const parentTodo = targetGroup.tasks.find(
            (t) => t.id === todo.parentId,
          );
          if (parentTodo) {
            // 查找所有父任务的子任务
            const allChildTasks = targetGroup.tasks.filter(
              (t) => t.parentId === parentTodo.id,
            );
            // 检查是否所有子任务都已完成
            const allChildrenCompleted = allChildTasks.every(
              (t) => t.completed,
            );

            // 如果所有子任务都已完成，则将父任务标记为完成
            // 如果有任何子任务未完成，则将父任务标记为未完成
            parentTodo.completed = allChildrenCompleted;
          }
        }
      }
      targetGroup.updatedAt = dayjs().format();
      break;
    }
    case "deleted": {
      const { deleteId, groupId } = action;
      const targetGroup = draft.find((group) => group.id === groupId);

      if (!targetGroup) return;

      targetGroup.tasks = targetGroup.tasks.filter((d) => d.id !== deleteId);
      targetGroup.updatedAt = dayjs().format();
      break;
    }
    case "deletedAll": {
      const { groupId } = action;
      const targetGroup = draft.find((group) => group.id === groupId);

      if (!targetGroup) return;

      targetGroup.tasks = targetGroup.tasks.filter((d) => !d.completed);
      targetGroup.updatedAt = dayjs().format();
      break;
    }
    case "added": {
      const { title, completed, parentId, depth, groupId } = action;
      const targetGroup = draft.find((group) => group.id === groupId);

      if (!targetGroup) return;

      targetGroup.tasks.push({
        id: uuidv4(),
        title: title,
        completed: completed,
        priority: Priority.None,
        parentId: parentId || null, // 支持添加子任务
        depth: depth || 0, // 根任务深度为0
      });
      targetGroup.updatedAt = dayjs().format();
      break;
    }
    case "changed": {
      const { todo, groupId } = action;
      const targetGroup = draft.find((group) => group.id === groupId);
      if (!targetGroup) return;

      let i = targetGroup.tasks.findIndex((d) => d.id == todo.id);
      targetGroup.tasks[i] = todo;
      targetGroup.updatedAt = dayjs().format();
      break;
    }
    // 拖动排序专属
    case "replaced": {
      const { todoList, groupId } = action;
      const targetGroup = draft.find((group) => group.id === groupId);

      if (!targetGroup) return;

      targetGroup.tasks = todoList;
      targetGroup.updatedAt = dayjs().format();
      break;
    }
    // 列表组管理相关操作
    case "addListGroup": {
      const { title, initialTasks = [], emoji } = action;
      const now = dayjs().format();

      draft.push({
        id: `group_${Date.now()}`,
        title,
        emoji,
        createdAt: now,
        updatedAt: now,
        tasks: initialTasks,
      });
      break;
    }
    case "updateListGroup": {
      const { groupId, title, emoji } = action;
      const targetGroup = draft.find((group) => group.id === groupId);

      if (!targetGroup) return;

      if (title) {
        targetGroup.title = title;
      }

      // 处理emoji更新
      if (emoji !== undefined) {
        targetGroup.emoji = emoji;
      }

      targetGroup.updatedAt = dayjs().format();
      break;
    }
    case "deleteListGroup": {
      const { groupId } = action;
      const index = draft.findIndex((group) => group.id === groupId);

      if (index !== -1) {
        draft.splice(index, 1);
      }
      break;
    }
    default:
      break;
  }
}
