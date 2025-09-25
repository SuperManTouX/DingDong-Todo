import React from "react";
import TodoTask from "./TodoTask";
import ContextMenu from "../../components/ContextMenu";
import { SortableItem } from "@/components/SortableComponents";
import type { Todo } from "@/types";

// 定义组件属性类型
interface TaskItemRendererProps {
  item: Todo | Todo[];
  expandedTasks: Record<string, boolean>;
  hasSubTasks: (taskId: string) => boolean;
  toggleTaskExpand: (taskId: string) => void;
}

/**
 * 渲染单个任务项的组件
 * 支持渲染单个根任务或子任务数组
 */
const TaskItemRenderer: React.FC<TaskItemRendererProps> = ({
  item,
  expandedTasks,
  hasSubTasks,
  toggleTaskExpand,
}) => {
  // 如果是根任务
  if ("id" in item) {
    return (
      <SortableItem key={item.id} id={item.id}>
        <ContextMenu key={item.id} todo={item}>
          <div style={{ cursor: "context-menu" }}>
            <TodoTask
              todo={item}
              hasSubTasks={hasSubTasks(item.id)}
              isExpanded={expandedTasks[item.id]}
              onToggleExpand={() => toggleTaskExpand(item.id)}
            />
          </div>
        </ContextMenu>
      </SortableItem>
    );
  }
  // 如果是子任务数组
  else {
    return item.map((subTodo) => (
      <SortableItem key={subTodo.id} id={subTodo.id}>
        <div
          style={{
            marginLeft: `${subTodo.depth * 15}px`,
          }}
          className="sub-task-container"
        >
          <ContextMenu key={subTodo.id} todo={subTodo}>
            <div style={{ cursor: "context-menu" }}>
              <TodoTask
                todo={subTodo}
                hasSubTasks={hasSubTasks(subTodo.id)}
                isExpanded={expandedTasks[subTodo.id]}
                onToggleExpand={() => toggleTaskExpand(subTodo.id)}
              />
            </div>
          </ContextMenu>
        </div>
      </SortableItem>
    ));
  }
};

export default TaskItemRenderer;
