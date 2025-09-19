import { RightOutlined } from "@ant-design/icons";
import { Priority } from "@/constants";
import "../styles/TodoItem.css";
import { Col, message, Row, Tag } from "antd";
import dayjs from "dayjs";
import type { TodoItemProps } from "@/types";
import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek);
export default function TodoItem({
  todo,
  onTodoChange,
  onTodoSelect,
  other = false,
  hasSubTasks = false,
  isExpanded = false,
  onToggleExpand,
}: TodoItemProps) {
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

  // 渲染编辑输入框
  function renderEditInput() {
    return (
      <input
        type="text"
        autoFocus
        className="w-100"
        value={todo.title}
        onChange={(e) => {
          if (todo) {
            onTodoChange({
              type: "changed",
              todo: {
                ...todo,
                title: e.currentTarget.value,
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
        }}
      />
    );
  }

  // 倒计时
  const renderCountdown = () => {
    if (!todo.deadline && !todo.datetimeLocal) return null;
    const leftDay = dayjs(todo.deadline).diff(dayjs(), "day");
    // 计算本周下周
    const countWeek = () => {
      if (dayjs(todo.deadline).isoWeek() - dayjs().isoWeek() === 0) {
        return "本";
      } else if (dayjs(todo.deadline).isoWeek() - dayjs().isoWeek() === 1) {
        return "下";
      } else {
        return "";
      }
    };
    // 计算周几
    const deadDay = () => {
      let d: string;
      switch (dayjs(todo.deadline).day()) {
        case 0:
          d = "日";
          break;
        case 1:
          d = "一";
          break;
        case 2:
          d = "二";
          break;
        case 3:
          d = "三";
          break;
        case 4:
          d = "四";
          break;
        case 5:
          d = "五";
          break;
        case 6:
          d = "六";
          break;
      }
      return d;
    };
    let text = "";
    if (leftDay < 0) {
      text = `${dayjs(todo.deadline).format("MM月DD日")}`;
    } else {
      if (leftDay > 1)
        if (countWeek() !== "") {
          // 本周下周之内
          text = `${countWeek()}周${deadDay()}`;
        } else {
          //   大于下周
          text = `${leftDay}天`;
        }
      if (leftDay == 0) {
        text = "今天";
      }
      if (leftDay == 1) {
        text = "明天";
      }
    }
    return (
      <span
        className={`${leftDay < 0 ? "text-danger" : "text-primary"} d-inline-block text-end`}
      >
        {text}
      </span>
    );
    // <span className="title-danger">已逾期{Math.abs(dayjs(todo.deadline).diff(dayjs(), 'day'))}天</span>
  };

  // SubList函数已移除，子任务现在在TodoList中直接渲染
  // 子任务图标已移除，子任务现在在TodoList中直接渲染;

  return (
    <>
      <li
        className={`cursor-pointer row d-flex justify-content-between highlight rounded pe-0 ps-0 pt-0 pb-0  ${other ? "opacity-25" : ""}`}
        onClick={() => {
          if (onTodoSelect) {
            onTodoSelect(todo);
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
                if (e.currentTarget.checked)
                  message.info(`已完成${todo.title}`);
              }}
            />
            <Row justify={"space-between"} className="w-100 " align={"middle"}>
              <Col className={"w-100"}>{renderEditInput()}</Col>

              <Row
                style={{
                  position: "absolute",
                  right: 0,
                  background: "#f5f5f5",
                }}
                justify={"end"}
                align={"middle"}
              >
                {todo.tags && <Tag color="magenta">+{todo.tags.length}</Tag>}
                {/*{todo.tags?.map((tag, i) => (*/}
                {/*  <Tag color="magenta">{tag}</Tag>*/}
                {/*))}*/}
                {renderCountdown()}
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
