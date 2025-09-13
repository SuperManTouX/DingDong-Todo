import {v4 as uuidv4} from 'uuid';
import type {Todo, TodoAction} from "@/types";
import {Priority, ShowType} from "@/constants";


//todoReducer
export default function reducer(draft: Todo[], action: TodoAction,) {
    switch (action.type) {
        case "completedAll":
            switch (action.showType) {
                case ShowType.all:
                    draft.forEach((t) => t.completed = action.completeOrUncomplete)
                    break;
                case ShowType.completed:
                    draft.forEach((t) => {
                        if (t.completed) {
                            t.completed = false
                        }
                    })
                    break
                case ShowType.uncompleted:
                    draft.forEach((t) => {
                        if (!t.completed) {
                            t.completed = true
                        }
                    })
                    break

            }
            break;
        case "deleted":
            return draft.filter(d => d.id !== action.deleteId)
        case "deletedAll":
            return draft.filter(d => !d.completed)
        case "added":
            draft.push({id: uuidv4(), text: action.text, completed: action.completed, priority: Priority.None})
            break;
        case "changed":
            let i = draft.findIndex(d => d.id == action.todo.id)
            draft[i] = action.todo
            break
        // 拖动排序专属
        case "replaced":
            return action.todoList

        /* 1. 切换子任务完成状态 */
        case 'toggle_sub': {
            const parent = draft.find(t => t.id === action.todoId);
            if (!parent || !parent.subTodo) return;
            const sub = parent.subTodo.find(s => s.subId === action.subId);
            if (sub) sub.subCompleted = !sub.subCompleted;
            break;
        }
        // 更新子任务
        case 'change_sub': {
            const parent = draft.find(t => t.id === action.todoId);
            if (!parent || !parent.subTodo) return;

            const idx = parent.subTodo.findIndex(s => s.subId === action.subId);
            if (idx === -1) return;

            parent.subTodo[idx] = action.newSubTodo; // 整颗替换
            parent.completed = parent.subTodo.every(s => s.subCompleted);
            break;
        }

        /* 3. 新增子任务 */
        case 'addSub_sub': {
            const parent = draft.find(t => t.id === action.todoId);
            if (!parent) return;
            if (!parent.subTodo) parent.subTodo = [];          // 首次创建数组
            parent.subTodo.push({
                subId: uuidv4(),
                subText: action.text,
                subCompleted: false,
                subPriority: Priority.None,
            });
            break;
        }

        /* 4. 删除子任务 */
        case 'deleteSub_sub': {
            const parent = draft.find(t => t.id === action.todoId);
            if (!parent || !parent.subTodo) return;
            const idx = parent.subTodo.findIndex(s => s.subId === action.subId);
            if (idx !== -1) parent.subTodo.splice(idx, 1);
            break;
        }
    }
    //计算是否全部完成，如果是，打钩

}