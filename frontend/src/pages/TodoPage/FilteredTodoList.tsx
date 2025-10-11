import { type ActionType, ProTable } from "@ant-design/pro-components";
import {
  Typography,
  Button,
  Space,
  Col,
  Row,
  Dropdown,
  Layout,
  Table,
  Pagination,
} from "antd";
import React, { useCallback, useState, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import useTodoOperations from "../../hooks/useTodoOperations";
import useTodoGrouping from "../../hooks/useTodoGrouping";
import { useGlobalSettingsStore } from "@/store/globalSettingsStore";
import { useTodoStore, getActiveListTasks } from "../../store/todoStore";
import Controller from "./Controller";
import FilterGroup from "./FilterGroup";
import ContextMenu from "../../components/ContextMenu";
import TodoTask from "./TodoTask";
import type { Todo } from "@/types";
import { getCompletedTasks } from "@/services/todoService";

const { Header, Content, Footer } = Layout;

// 定义树形表格数据类型
interface TreeTableData extends Todo {
  key: string;
  children?: TreeTableData[];
}

export default function FilteredTodoList({
  groupName,
  toggleCollapsed,
  collapsed,
  PTableDOM,
}: {
  groupName: string;
  toggleCollapsed: () => void;
  collapsed: boolean;
  PTableDOM: React.RefObject<ActionType>;
}) {
  // 获取所有任务，然后根据用户ID过滤
  const tasks = getActiveListTasks();
  const { activeListId, loadCompletedTasks } = useTodoStore();
  const pinnedTasks = tasks.filter((task) => task.isPinned);
  // 获取全局设置和操作方法
  const {
    showTaskDetails,
    toggleShowTaskDetails,
    toggleHideCompletedTasks,
    hideCompletedTasks,
  } = useGlobalSettingsStore();

  // 控制表格行展开/折叠状态
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  // 分页相关状态
  const [completedTasksPage, setCompletedTasksPage] = useState(1);
  const [completedTasksPageSize] = useState(10);

  // 下拉菜单配置
  const menuProps = {
    items: [
      {
        key: "detail",
        label: showTaskDetails ? "隐藏详情" : "显示详情",
      },
      {
        key: "hideCompleted",
        label: "隐藏已完成",
      },
      {
        key: "view",
        label: "视图",
        disabled: true,
      },
    ],
    onClick: (e: any) => {
      switch (e.key) {
        case "detail":
          toggleShowTaskDetails();
          break;
        case "hideCompleted":
          toggleHideCompletedTasks();
          break;
        default:
          break;
      }
    },
  };

  // 使用hooks获取各种功能
  const { groupMode, displayGroups, displayUncompletedCount } =
    useTodoGrouping(tasks);
  const {
    handleAdded,
    handleCompleteAll,
    handleDeleteAllCompleted,
    isAllDone,
  } = useTodoOperations(tasks);

  // 处理分页变化
  const handleCompletedTasksPageChange = (page: number, pageSize: number) => {
    setCompletedTasksPage(page);
    loadCompletedTasks(activeListId, page, pageSize);
  };

  // 将Todo对象转换为树形表格数据格式
  const convertToTreeTableData = useCallback(
    (todos: Todo[]): TreeTableData[] => {
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
        if (!todo.parentId) {
          // 顶级任务直接加入树数据
          treeData.push(taskMap.get(todo.id)!);
        } else {
          // 子任务加入父任务的children数组
          const parentTask = taskMap.get(todo.parentId);
          if (parentTask) {
            // 确保children是一个数组，并且不包含当前任务
            const existingChildren = parentTask.children || [];
            const currentTask = taskMap.get(todo.id)!;
            // 检查当前任务是否已存在于子任务数组中
            if (
              !existingChildren.find((child) => child.id === currentTask.id)
            ) {
              // 创建新的数组而不是修改可能不可扩展的数组
              parentTask.children = [...existingChildren, currentTask];
            }
          }
        }
      });

      return treeData;
    },
    [],
  );

  // 处理行展开/折叠
  const handleExpandChange = useCallback(
    (expanded: boolean, record: TreeTableData) => {
      setExpandedRowKeys((prevKeys) => {
        if (expanded) {
          // 添加到展开行
          return [...prevKeys, record.id];
        } else {
          // 从展开行移除
          return prevKeys.filter((key) => key !== record.id);
        }
      });
    },
    [],
  );

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
              />
            </div>
          </ContextMenu>
        );
      },
    },
  ];

  // 渲染树形表格的组件
  const renderTreeTable = useCallback(
    (tasksToRender: Todo[], usePagination: boolean = false, total?: number) => {
      const treeData = convertToTreeTableData(tasksToRender);
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
            onExpand: handleExpandChange,
            indentSize: 35, // 控制每一层的缩进宽度
          }}
          size="small"
          bordered={false}
          rowKey="id"
          style={{ minHeight: "50px" }}
        />
      );

      if (usePagination && total !== undefined) {
        return (
          <div>
            {table}
            <div className="mt-2 text-center">
              <Pagination
                current={completedTasksPage}
                pageSize={completedTasksPageSize}
                total={total}
                onChange={handleCompletedTasksPageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 条记录`}
              />
            </div>
          </div>
        );
      }

      return table;
    },
    [
      columns,
      convertToTreeTableData,
      expandedRowKeys,
      handleExpandChange,
      completedTasksPage,
      completedTasksPageSize,
      handleCompletedTasksPageChange,
    ],
  );

  return (
    <>
      {/*标题栏*/}
      <Header
        style={{ backgroundColor: "var(--theme--colorBgLayout)" }}
        className="pt-1 pb-1 border-0 pe-2 ps-2"
      >
        <Row className={"h-100"} align={"middle"} justify="space-between">
          <Col>
            <Button type="text" onClick={toggleCollapsed}>
              {collapsed ? (
                <MenuUnfoldOutlined style={{ cursor: "pointer" }} />
              ) : (
                <MenuFoldOutlined style={{ cursor: "pointer" }} />
              )}
            </Button>
            <Typography.Title level={4} className={"h-100 d-inline-block m-0"}>
              {groupName}
            </Typography.Title>
          </Col>
          <Col>
            <Space>
              <Dropdown menu={menuProps} trigger={["click"]}>
                <EllipsisOutlined
                  style={{ cursor: "pointer", fontSize: "18px" }}
                />
              </Dropdown>
            </Space>
          </Col>
        </Row>
      </Header>

      {/*主内容区*/}
      <Content className="overflow-y-scroll minHeight-large pe-2 ps-2 custom-scrollbar">
        <div className="col p-2 pt-0">
          <Space className="w-100" direction="vertical" size="small">
            {/*顶部控制器组件*/}
            {!(activeListId === "bin" || activeListId === "cp") && (
              <Controller
                isAllDone={isAllDone}
                onCompleteAll={handleCompleteAll}
                onAdded={handleAdded}
                groupMode={groupMode}
              />
            )}

            {/*已置顶分组 - 直接渲染置顶任务列表*/}
            {pinnedTasks.length > 0 && (
              <FilterGroup
                key={"pinned"}
                title={"⭐已置顶"}
                tasks={pinnedTasks}
              >
                <div className="task-group">{renderTreeTable(pinnedTasks)}</div>
              </FilterGroup>
            )}

            {/*普通渲染模式 - 使用树形表格*/}
            {groupMode === "none" && tasks.length > 0 && (
              <div className="task-group">{renderTreeTable(tasks)}</div>
            )}

            {/*分组模式 - 每个分组使用独立的树形表格*/}
            {groupMode !== "none" &&
              displayGroups.length > 0 &&
              displayGroups.map((group) => (
                <FilterGroup
                  key={group.title}
                  title={group.title}
                  tasks={group.tasks}
                  isUngrouped={group.type === "ungrouped"}
                >
                  <div className="task-group">
                    {renderTreeTable(group.tasks)}
                  </div>
                </FilterGroup>
              ))}

            {/*使用ProTable分页树形表格展示已完成任务，不再虚化显示*/}
            {(activeListId === "cp" ||
              activeListId === "bin" ||
              !hideCompletedTasks) && (
              <FilterGroup title="已完成" tasks={[]}>
                <div style={{ opacity: ".4" }}>
                  <ProTable
                    columns={columns}
                    request={async (params) => {
                      try {
                        // 使用todoService的getCompletedTasks方法获取数据
                        const { page, totalPages, total, tasks, pageSize } =
                          await getCompletedTasks(
                            activeListId,
                            params.current || 1,
                            params.pageSize || 10,
                          );

                        // 将获取的任务转换为树形结构
                        const treeData = convertToTreeTableData(tasks);

                        // 由于getCompletedTasks直接返回任务数组，需要构造ProTable需要的数据格式
                        // 假设API返回的数据包含总任务数，这里可以根据实际情况调整
                        return {
                          data: treeData,
                          success: true,
                          total: total, // 这里应该从API响应中获取实际总数
                        };
                      } catch (error) {
                        console.error("获取已完成任务失败:", error);
                        return {
                          data: [],
                          success: false,
                          total: 0,
                        };
                      }
                    }}
                    actionRef={PTableDOM}
                    expandable={{
                      rowExpandable: (record) =>
                        record.children && record.children.length > 0,
                      expandedRowKeys: expandedRowKeys,
                      onExpand: handleExpandChange,
                      indentSize: 35,
                    }}
                    rowKey="id"
                    options={false}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    className="todo-tree-table"
                    search={false} // 禁用查询框
                  />
                </div>
              </FilterGroup>
            )}
          </Space>
        </div>
      </Content>

      {/*底部操作栏*/}
      <Footer className="rounded-bottom">
        <Row align={"middle"} justify={"space-between"}>
          {activeListId === "bin" ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("确定要清空回收站吗？此操作不可恢复！")) {
                  useTodoStore.getState().emptyBin();
                }
              }}
              className="btn btn-danger btn-sm"
            >
              清空所有回收站todo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleDeleteAllCompleted()}
              className="btn btn-primary btn-sm"
            >
              删除所有已完成
            </button>
          )}
          {activeListId !== "bin" && (
            <span>
              未完成：{displayUncompletedCount + pinnedTasks.length}个
            </span>
          )}
        </Row>
      </Footer>
    </>
  );
}

/* 树形表格样式调整 */
const styles = `
  /* 移除之前的自定义样式干扰，让Ant Design表格组件自动处理树形展示 */
  .todo-tree-table .ant-table-row-expand-icon-cell {
    min-width: 40px;
  }
`;

// 将样式注入到组件中
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
