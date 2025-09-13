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
        case "replaced":

            return action.todoList
    }
    //计算是否全部完成，如果是，打钩

}