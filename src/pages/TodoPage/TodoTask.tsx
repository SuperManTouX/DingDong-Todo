import { Priority } from "@/constants";
import { Col, Input, Row, Tag, Typography, theme } from "antd";
import { message } from "@/utils/antdStatic";
import dayjs from "dayjs";
import { useGlobalSettingsStore } from "@/store/globalSettingsStore";
import type { TodoItemProps } from "@/types";
import { formatMessage, MESSAGES } from "@/constants/messages";
import isoWeek from "dayjs/plugin/isoWeek";
import { useTodoStore } from "@/store/todoStore";
import TimeCountDownNode from "./TimeCountDownNode";
import TodoCheckbox from "@/components/TodoCheckbox";
import "@/styles/TodoTask.css";
import { RightOutlined } from "@ant-design/icons";
import { login } from "@/services/authService";

dayjs.extend(isoWeek);
export default function TodoTask({
  todo,
  other = false,
  hasSubTasks = false,
  isExpanded = false,
  onToggleExpand,
}: TodoItemProps) {
  const { dispatchTodo, setSelectTodoId, selectTodoId } = useTodoStore();
  const { showTaskDetails, setIsTodoDrawerOpen } = useGlobalSettingsStore();
  const { token } = theme.useToken(); // 获取主题令牌

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
        className={`border-bottom  cursor-pointer row d-flex justify-content-between highlight rounded pe-0 ps-0 pt-1 pb-1 ${selectTodoId === todo.id ? "selected-task" : ""}  ${other ? "opacity-25" : ""}`}
        onClick={() => {
          if (setSelectTodoId) {
            console.log("TodoTask", todo.id);
            setSelectTodoId(todo.id);
            // 直接调用store中的方法打开Drawer
            setIsTodoDrawerOpen(true);
          }
        }}
      >
        <Row justify={"space-between"} align={"middle"} className="ps-0">
          <Col
            span={1}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
          >
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
                />
              )}
            </Row>
          </Col>
          <Col
            span={23}
            className="d-flex lh-base align-items-center h-100 scursor-pointer"
            style={todoItemHoverStyle}
          >
            <div style={{ position: "relative", display: "inline-block" }}>
              <TodoCheckbox
                completed={todo.completed}
                priority={todo.priority}
                title={todo.title}
                onChange={(checked) => {
                  dispatchTodo({
                    type: "changed",
                    todo: { ...todo, completed: checked },
                  });
                }}
              />
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
        {/*task详情 - 条件渲染基于全局设置*/}
        {showTaskDetails && (
          <Row justify={"space-between"} align={"middle"} className="ps-0">
            <Col offset={2} span={22}>
              <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                {(() => {
                  try {
                    // 尝试将text字段解析为JSON，处理富文本数据
                    if (
                      typeof todo.text === "string" &&
                      todo.text.startsWith("{")
                    ) {
                      const parsed = JSON.parse(todo.text);
                      // 如果解析后的数据包含text字段，则使用该字段作为纯文本
                      if (
                        parsed &&
                        typeof parsed === "object" &&
                        "text" in parsed
                      ) {
                        return parsed.text;
                      }
                    }
                    // 否则直接返回text字段
                    return todo.text || "";
                  } catch (error) {
                    // 解析失败时，直接返回原始文本
                    return todo.text || "";
                  }
                })()}
              </Typography.Text>
            </Col>
          </Row>
        )}
        {/*子任务列表已移除，子任务现在在TodoList中直接渲染*/}
        {/*编辑折叠框*/}
      </li>
    </>
  );
}
