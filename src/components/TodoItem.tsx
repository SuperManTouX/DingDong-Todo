import { useState } from "react";
import { RightOutlined } from "@ant-design/icons";
import { Priority } from "@/constants";
import "../styles/TodoItem.css";
import { Col, message, Row } from "antd";
import dayjs from "dayjs";
import type { TodoItemProps } from "@/types";

export default function TodoItem({
  todo,
  onTodoChange,
  other = false,
  hasSubTasks = false,
  isExpanded = false,
  onToggleExpand,
}: TodoItemProps) {
  const [text, setText] = useState<string>(todo.text);

  // // 当todo.text为空时，自动进入编辑模式
  // useEffect(() => {
  //   if (todo.text === "") {
  //     setText("");
  //   } else {
  //     setText(todo.text);
  //   }
  // }, [todo.text]);

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

  // 更新Todo
  function handleEditChanged(changeTest: string) {
    setText(changeTest);
  }

  // 渲染双击编辑输入框
  function renderEditInput() {
    return (
      <input
        type="text"
        autoFocus
        className="w-100"
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
        }}
        style={{
          border: "none",
          backgroundColor: "transparent",
          outline: "none",
          width: "100%",
          padding: "0",
        }}
      />
    );
  }

  // 倒计时
  const renderCountdown = () => {
    if (!todo.deadline && !todo.datetimeLocal) return null;
    const leftDay = dayjs(todo.deadline).diff(dayjs(), "day");
    if (leftDay > 1)
      return (
        <span className="text-primary d-inline-block text-end w-100">
          {leftDay}天
        </span>
      );
    if (leftDay == 0)
      return (
        <span className="text-primary d-inline-block text-end w-100">今天</span>
      );
    if (leftDay == 1)
      return (
        <span className="text-primary d-inline-block text-end w-100">明天</span>
      );
    if (leftDay < 0)
      return (
        <span className="text-danger d-inline-block text-end w-100">
          {dayjs(todo.deadline).format("MM月DD日")}
        </span>
      );
    // <span className="text-danger">已逾期{Math.abs(dayjs(todo.deadline).diff(dayjs(), 'day'))}天</span>
  };

  // SubList函数已移除，子任务现在在TodoList中直接渲染
  // 子任务图标已移除，子任务现在在TodoList中直接渲染;

  return (
    <>
      <li
        className={`cursor-pointer row d-flex justify-content-between highlight rounded pe-0 ps-0 pt-0 pb-0  ${other ? "opacity-25" : ""}`}
      >
        <Row justify={"space-between"} align={"middle"} className="ps-0">
          <Col span={1}>
            <Row justify={"end"} align={"middle"}>
              {hasSubTasks && onToggleExpand && (
                <RightOutlined
                  style={{
                    marginRight: "3px",
                    fontSize: "8px",
                    cursor: "pointer",
                    transition: "transform 0.3s",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand();
                  }}
                />
              )}
            </Row>
          </Col>
          <Col
            span={23}
            className="d-flex lh-base align-items-center h-100 border-bottom "
          >
            <input
              type="checkbox"
              className={`me-1 mt-2 mb-2 ${priClass}`}
              checked={todo.completed}
              onChange={(e) => {
                onTodoChange({
                  type: "toggle",
                  todoId: todo.id,
                  newCompleted: e.currentTarget.checked,
                });
                if (e.currentTarget.checked) message.info(`已完成${todo.text}`);
              }}
            />
            <Row justify={"end"} className="w-100 " align={"middle"}>
              <Col span={20}>{renderEditInput()}</Col>

              <Col span={4}>{renderCountdown()}</Col>
            </Row>
          </Col>
        </Row>
        {/*子任务列表已移除，子任务现在在TodoList中直接渲染*/}
        {/*编辑折叠框*/}
      </li>
    </>
  );
}
