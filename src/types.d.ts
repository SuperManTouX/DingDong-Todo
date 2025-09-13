
import type {Priority} from '../constants';

export type Priority = typeof Priority[keyof typeof Priority];
import {ShowType, type ShowTypeValue} from "@/constants";

export type ShowType = typeof ShowType[keyof typeof ShowType];
interface Todo {
    id: string,
    text: string,
    completed: boolean,
    priority: number,
    datetimeLocal?:string,
    deadline?:string,
}

interface TodoAddAction {
    type: 'added',
    text: string,
    completed: false
}

interface TodoChangedAction {
    type: 'changed',
    todo: Todo
}

interface TodoDeletedAction {
    type: 'deleted',
    deleteId: string,
}

interface TodoReplaceAction {
    type: 'replaced',
    todoList: Todo[]
}

interface TodoCompleteAllAction {
    type: 'completedAll',
    completeOrUncomplete: boolean,
    showType?:ShowTypeValue,
}

interface TodoDeleteAllCompleteAction {
    type: 'deletedAll',
    todoList: Todo[]
}

type TodoAction =
    TodoAddAction
    | TodoChangedAction
    | TodoDeletedAction
    | TodoReplaceAction
    | TodoCompleteAllAction
    | TodoDeleteAllCompleteAction


interface TodoItemProps {
    todo: Todo
    onTodoChange: (TodoChangedAction) => void,
    onTodoDelete: (TodoDeletedAction) => void,
    sub?: boolean
}


interface ControllerProps {
    isAllDone: boolean
    onSwitchShow: (showType:ShowTypeValue) => void
    onCompleteAll: (action:TodoCompleteAllAction) => void
    showType: ShowType
}
