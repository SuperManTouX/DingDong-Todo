import React from "react";
import { Collapse, Dropdown, Input, type MenuProps } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import { useState } from "react";
import TodoTask from "./TodoTask";
import ContextMenu from "./ContextMenu";
import type { Todo } from "@/types";
import type { FilterGroupProps } from "@/types/group";
import dayjs from "dayjs";
import { message } from "@/utils/antdStatic";
import { useTodoStore } from "@/store/todoStore";
import { SortableList } from "./SortableComponents";

/**
 * FilterGroup组件 - 支持三种模式：分组模式、时间分组模式、未分组模式
 * - 分组模式：title为string
 * - 时间分组模式：title为dayjs对象（使用dayjs.isDayjs检测）
 * - 未分组模式：title为undefined
 */
export default function FilterGroup({
  title,
  tasks,
  children,
  expandedTasks = {},
  toggleTaskExpand = () => {},
  hasSubTasks = () => false,
  isUngrouped = false,
}: FilterGroupProps & {
  expandedTasks?: Record<string, boolean>;
  toggleTaskExpand?: (taskId: string) => void;
  hasSubTasks?: (taskId: string) => boolean;
  isUngrouped?: boolean;
}) {
  const { addGroup, activeListId } = useTodoStore();

  // 状态管理
  const [showInput, setShowInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

  // 判断当前模式
  // 时间分组模式：title为dayjs对象
  const isTimeMode = dayjs.isDayjs(title);
  // 分组模式：title为string
  const isGroupMode = typeof title === "string";

  // 获取当前分组内可排序的任务ID
  const getSortableTaskIds = (): string[] => {
    // 从任务数组中提取ID
    return tasks.map((task) => task.id);
  };

  // 根据模式格式化标题
  const formatTitle = (): string => {
    if (isTimeMode) {
      const date = title as dayjs.Dayjs;
      if (date.isSame(dayjs(), "day")) {
        return "今天";
      } else if (date.isSame(dayjs().add(1, "day"), "day")) {
        return "明天";
      } else if (date.isSame(dayjs().subtract(1, "day"), "day")) {
        return "昨天";
      } else {
        return date.format("YYYY年MM月DD日");
      }
    } else if (isGroupMode) {
      return title as string;
    } else {
      return "未分组";
    }
  };

  // 处理添加新组的函数
  const handleAddNewGroup = () => {
    if (newGroupName.trim()) {
      // 调用store中的addGroup方法添加新组
      addGroup(activeListId, newGroupName.trim());
      message.success(`成功添加新组"${newGroupName.trim()}"`);
      // 重置状态
      setNewGroupName("");
      setShowInput(false);
    } else {
      message.error("组名不能为空");
    }
  };

  // 处理输入框失焦事件
  const handleInputBlur = () => {
    handleAddNewGroup();
  };

  // 处理输入框键盘事件
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddNewGroup();
    } else if (e.key === "Escape") {
      setShowInput(false);
      setNewGroupName("");
    }
  };

  // 组操作菜单选项
  const menuItems: MenuProps["items"] = [
    {
      key: "add-group-above",
      label: "在此组上添加新组",
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        setShowInput(true);
        // 使用setTimeout确保组件已经渲染后再聚焦
        setTimeout(() => {
          inputRef?.focus();
        }, 0);
      },
    },
    {
      key: "delete-group",
      label: "删除此组",
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        // 实际项目中需要实现删除组的逻辑
        message.info(`删除组"${formatTitle()}"`);
      },
    },
  ];

  return (
    <Collapse
      items={[
        {
          key: formatTitle(),
          label: (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {showInput ? (
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  placeholder="请输入组名"
                  autoFocus
                  style={{
                    width: 150,
                    marginRight: 10,
                    fontSize: 14,
                  }}
                />
              ) : (
                <span className="theme-color-text font-medium">
                  {formatTitle()}
                </span>
              )}
              {isGroupMode && (
                <Dropdown menu={{ items: menuItems }}>
                  <EllipsisOutlined
                    style={{ cursor: "pointer" }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              )}
            </div>
          ),
          children: (
            <div className="filter-group-content">
              {children ? (
                <SortableList items={getSortableTaskIds()}>
                  {children}
                </SortableList>
              ) : (
                <SortableList items={getSortableTaskIds()}>
                  <div className="task-list">
                    {tasks.map((task) => (
                      <ContextMenu key={task.id} todo={task}>
                        <div style={{ cursor: "context-menu" }}>
                          <TodoTask
                            todo={task}
                            hasSubTasks={hasSubTasks(task.id)}
                            isExpanded={expandedTasks[task.id] || false}
                            onToggleExpand={() => toggleTaskExpand(task.id)}
                          />
                        </div>
                      </ContextMenu>
                    ))}
                  </div>
                </SortableList>
              )}
            </div>
          ),
        },
      ]}
      defaultActiveKey={["1"]}
      className="filter-group"
    />
  );
}
