interface Todo {
    id: string,
    text: string,
    completed: boolean,
    priority?: number
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
    showType: ShowType
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
    onTodoChange: (TodoAction) => void,
    onTodoDelete: (TodoAction) => void,
    sub?: boolean
}


interface ControllerProps {
    isAllDone: boolean
    onSwitchShow: (ShowType) => void
    onCompleteAll: (boolean) => void
}

import type {Priority} from '../constants';

export type Priority = typeof Priority[keyof typeof Priority];
import type {ShowType} from '../constants';

export type ShowType = typeof ShowType[keyof typeof ShowType];