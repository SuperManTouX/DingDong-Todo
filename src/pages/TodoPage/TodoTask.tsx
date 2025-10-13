import { Col, Input, Row, Tag, Typography, theme } from "antd";
import dayjs from "dayjs";
import { useGlobalSettingsStore } from "@/store/globalSettingsStore";
import type { TodoItemProps } from "@/types";
import isoWeek from "dayjs/plugin/isoWeek";
import { useTodoStore } from "@/store/todoStore";
import TimeCountDownNode from "./TimeCountDownNode";
import TodoCheckbox from "@/components/TodoCheckbox";
import { debounce } from "lodash";
import "@/styles/TodoTask.css";
import { BellOutlined } from "@ant-design/icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ActionType } from "@ant-design/pro-components";
import CustomTreeNodeIcon from "@/icons/CustomTreeNodeIcon";

dayjs.extend(isoWeek);
export default function TodoTask({
  todo,
  other = false,
  PTableDOM,
  stopPropagation = false,
}: TodoItemProps & { PTableDOM?: React.RefObject<ActionType> }) {
  const { dispatchTodo, setSelectTodoId, selectTodoId, todoTags } =
    useTodoStore();
  const { showTaskDetails, setIsTodoDrawerOpen, isMobile } =
    useGlobalSettingsStore();
  const { token } = theme.useToken(); // 获取主题令牌

  // 使用ref存储输入框引用
  const inputRef = useRef<HTMLInputElement>(null);
  // 使用ref存储正在编辑的状态
  const isEditingRef = useRef<boolean>(false);
  //输入框值
  const [titleValue, setTitleValue] = useState<string>(todo.title);

  // 列表项悬停效果样式
  const todoItemHoverStyle: React.CSSProperties = {
    ":hover": {
      backgroundColor: token.colorBgElevated,
    },
  };

  // 使用useCallback创建防抖函数，只依赖dispatchTodo
  const debouncedTitleUpdate = useCallback(
    debounce((newTitle: string, currentTodoId: string) => {
      // 只有当标题确实改变时才更新
      if (newTitle !== todo.title) {
        dispatchTodo({
          type: "changed",
          todo: {
            id: currentTodoId,
            title: newTitle,
          },
        });
      }
    }, 500), // 增加防抖延迟，减少更新频率
    [dispatchTodo],
  );

  // 当todo.title变化时（例如从服务器更新），更新本地引用
  useEffect(() => {
    setTitleValue(todo.title);
  }, [todo.title]);

  // 处理输入变化，但不触发组件重新渲染
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitleValue(newTitle);
      // 调用防抖函数更新全局状态，但不触发本地重渲染
      debouncedTitleUpdate(newTitle, todo.id);
    },
    [debouncedTitleUpdate, todo.id],
  );

  // 处理输入框聚焦
  const handleInputFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.stopPropagation();
      isEditingRef.current = true;
    },
    [],
  );

  // 根据tagId获取标签名称
  const getTagName = useCallback(
    (tagId: string) => {
      // 从tags数组中查找对应的标签
      const tag = todoTags?.find((t) => t.id === tagId);
      // 如果找到标签，返回其名称，否则返回标签ID作为回退
      return tag?.name || tagId;
    },
    [todoTags],
  );
  // 渲染编辑输入框
  function renderEditInput() {
    return (
      <input
        ref={inputRef}
        key={`todo-input-${todo.id}`} // 添加key属性确保输入框稳定性
        type="text"
        value={titleValue} // 使用defaultValue避免受控组件问题
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        // onBlur={handleInputBlur}
        style={{
          border: "none",
          backgroundColor: "transparent",
          outline: "none",
          width: "100%",
          padding: "0",
          boxShadow: "none",
        }}
        className="border-none bg-transparent focus:ring-0 focus:outline-none"
      />
    );
  }

  return (
    <>
      <li
        className={`cursor-pointer m-0 row d-flex justify-content-between highlight rounded pe-0 ps-0 pt-1 pb-1 ${selectTodoId === todo.id ? "selected-task" : ""}  ${other ? "opacity-25" : ""}`}
        onClick={(e) => {
          if (stopPropagation) {
            e.stopPropagation();
            return;
          }
          if (setSelectTodoId) {
            setSelectTodoId(todo.id);
            if (isMobile) {
              // 直接调用store中的方法打开Drawer
              setIsTodoDrawerOpen(true);
            }
          }
        }}
      >
        <Row
          justify={"space-between"}
          align={"middle"}
          className="w-100 ps-0 pe-0"
        >
          <Col
            offset={1}
            span={23}
            className="d-flex lh-base align-items-center h-100 scursor-pointer"
            style={todoItemHoverStyle}
          >
            <div style={{ position: "relative", display: "inline-block" }}>
              <TodoCheckbox todo={todo} PTableDOM={PTableDOM} />
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
                {todo.tags?.length > 0 && !showTaskDetails && (
                  <Tag color="magenta">+{todo.tags?.length}</Tag>
                )}
                {/*是否有子任务*/}
                {(todo?.children?.length > 0 ||
                  (todo as any).totalChildren) && (
                  <>
                    <CustomTreeNodeIcon />
                    {showTaskDetails && (
                      <span>
                        {typeof (todo as any).completedChildren === "number" &&
                        typeof (todo as any).totalChildren === "number"
                          ? `${(todo as any).completedChildren}/${(todo as any).totalChildren}`
                          : (todo as any).totalChildren ||
                            todo?.children?.length}
                      </span>
                    )}
                  </>
                )}
                {/*提醒图标*/}
                {todo.reminder_at !== null && !todo.is_reminded && (
                  <BellOutlined className={"me-2"} />
                )}
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
          <>
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
            <Row justify={"space-between"} align={"middle"} className="ps-0">
              <Col offset={2} span={22}>
                {todo.tags?.map((tagId, i) => (
                  <Tag key={tagId} color="magenta">
                    {getTagName(tagId)}
                  </Tag>
                ))}
              </Col>
            </Row>
          </>
        )}
      </li>
    </>
  );
}
