interface Todo {
    id: string,
    text: string,
    completed: boolean
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
    type: 'completeAll',
    completeOrUncomplete: boolean
}

type TodoAction = TodoAddAction | TodoChangedAction | TodoDeletedAction | TodoReplaceAction | TodoCompleteAllAction

interface TodoItemProps {
    todo: Todo
    onTodoChange: (TodoAction) => void,
    onTodoDelete: (TodoAction) => void,
    sub?:boolean
}

interface ControllerProps {
    isAllDone: boolean
    onSwitchShow: (ShowType) => void
    onCompleteAll: (boolean) => void
}

