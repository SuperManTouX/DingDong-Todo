import type { Todo, TodoAction } from "@/types";
import { Priority, ShowType } from "@/constants";
import { v4 as uuidv4 } from "uuid";

//todoReducer
export default function reducer(draft: Todo[], action: TodoAction) {
  switch (action.type) {
    case "completedAll":
      const { completeOrUncomplete, showType = ShowType.all } = action;
      switch (showType) {
        case ShowType.all:
          draft.forEach((t) => {
            t.completed = completeOrUncomplete;
          });
          break;
        case ShowType.completed:
          draft.forEach((t) => {
            if (t.completed) {
              t.completed = completeOrUncomplete;
            }
          });
          break;
        case ShowType.uncompleted:
          draft.forEach((t) => {
            if (!t.completed) {
              t.completed = completeOrUncomplete;
            }
          });
          break;
        case ShowType.overdue:
          // 处理逾期任务
          draft.forEach((t) => {
            const isOverdue =
              t.deadline && new Date(t.deadline) < new Date() && !t.completed;
            if (isOverdue) {
              t.completed = completeOrUncomplete;
            }
          });
          break;
      }
      break;
    case "toggle": {
      const todo = draft.find((t) => t.id === action.todoId);
      if (todo) {
        todo.completed = action.newCompleted;

        // 如果当前任务是父任务，同步所有子任务的状态
        // 查找所有直接子任务
        const childTasks = draft.filter((t) => t.parentId === todo.id);
        if (childTasks.length > 0) {
          // 递归更新所有子任务及其子任务
          function updateChildTasks(parentId: string, newCompleted: boolean) {
            const children = draft.filter((t) => t.parentId === parentId);
            children.forEach((child) => {
              child.completed = newCompleted;
              // 递归更新子任务的子任务
              updateChildTasks(child.id, newCompleted);
            });
          }

          updateChildTasks(todo.id, action.newCompleted);
        }

        // 如果该任务是子任务，检查父任务是否应该完成
        if (todo.parentId) {
          const parentTodo = draft.find((t) => t.id === todo.parentId);
          if (parentTodo) {
            // 查找所有父任务的子任务
            const allChildTasks = draft.filter(
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

      return;
    }
    case "deleted":
      return draft.filter((d) => d.id !== action.deleteId);
    case "deletedAll":
      return draft.filter((d) => !d.completed);
    case "added":
      draft.push({
        id: uuidv4(),
        text: action.text,
        completed: action.completed,
        priority: Priority.None,
        parentId: action.parentId || null, // 支持添加子任务
        depth: action.depth || 0, // 根任务深度为0
      });
      break;
    case "changed":
      let i = draft.findIndex((d) => d.id == action.todo.id);
      draft[i] = action.todo;
      break;
    // 拖动排序专属
    case "replaced":
      return action.todoList;

    /* 扁平化结构下，子任务作为普通任务处理，不再需要专门的子任务action */
    /* 新增子任务可以通过添加一个新的Todo项并设置正确的parentId和depth来实现 */
  }
  //计算是否全部完成，如果是，打钩
}
