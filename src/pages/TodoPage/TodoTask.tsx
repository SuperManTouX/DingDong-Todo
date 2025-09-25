import { RightOutlined } from "@ant-design/icons";
import { Priority } from "@/constants";
import { Col, Input, Row, Tag, theme } from "antd";
import { message } from "@/utils/antdStatic";
import dayjs from "dayjs";
import type { TodoItemProps } from "@/types";
import { formatMessage, MESSAGES } from "@/constants/messages";
import isoWeek from "dayjs/plugin/isoWeek";
import { useTodoStore } from "@/store/todoStore";
import TimeCountDownNode from "./TimeCountDownNode";

dayjs.extend(isoWeek);
export default function TodoTask({
  todo,
  other = false,
  hasSubTasks = false,
  isExpanded = false,
  onToggleExpand,
}: TodoItemProps) {
  const { dispatchTodo, setSelectTodoId } = useTodoStore();
  const { token } = theme.useToken(); // 获取主题令牌

  // 基于优先级获取对应的样式颜色
  const getPriorityColor = () => {
    switch (todo.priority) {
      case Priority.Low:
        return token.colorPrimary;
      case Priority.Medium:
        return token.colorWarning;
      case Priority.High:
        return token.colorError;
      default:
        return token.colorPrimary;
    }
  };

  // 创建自定义复选框样式
  const customCheckboxStyle: React.CSSProperties = {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    width: "1rem",
    height: "1rem",
    margin: "0",
    verticalAlign: "middle",
    cursor: "pointer",
    border: `1px solid ${getPriorityColor()}`,
    borderRadius: "4px",
    backgroundColor: token.colorBgBase,
    position: "relative",
    outline: "none",
  };

  const customCheckboxCheckedStyle: React.CSSProperties = {
    ...customCheckboxStyle,
    backgroundColor: getPriorityColor(),
    borderColor: getPriorityColor(),
  };

  // 列表项悬停效果样式
  const todoItemHoverStyle: React.CSSProperties = {
    ":hover": {
      backgroundColor: token.colorBgElevated,
    },
  };

  // 渲染编辑输入框
  function renderEditInput() {
    return (
      <Input
        autoFocus
        value={todo.title}
        onChange={(e) => {
          if (todo) {
            dispatchTodo({
              type: "changed",
              todo: {
                ...todo,
                title: e.target.value,
              },
            });
          }
        }}
        style={{
          border: "none",
          backgroundColor: "transparent",
          outline: "none",
          width: "100%",
          padding: "0",
          boxShadow: "none",
        }}
        className="border-none bg-transparent"
      />
    );
  }

  // SubList函数已移除，子任务现在在TodoList中直接渲染
  // 子任务图标已移除，子任务现在在TodoList中直接渲染;

  return (
    <>
      <li
        className={`cursor-pointer row d-flex justify-content-between highlight rounded pe-0 ps-0 pt-1 pb-1  ${other ? "opacity-25" : ""}`}
        onClick={() => {
          if (setSelectTodoId) {
            setSelectTodoId(todo.id);
          }
        }}
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
            className="d-flex lh-base align-items-center h-100 border-bottom cursor-pointer"
            style={todoItemHoverStyle}
          >
            <div style={{ position: "relative", display: "inline-block" }}>
              <input
                type="checkbox"
                className={"me-2"}
                style={
                  todo.completed
                    ? customCheckboxCheckedStyle
                    : customCheckboxStyle
                }
                onMouseEnter={(e) => {
                  if (!e.currentTarget.checked) {
                    e.currentTarget.style.border = `2px solid ${getPriorityColor()}`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.checked) {
                    e.currentTarget.style.border = `1px solid ${getPriorityColor()}`;
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `1px solid ${getPriorityColor()}`;
                  e.currentTarget.style.outlineOffset = "1px";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = "none";
                }}
                checked={todo.completed}
                onChange={(e) => {
                  dispatchTodo({
                    type: "changed",
                    todo: { ...todo, completed: e.currentTarget.checked },
                  });
                  if (e.currentTarget.checked)
                    message.info(
                      formatMessage(MESSAGES.INFO.TASK_COMPLETED, {
                        taskTitle: todo.title,
                      }),
                    );
                }}
              />
              {todo.completed && (
                <div
                  style={{
                    position: "absolute",
                    left: "4px",
                    top: "6px",
                    width: "5px",
                    height: "10px",
                    border: "solid white",
                    borderWidth: "0 2px 2px 0",
                    transform: "rotate(45deg)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
            <Row justify={"space-between"} className="w-100 " align={"middle"}>
              <Col className={"w-100"}>{renderEditInput()}</Col>

              <Row
                style={{
                  position: "absolute",
                  right: 0,
                  background: "transparent",
                }}
                justify={"end"}
                align={"middle"}
              >
                {/*判断是否有Tag数组并且是否长度大于0*/}
                {/*// @ts-ignore*/}
                {todo.tags?.length > 0 && (
                  <Tag color="magenta">+{todo.tags?.length}</Tag>
                )}
                {/*{todo.tags?.map((tag, i) => (*/}
                {/*  <Tag color="magenta">{tag}</Tag>*/}
                {/*))}*/}
                <TimeCountDownNode
                  deadline={todo.deadline}
                  datetimeLocal={todo.datetimeLocal}
                />
              </Row>
            </Row>
          </Col>
        </Row>
        {/*子任务列表已移除，子任务现在在TodoList中直接渲染*/}
        {/*编辑折叠框*/}
      </li>
    </>
  );
}
