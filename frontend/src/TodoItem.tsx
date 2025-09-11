import React, {useState} from "react";


export default function TodoItem({todo, onTodoChange, onTodoDelete, sub}: TodoItemProps) {
    const [editType, setEditType] = useState<boolean>(false)
    const [text, setText] = useState<string>('')

    function updateEditType(test: string) {
        setEditType(true)
        setText(test)
    }

    function handleEditChanged(changeTest:string) {
        setText(changeTest)
    }

    function renderEditInput() {
        if (editType) {
            return (
                <input type="text"  autoFocus value={text} onChange={(e)=>handleEditChanged(e.currentTarget.value)} onBlur={() => {
                    onTodoChange({
                        type: 'changed',
                        todo: {
                            ...todo,
                            text,
                        }
                    })
                    setEditType(false)
                }}/>
            )
        } else {
            return (
                <span onDoubleClick={(e:React.MouseEvent<HTMLSpanElement>) => updateEditType(e.currentTarget.innerText)}>{todo.text}</span>
            )
        }
    }

    return (
        <>
            <li className={`d-flex justify-content-between ${sub ? 'opacity-25' : ''}`}>
                <span className="w-75"><input type="checkbox"
                             checked={todo.completed}
                             onChange={(e) =>
                                 onTodoChange({
                                     type: 'changed',
                                     todo: {
                                         ...todo,
                                         completed: e.target.checked
                                     }
                                 })
                             }/>{renderEditInput()}</span>


                <span className="d-flex justify-content-end w-25"><button
                    type="button" className="btn btn-secondary btn-sm">编辑</button>
                    <button type="button" className="btn btn-danger btn-sm"
                            onClick={() => onTodoDelete({type: 'deleted', deleteId: todo.id})}>删除</button></span>
            </li>
        </>
    );
};