import React from "react";
import { message } from "@/utils/antdStatic";
import { formatMessage, MESSAGES } from "@/constants/messages";
import { Priority } from "@/constants";
import { theme } from "antd";
import { RollbackOutlined } from "@ant-design/icons";

interface TodoCheckboxProps {
  completed: boolean;
  priority: Priority;
  title: string;
  onChange: (checked: boolean) => void;
}

const TodoCheckbox: React.FC<TodoCheckboxProps> = ({
  completed,
  priority,
  title,
  onChange,
}) => {
  const { token } = theme.useToken();

  // 获取优先级对应的颜色
  const getPriorityColor = () => {
    switch (priority) {
      case Priority.High:
        return "#ff4d4f"; // 红色
      case Priority.Medium:
        return "#faad14"; // 黄色
      case Priority.Low:
        return "#1677ff"; // 蓝色
      default:
        return "#909399"; // 灰色
    }
  };

  // 创建自定义复选框样式
  const customCheckboxStyle: React.CSSProperties = {
    position: "absolute",
    left: "4px",
    top: "6px",
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
    outline: "none",
  };

  const customCheckboxCheckedStyle: React.CSSProperties = {
    ...customCheckboxStyle,
    backgroundColor: getPriorityColor(),
    borderColor: getPriorityColor(),
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.currentTarget.checked;
    onChange(checked);
    if (checked) {
      message.info({
        content: (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span>
              {formatMessage(MESSAGES.INFO.TASK_COMPLETED, {
                taskTitle: title,
              })}
            </span>
            <RollbackOutlined
              style={{ marginLeft: 8, cursor: "pointer", color: "orange" }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(false); // 撤销完成状态
              }}
            />
          </div>
        ),
        duration: 3, // 消息显示3秒
      });
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!e.currentTarget.checked) {
      e.currentTarget.style.border = `2px solid ${getPriorityColor()}`;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!e.currentTarget.checked) {
      e.currentTarget.style.border = `1px solid ${getPriorityColor()}`;
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.outline = `1px solid ${getPriorityColor()}`;
    e.currentTarget.style.outlineOffset = "1px";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.outline = "none";
  };

  return (
    <div
      style={{
        width: "20px",
        height: "20px",
        position: "relative",
        display: "inline-block",
      }}
    >
      <input
        type="checkbox"
        className={"me-2"}
        style={completed ? customCheckboxCheckedStyle : customCheckboxStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        checked={completed}
        onChange={handleChange}
      />
      {completed && (
        <div
          style={{
            position: "absolute",
            left: "8px",
            top: "7px",
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
  );
};

export default TodoCheckbox;
