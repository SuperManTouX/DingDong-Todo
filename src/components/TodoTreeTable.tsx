import React, { useCallback } from "react";
import { Table, Pagination } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Todo, TreeTableData } from "@/types";
import ContextMenu from "./ContextMenu";
import TodoTask from "../pages/TodoPage/TodoTask";
import type { ActionType } from "@ant-design/pro-components";

interface TodoTreeTableProps {
  tasks: Todo[];
  expandedRowKeys: string[];
  onExpandChange: (expanded: boolean, record: TreeTableData) => void;
  usePagination?: boolean;
  total?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  PTableDOM?: React.RefObject<ActionType>;
  stopPropagation?: boolean;
  filterCompleted?: boolean;
}

/**
 * 递归计算任务的子节点总数和已完成的子节点数
 */
const calculateChildrenStats = (
  task: TreeTableData,
): { total: number; completed: number } => {
  if (!task.children || task.children.length === 0) {
    return { total: 0, completed: 0 };
  }

  let total = task.children.length;
  let completed = task.children.filter((child) => child.completed).length;

  // 递归计算所有子任务的子节点
  task.children.forEach((child) => {
    const childStats = calculateChildrenStats(child);
    total += childStats.total;
    completed += childStats.completed;
  });

  // 设置当前任务的统计信息
  task.totalChildren = total;
  task.completedChildren = completed;

  return { total, completed };
};

/**
 * 将Todo对象转换为树形表格数据格式
 */
export const convertToTreeTableData = (
  todos: Todo[],
  filterCompleted: boolean,
): TreeTableData[] => {
  // 创建ID到任务的映射，用于快速查找父任务
  const taskMap = new Map<string, TreeTableData>();
  // 首先创建所有任务对象 - 不再默认初始化children数组
  todos.forEach((todo) => {
    const task: TreeTableData = {
      ...todo,
      key: todo.id,
      // 移除默认的空children数组，只在有子任务时才初始化
    };
    taskMap.set(todo.id, task);
  });

  // 构建树形结构
  const treeData: TreeTableData[] = [];
  todos.forEach((todo) => {
    if (!todo.parentId || !taskMap.has(todo.parentId)) {
      // 顶级任务直接加入树数据，包括parentId为null或父任务不存在的任务
      treeData.push(taskMap.get(todo.id)!);
    } else {
      // 子任务加入父任务的children数组
      const parentTask = taskMap.get(todo.parentId);
      if (parentTask) {
        // 确保children是一个数组，并且不包含当前任务
        const existingChildren = parentTask.children || [];
        const currentTask = taskMap.get(todo.id)!;
        // 检查当前任务是否已存在于子任务数组中
        if (!existingChildren.find((child) => child.id === currentTask.id)) {
          // 创建新的数组而不是修改可能不可扩展的数组
          parentTask.children = [...existingChildren, currentTask];
        }
      }
    }
  });

  // 计算每个任务的子节点统计信息
  treeData.forEach((task) => {
    calculateChildrenStats(task);
  });

  // 过滤掉所有已完成的任务，但保留其统计信息
  const filterCompletedTasks = (tasks: TreeTableData[]): TreeTableData[] => {
    return tasks
      .filter((task) => !task.completed) // 过滤掉已完成的任务
      .map((task) => {
        // 如果任务有子任务，递归过滤子任务
        if (task.children && task.children.length > 0) {
          const filteredChildren = filterCompletedTasks(task.children);
          // 只在有未完成子任务时保留children属性
          return {
            ...task,
            children:
              filteredChildren.length > 0 ? filteredChildren : undefined,
          };
        }
        return task;
      });
  };

  // 应用过滤逻辑
  if (filterCompleted) {
    return filterCompletedTasks(treeData);
  } else {
    return treeData;
  }
};

/**
 * 可复用的任务树形表格组件
 */
const TodoTreeTable: React.FC<TodoTreeTableProps> = ({
  tasks,
  expandedRowKeys,
  onExpandChange,
  usePagination = false,
  total,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  PTableDOM,
  stopPropagation = false,
  filterCompleted = false,
}) => {
  // 定义表格列
  const columns: ColumnsType<TreeTableData> = [
    {
      dataIndex: "",
      key: "task",
      width: "100%",
      render: (_, record) => {
        return (
          <ContextMenu key={record.id} todo={record}>
            <div style={{ width: "100%" }}>
              <TodoTask
                todo={record}
                onToggleExpand={() => {}}
                PTableDOM={PTableDOM}
                stopPropagation={stopPropagation}
              />
            </div>
          </ContextMenu>
        );
      },
    },
  ];

  // 将任务转换为树形数据
  const treeData = convertToTreeTableData(tasks, filterCompleted);

  // 基础表格组件
  const table = (
    <Table
      className="todo-tree-table"
      columns={columns}
      dataSource={treeData}
      pagination={false}
      expandable={{
        rowExpandable: (record) =>
          record.children && record.children.length > 0,
        expandedRowKeys: expandedRowKeys,
        onExpand: onExpandChange,
        indentSize: 35, // 控制每一层的缩进宽度
      }}
      size="small"
      bordered={false}
      rowKey="id"
      style={{ minHeight: "50px" }}
    />
  );

  // 是否显示分页
  if (usePagination && total !== undefined && onPageChange) {
    return (
      <div>
        {table}
        <div className="mt-2 text-center">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={onPageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条记录`}
          />
        </div>
      </div>
    );
  }

  return table;
};

export default TodoTreeTable;