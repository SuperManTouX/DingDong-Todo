import React, { useState } from "react";
import type { SubTodoItemProps } from "@/types";
import { Priority, PriorityName } from "@/constants";
import "./TodoItem.css";
import { Button, Card, Collapse, Dropdown } from "react-bootstrap";
import { Col, DatePicker, Row } from "antd";
import dayjs from "dayjs";

import type { RangePickerProps } from "antd/es/date-picker";

const { RangePicker } = DatePicker;

export default function SubTodoItem({
  todoId,
  subTodo,
  onSubTodoChange,
  onSubTodoDelete,
  other,
}: SubTodoItemProps) {
  const [editType, setEditType] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  // 展开折叠筐
  const [open, setOpen] = useState(false);

  let priClass;
  switch (subTodo.subPriority) {
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
            onSubTodoChange({
              subId: subTodo.subId,
              todoId: todoId,
              type: "change_sub",
              newSubTodo: {
                ...subTodo,
                subText: text,
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
          {subTodo.subText}
        </span>
      );
    }
  }

  // 更改时间
  const handleTodoDeadLineChange: RangePickerProps["onChange"] = (dates) => {
    // @ts-ignore
    const [local, deadLine] = dates;
    onSubTodoChange({
      subId: subTodo.subId,
      todoId: todoId,
      type: "change_sub",
      newSubTodo: {
        ...subTodo,
        subDatetimeLocal: dayjs(local).format(),
        subDeadline: dayjs(deadLine).format(),
      },
    });
  };

  // 倒计时
  const renderCountdown = () => {
    if (!subTodo.subDeadline && !subTodo.subDatetimeLocal) return null;
    const leftDay = dayjs(subTodo.subDeadline).diff(dayjs(), "day");
    if (leftDay >= 0)
      return <span>{dayjs(subTodo.subDeadline).diff(dayjs(), "day")}天</span>;
    if (leftDay == 0) return <span>今天</span>;
    if (leftDay == 1) return <span>明天</span>;
    if (leftDay < 0)
      return (
        <span className="text-danger">
          {dayjs(subTodo.subDeadline).format("MM月DD日")}
        </span>
      );
  };

  return (
    <>
      <li
        className={`row sub-highlight d-flex justify-content-between rounded p-1  ${other ? "opacity-25" : ""}`}
      >
        <Row justify={"start"} align={"middle"} className="ps-0">
          {/*勾选框和todo内容*/}
          <Col
            offset={1}
            span={15}
            className="d-flex  w-50 lh-base align-items-center"
          >
            <span className="d-flex  w-50 lh-base align-items-center">
              {/* 完成单个任务*/}
              <input
                type="checkbox"
                className={`me-1 ${priClass}`}
                checked={subTodo.subCompleted}
                onChange={(e) =>
                  onSubTodoChange({
                    subId: subTodo.subId,
                    todoId: todoId,
                    type: "change_sub",
                    newSubTodo: {
                      ...subTodo,
                      subCompleted: e.target.checked,
                    },
                  })
                }
              />
              {renderEditInput()}
            </span>
          </Col>
          {/*截止时间*/}
          <Col span={8}>
            <span className="d-flex justify-content-end align-items-center">
              <span>{renderCountdown()}</span>
              <Button
                onClick={() => setOpen(!open)}
                aria-controls="EditTodo"
                aria-expanded={open}
                variant="primary"
                className="me-2"
              >
                编辑
              </Button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() =>
                  onSubTodoDelete({
                    type: "deleteSub_sub",
                    subId: subTodo.subId,
                    todoId: todoId,
                  })
                }
              >
                删除
              </button>
            </span>
          </Col>
        </Row>
        {/*编辑折叠框*/}
        <Collapse in={open}>
          <div id="EditTodo">
            <Card>
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <span>优先级：</span>
                  {/*优先级选择器*/}
                  <Dropdown
                    className="d-inline-block"
                    onSelect={(eventKey) => {
                      onSubTodoChange({
                        subId: subTodo.subId,
                        todoId: todoId,
                        type: "change_sub",
                        newSubTodo: {
                          ...subTodo,
                          subPriority: Number(eventKey),
                        },
                      });
                    }}
                  >
                    <Dropdown.Toggle variant="primary" id="dropdown-basic">
                      {
                        // @ts-ignore
                        PriorityName[String(subTodo.subPriority)]
                      }
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {Object.entries(Priority).map(([k, v]) => {
                        return (
                          <Dropdown.Item key={k} eventKey={v}>
                            {k}
                          </Dropdown.Item>
                        );
                      })}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                <div>
                  <span>任务开始结束时间：</span>
                  {/*时间选择器*/}
                  <RangePicker
                    onChange={handleTodoDeadLineChange}
                    size="small"
                  />
                </div>
              </Card.Body>
            </Card>
          </div>
        </Collapse>
      </li>
    </>
  );
}
