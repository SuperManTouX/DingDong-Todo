import React, { useState } from "react";
import type { TodoItemProps } from "@/types";
import { Priority } from "@/constants";
import "./TodoItem.css";
import { Collapse } from "react-bootstrap";
import { Col, Row } from "antd";
import dayjs from "dayjs";

import SubTodoItem from "@/SubTodoItem";
import { RightOutlined } from "@ant-design/icons";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import ContextMenu from "@/ContextMenu";

export default function TodoItem({
  todo,
  onTodoChange,
  onTodoDelete,
  other,
}: TodoItemProps) {
  const [editType, setEditType] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const [subOpen, setSubOpen] = useState(false);

  let priClass;
  switch (todo.priority) {
    case Priority.Low:
      priClass = "low-todo";
      break;
    case Priority.Medium:
      priClass = "medium-todo";
      break;
    case Priority.High:
      priClass = "high-todo";
      break;
    default:
      priClass = "";
  }

  // 双击编辑
  function updateEditType(test: string) {
    setEditType(true);
    setText(test);
  }

  // 更新Todo
  function handleEditChanged(changeTest: string) {
    setText(changeTest);
  }

  // 渲染双击编辑输入框
  function renderEditInput() {
    if (editType) {
      return (
        <input
          type="text"
          autoFocus
          value={text}
          onChange={(e) => handleEditChanged(e.currentTarget.value)}
          onBlur={() => {
            onTodoChange({
              type: "changed",
              todo: {
                ...todo,
                text,
              },
            });
            setEditType(false);
          }}
        />
      );
    } else {
      return (
        <span
          onDoubleClick={(e: React.MouseEvent<HTMLSpanElement>) =>
            updateEditType(e.currentTarget.innerText)
          }
        >
          {todo.text}
        </span>
      );
    }
  }

  // 倒计时
  const renderCountdown = () => {
    if (!todo.deadline && !todo.datetimeLocal) return null;
    const leftDay = dayjs(todo.deadline).diff(dayjs(), "day");
    if (leftDay > 1) return <span className="text-primary">{leftDay}天</span>;
    if (leftDay == 0) return <span className="text-primary">今天</span>;
    if (leftDay == 1) return <span className="text-primary">明天</span>;
    if (leftDay < 0)
      return (
        <span className="text-danger">
          {dayjs(todo.deadline).format("MM月DD日")}
        </span>
      );
    // <span className="text-danger">已逾期{Math.abs(dayjs(todo.deadline).diff(dayjs(), 'day'))}天</span>
  };

  const SubList = () => {
    if (todo?.subTodo) {
      return (
        <Droppable droppableId="subTodo" type="SUB">
          {(provided) => (
            <Collapse in={subOpen}>
              <ul
                id="subList"
                className=" ps-4"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {/*可拖动列表*/}
                {todo.subTodo?.map((st, index) => (
                  <Draggable
                    key={st.subId}
                    draggableId={st.subId}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <ContextMenu
                          todo={st}
                          onTodoChange={onTodoChange}
                          onTodoDelete={onTodoDelete}
                        >
                          <div
                            onContextMenu={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            style={{ cursor: "context-menu" }}
                          >
                            <SubTodoItem
                              todoId={todo.id}
                              key={st.subId}
                              subTodo={st}
                              onSubTodoChange={onTodoChange}
                              onSubTodoDelete={onTodoDelete}
                            />
                          </div>
                        </ContextMenu>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            </Collapse>
          )}
        </Droppable>
      );
    }
    return null;
  };
  // 展开收齐子任务列表
  const renderSubIcon = () => {
    if (todo?.subTodo && todo.subTodo.length > 0) {
      return (
        <RightOutlined
          className="me-2"
          style={{ fontSize: 10 }}
          rotate={subOpen ? 90 : 0}
          onClick={() => setSubOpen(!subOpen)}
          aria-controls="subList"
        />
      );
    }

    return null;
  };

  return (
    <>
      <li
        className={`row d-flex justify-content-between highlight rounded p-1  ${other ? "opacity-25" : ""}`}
      >
        <Row justify={"start"} align={"middle"} className="ps-0">
          <Col span={1}>
            <span>{renderSubIcon()}</span>
          </Col>
          <Col span={15} className="d-flex  w-50 lh-base align-items-center">
            <input
              type="checkbox"
              className={`me-1 ${priClass}`}
              checked={todo.completed}
              onChange={(e) =>
                onTodoChange({
                  type: "changed",
                  todo: {
                    ...todo,
                    completed: e.target.checked,
                  },
                })
              }
            />
            {renderEditInput()}
          </Col>
          <Col
            span={8}
            className="d-flex justify-content-end align-items-center"
          >
            <span>{renderCountdown()}</span>
          </Col>
        </Row>
        {/*子任务列表*/}
        {SubList()}
        {/*编辑折叠框*/}
      </li>
    </>
  );
}
