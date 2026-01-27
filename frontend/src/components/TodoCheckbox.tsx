import React, { memo, useCallback, useState } from "react";
import { message } from "@/utils/antdStatic";
import { formatMessage, MESSAGES } from "@/constants/messages";
import { Priority } from "@/constants";
import { theme } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { isEqual } from "lodash";
import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/types";
import type { ActionType } from "@ant-design/pro-components";

interface TodoCheckboxProps {
  todo: Todo;
  PTableDOM?: React.RefObject<ActionType>;
}

// 创建样式CSS类名（实际项目中应放在单独的CSS文件中）
const todoCheckboxStyles = `
  .todo-checkbox-container {
    width: 20px;
    height: 20px;
    position: relative;
    display: inline-block;
  }
  
  .todo-checkbox {
    position: absolute;
    left: 4px;
    top: 6px;
    appearance: none;
    WebkitAppearance: none;
    MozAppearance: none;
    width: 1rem;
    height: 1rem;
    margin: 0;
    verticalAlign: middle;
    cursor: pointer;
    border: 1px solid;
    border-radius: 4px;
    background-color: #fff;
    outline: none;
    transition: border-width 0.2s ease;
  }
  
  .todo-checkbox.hovered {
    border-width: 2px;
  }
  
  .todo-checkbox:focus {
    outline: 1px solid;
    outline-offset: 1px;
  }
  
  .todo-checkbox.checked {
    background-color: currentColor;
    border-color: currentColor;
  }
  
  .todo-checkbox-checkmark {
    position: absolute;
    left: 8px;
    top: 7px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    pointer-events: none;
  }
`;

const TodoCheckbox: React.FC<TodoCheckboxProps> = memo(
  ({ todo, PTableDOM }) => {
    const { dispatchTodo, loadTasksByType, activeListId } = useTodoStore();
    const { token } = theme.useToken();
    const [isHovered, setIsHovered] = useState(false);

    // 使用useCallback包装事件处理函数
    const getPriorityColor = useCallback(() => {
      switch (todo.priority) {
        case Priority.High:
          return "#ff4d4f"; // 红色
        case Priority.Medium:
          return "#faad14"; // 黄色
        case Priority.Low:
          return "#1677ff"; // 蓝色
        default:
          return "#909399"; // 灰色
      }
    }, [todo.priority]);

    const handleChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.currentTarget.checked;
        // 阻止冒泡
        e.stopPropagation();
        try {
          // 更新本地状态以立即反映变化
          await dispatchTodo({
            type: "completedChange",
            todoId: todo.id,
            completed: checked,
          });
          PTableDOM.current.reload();
          if (checked) {
            message.info({
              content: (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span>
                    {formatMessage(MESSAGES.INFO.TASK_COMPLETED, {
                      taskTitle: todo.title,
                    })}
                  </span>
                  <RollbackOutlined
                    style={{
                      marginLeft: 8,
                      cursor: "pointer",
                      color: "orange",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 撤销完成状态
                      dispatchTodo({
                        type: "completedChange",
                        todoId: todo.id,
                        completed: false,
                      });
                      // 不再直接调用PTableDOM.reload()，由事件系统处理
                    }}
                  />
                </div>
              ),
              duration: 3, // 消息显示3秒
            });
          }
        } catch (error) {
          // 处理错误
          console.error("切换任务完成状态失败:", error);
          message.error(formatMessage(MESSAGES.ERROR.FAILED_TO_UPDATE_TASK));

          // 恢复原来的选中状态
          e.currentTarget.checked = todo.completed;
        }
      },
      [todo, dispatchTodo, PTableDOM],
    );

    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
    }, []);

    const checkboxClasses = `todo-checkbox me-2 ${todo.completed ? "checked" : ""} ${!todo.completed && isHovered ? "hovered" : ""}`;
    const priorityColor = getPriorityColor();

    return (
      <>
        <style>{todoCheckboxStyles}</style>
        <div className="todo-checkbox-container">
          <input
            type="checkbox"
            className={checkboxClasses}
            style={{
              borderColor: priorityColor,
              color: priorityColor,
              backgroundColor: todo.completed
                ? priorityColor
                : token.colorBgBase,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            checked={todo.completed}
            onChange={handleChange}
          />
          {todo.completed && <div className="todo-checkbox-checkmark" />}
        </div>
      </>
    );
  },
  (prevProps, nextProps) => {
    // 使用lodash的isEqual进行深度比较
    return isEqual(prevProps, nextProps);
  },
);

export default TodoCheckbox;
