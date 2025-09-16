import React, { useState } from "react";
import type { SubTodoItemProps } from "@/types";
import { Priority } from "@/constants";
import "./TodoItem.css";
import { Col, message, Row } from "antd";
import dayjs from "dayjs";

export default function SubTodoItem({
  subTodo,
  onSubTodoChange,
  other,
}: SubTodoItemProps) {
  const [editType, setEditType] = useState<boolean>(false);
  const [text, setText] = useState<string>("");

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
    if (editType || !subTodo.subText) {
      return (
        <input
          type="text"
          autoFocus
          value={text}
          onChange={(e) => handleEditChanged(e.currentTarget.value)}
          onBlur={() => {
            onSubTodoChange({
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
          className="w-100 h-100 text-start"
          onDoubleClick={(e: React.MouseEvent<HTMLSpanElement>) =>
            updateEditType(e.currentTarget.innerText)
          }
        >
          {subTodo.subText}
        </span>
      );
    }
  }

  // 倒计时
  const renderCountdown = () => {
    if (!subTodo.subDeadline && !subTodo.subDatetimeLocal) return null;
    const leftDay = dayjs(subTodo.subDeadline).diff(dayjs(), "day");
    if (leftDay >= 0) return <span className="text-primary">{leftDay}天</span>;
    if (leftDay == 0) return <span className="text-primary">今天</span>;
    if (leftDay == 1) return <span className="text-primary">明天</span>;
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
        className={`row sub-highlight d-flex justify-content-between rounded ps-4 p-1  ${other ? "opacity-25" : ""}`}
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
                onChange={(e) => {
                  onSubTodoChange({
                    type: "change_sub",
                    newSubTodo: {
                      ...subTodo,
                      subCompleted: e.target.checked,
                    },
                  });
                  if (e.currentTarget.checked) message.info(`已完成`);
                }}
              />
              {renderEditInput()}
            </span>
          </Col>
          {/*截止时间*/}
          <Col
            span={8}
            className="d-flex justify-content-end align-items-center"
          >
            <span>{renderCountdown()}</span>
          </Col>
        </Row>
      </li>
    </>
  );
}
