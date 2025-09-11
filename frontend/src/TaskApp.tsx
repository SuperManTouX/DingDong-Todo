import {useState} from 'react';
import {useReducer} from "react";
// import AddTask from './AddTask.js';
// import TaskList from './TaskList.js';

type Tasks = Task[]
type Task = {
    id: number,
    text: string,
    done: boolean
}
type TaskAction = {
    type: "added",
    id: number,
    text: string,
    done: boolean
} | {
    type: 'changed',
    task: Task
} | {
    type: 'deleted',
    deleteTaskId: number,
}
export default function TaskApp() {
    // const [tasks, setTasks] = useState(initialTasks)<Tasks>;
    const [tasks, dispatch] = useReducer(tasksReducer, initialTasks)<Tasks>;
    // const [tasks, dispatch] = useImmerReducer(tasksReducer,initialTasks)<Tasks>;

// immer
    function tasksReducer(tasks: Tasks, action: TaskAction) {
        // function tasksReducer(draft: Tasks, action: TaskAction) {
        switch (action.type) {
            case "added":
                return [...tasks, {id: action.id, text: action.text, done: action.done}]
            // draft.push({id: action.id, text: action.text, done: action.done}) break
            case "changed":
                return tasks.map(t => {
                    if (t.id === action.task.id) {
                        return action.task
                    }
                    return t
                })
            // draft[draft.findIndex(t=>t.id===action.task.id)] = action.task break
            case "deleted":
                return tasks.filter(t => t.id !== action.deleteTaskId)
            // draft.delete(t=>t.id !== action.deleteTaskId) break
            default:
                throw Error("unknown action type")
        }

    }

    function handleAddTask(text: string) {
        // setTasks([
        //     ...tasks,
        //     {
        //         id: nextId++,
        //         text: text,
        //         done: false,
        //     },
        // ]);
        dispatch({
            type: 'added',
            id: nextId++,
            text,
            done: false

        })
    }

    function handleChangeTask(task) {
        // setTasks(
        //     tasks.map((t) => {
        //         if (t.id === task.id) {
        //             return task;
        //         } else {
        //             return t;
        //         }
        //     })
        // );
        dispatch({
            type: 'changed',
            task,
        })
    }

    function handleDeleteTask(taskId) {
        // setTasks(tasks.filter((t) => t.id !== taskId));
        dispatch({
            type: 'deleted',
            deleteTaskId: taskId,
        })

    }

    return (
        <>
            <h1>布拉格的行程安排</h1>
            {/*<AddTask onAddTask={handleAddTask} />*/}
            {/*<TaskList*/}
            {/*    tasks={tasks}*/}
            {/*    onChangeTask={handleChangeTask}*/}
            {/*    onDeleteTask={handleDeleteTask}*/}
            {/*/>*/}
        </>
    );
}

let nextId = 3;
const initialTasks = [
    {id: 0, text: '参观卡夫卡博物馆', done: true},
    {id: 1, text: '看木偶戏', done: false},
    {id: 2, text: '打卡列侬墙', done: false},
];
