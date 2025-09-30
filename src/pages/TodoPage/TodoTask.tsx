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
import TodoCheckbox from "@/components/TodoCheckbox";
import "@/styles/TodoTask.css";

dayjs.extend(isoWeek);
export default function TodoTask({
  todo,
  other = false,
  hasSubTasks = false,
  isExpanded = false,
  onToggleExpand,
}: TodoItemProps) {
  const { dispatchTodo, setSelectTodoId, selectTodoId } = useTodoStore();
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
  console.log(selectTodoId, todo.id);
  return (
    <>
      <li
        className={`cursor-pointer row d-flex justify-content-between highlight rounded pe-0 ps-0 pt-1 pb-1 ${selectTodoId === todo.id ? "selected-task" : ""}  ${other ? "opacity-25" : ""}`}
        onClick={() => {
          if (setSelectTodoId) {
            console.log("TodoTask", todo.id);
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
              <TodoCheckbox
                completed={todo.completed}
                priority={todo.priority}
                title={todo.title}
                onChange={(checked) => {
                  dispatchTodo({
                    type: "changed",
                    todo: { ...todo, completed: checked },
                  });
                  if (checked)
                    message.info(
                      formatMessage(MESSAGES.INFO.TASK_COMPLETED, {
                        taskTitle: todo.title,
                      }),
                    );
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
        {/*子任务列表已移除，子任务现在在TodoList中直接渲染*/}
        {/*编辑折叠框*/}
      </li>
    </>
  );
}
