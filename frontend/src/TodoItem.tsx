import React, {useState} from "react";
import type {TodoItemProps} from "@/types";
import {Priority, PriorityName} from "@/constants";
import './TodoItem.css'
import {Button, Card, Collapse, Dropdown} from "react-bootstrap";
import {DatePicker} from 'antd';
import dayjs from "dayjs";

import type {RangePickerProps} from "antd/es/date-picker";

const {RangePicker} = DatePicker;


export default function TodoItem({todo, onTodoChange, onTodoDelete, sub}: TodoItemProps) {
    const [editType, setEditType] = useState<boolean>(false)
    const [text, setText] = useState<string>('')
    // 展开折叠筐
    const [open, setOpen] = useState(false);

    let priClass;
    switch (todo.priority) {

        case Priority.Low:
            priClass = "low-todo"
            break
        case Priority.Medium:
            priClass = "medium-todo"
            break
        case Priority.High:
            priClass = "high-todo"
            break
        default:
            priClass = ""

    }

    // 双击编辑
    function updateEditType(test: string) {
        setEditType(true)
        setText(test)
    }

    // 更新Todo
    function handleEditChanged(changeTest: string) {
        setText(changeTest)
    }

    // 渲染双击编辑输入框
    function renderEditInput() {
        if (editType) {
            return (
                <input type="text" autoFocus value={text} onChange={(e) => handleEditChanged(e.currentTarget.value)}
                       onBlur={() => {
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
                <span
                    onDoubleClick={(e: React.MouseEvent<HTMLSpanElement>) => updateEditType(e.currentTarget.innerText)}>{todo.text}</span>
            )
        }
    }

    const handleTodoDeadLineChange: RangePickerProps['onChange'] = (dates) => {
        // @ts-ignore
        const [local, deadLine] = dates;
        onTodoChange({
            type: 'changed',
            todo: {...todo, datetimeLocal: dayjs(local).format(), deadline: dayjs(deadLine).format()}
        })
    }

    // function formatOverdueDay(leftDay: number) {
    //     if (leftDay >= 0) return (<span>{dayjs(todo.deadline).diff(dayjs(), 'day')}天</span>)
    //     if (leftDay == 0) return (<span>今天</span>)
    //     if (leftDay == 1) return (<span>明天</span>)
    //     if (leftDay < 0) return (
    //         <span className="text-danger">已逾期{Math.abs(dayjs(todo.deadline).diff(dayjs(), 'day'))}天</span>)
    //     return null
    // }
    // 倒计时
    const renderCountdown = () => {
        if (!todo.deadline && !todo.datetimeLocal) return null
        const leftDay = dayjs(todo.deadline).diff(dayjs(), 'day')
        if (leftDay >= 0) return (<span>{dayjs(todo.deadline).diff(dayjs(), 'day')}天</span>)
        if (leftDay == 0) return (<span>今天</span>)
        if (leftDay == 1) return (<span>明天</span>)
        if (leftDay < 0) return (
            <span className="text-danger">{dayjs(todo.deadline).format("MM月DD日")}</span>)
            // <span className="text-danger">已逾期{Math.abs(dayjs(todo.deadline).diff(dayjs(), 'day'))}天</span>

    }

    return (
        <>
            <li className={`row d-flex justify-content-between rounded p-1  ${sub ? 'opacity-25' : ''}`}>

                <div className="d-flex justify-content-between lh-base align-items-center">
                    <span className="d-flex  w-50 lh-base align-items-center">
                    <input type="checkbox"
                           className={`me-1 ${priClass}`}
                           checked={todo.completed}
                           onChange={(e) =>
                               onTodoChange({
                                   type: 'changed',
                                   todo: {
                                       ...todo,
                                       completed: e.target.checked
                                   }
                               })
                           }/>
                        {renderEditInput()}
                </span>
                    <span className="d-flex justify-content-end align-items-center">
                        <span>{renderCountdown()}</span>
                        <Button
                            onClick={() => setOpen(!open)}
                            aria-controls="EditTodo"
                            aria-expanded={open}
                            variant="primary"
                            className="me-2"
                        >编辑</Button>
                        <button type="button" className="btn btn-danger btn-sm"
                                onClick={() => onTodoDelete({type: 'deleted', deleteId: todo.id})}>删除</button>
                </span>
                </div>
                {/*编辑折叠框*/}
                <Collapse in={open}>
                    <div id="EditTodo">
                        <Card>
                            <Card.Body className="d-flex justify-content-between align-items-center">
                                <div>
                                    <span>优先级：</span>
                                    <Dropdown className="d-inline-block" onSelect={(eventKey,) => {
                                        onTodoChange({type: 'changed', todo: {...todo, priority: Number(eventKey)}})
                                    }}>
                                        <Dropdown.Toggle variant="primary" id="dropdown-basic">
                                            {// @ts-ignore
                                                PriorityName[String(todo.priority)]
                                            }
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            {Object.entries(Priority).map(([k, v]) => {
                                                return <Dropdown.Item key={k} eventKey={v}>{k}</Dropdown.Item>
                                            })}

                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                                <div>
                                    <span>任务开始结束时间：</span>
                                    <RangePicker onChange={handleTodoDeadLineChange} size="small"/>
                                </div>

                            </Card.Body>


                        </Card>
                    </div>
                </Collapse>

            </li>
        </>
    );
};