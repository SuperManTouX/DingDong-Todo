import React from "react";
import { Collapse } from "antd";
import TodoTask from "./TodoTask";
import ContextMenu from "./ContextMenu";
import type { Todo } from "@/types";
import type { FilterGroupProps } from "@/types/group";
import dayjs from "dayjs";

/**
 * FilterGroup组件 - 支持三种模式：分组模式、时间分组模式、未分组模式
 * - 分组模式：title为string
 * - 时间分组模式：title为dayjs对象
 * - 未分组模式：title为undefined
 */
export default function FilterGroup({ title, tasks, children }: FilterGroupProps) {
  // 判断当前模式
  // 分组模式：title为string
  const isGroupMode = typeof title === 'string' && title !== undefined;
  // 时间分组模式：title为符合日期格式的string
  const isTimeMode = typeof title === 'string' && dayjs(title).isValid();
  // 未分组模式：title为undefined
  const isUngroupedMode = title === undefined;

  // 根据模式格式化标题
  const formatTitle = (): string => {
    if (isTimeMode) {
      const date = dayjs(title as string);
      if (date.isSame(dayjs(), 'day')) {
        return '今天';
      } else if (date.isSame(dayjs().add(1, 'day'), 'day')) {
        return '明天';
      } else if (date.isSame(dayjs().subtract(1, 'day'), 'day')) {
        return '昨天';
      } else {
        return date.format('YYYY年MM月DD日');
      }
    } else if (isGroupMode) {
      return title as string;
    } else {
      return '未分组';
    }
  };

  // 判断是否有子任务
  const hasSubTasks = (taskId: string): boolean => {
    return tasks.some((task) => task.parentId === taskId);
  };

  return (
    <Collapse 
      items={[
        {
          key: '1',
          label: <span className="theme-color-text font-medium">{formatTitle()}</span>,
          children: (
            <div className="filter-group-content">
              {children || (
                <div className="task-list">
                  {tasks.map((task) => (
                    <ContextMenu key={task.id} todo={task}>
                      <div style={{ cursor: "context-menu" }}>
                        <TodoTask 
                          todo={task}
                          hasSubTasks={hasSubTasks(task.id)}
                          isExpanded={false}
                          onToggleExpand={() => {}}
                        />
                      </div>
                    </ContextMenu>
                  ))}
                </div>
              )}
            </div>
          )
        }
      ]}
      defaultActiveKey={['1']}
      className="filter-group"
    />
  );
}