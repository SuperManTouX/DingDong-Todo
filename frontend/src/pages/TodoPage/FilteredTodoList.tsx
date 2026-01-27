import { type ActionType, ProTable } from "@ant-design/pro-components";
import {
  Typography,
  Button,
  Space,
  Col,
  Row,
  Dropdown,
  Layout,
  Spin,
} from "antd";
import React, { useCallback, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EllipsisOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import ContextMenu from "../../components/ContextMenu";
import TodoTask from "./TodoTask";
import useTodoOperations from "../../hooks/useTodoOperations";
import useTodoGrouping from "../../hooks/useTodoGrouping";
import { useGlobalSettingsStore } from "@/store/globalSettingsStore";
import { useTodoStore, getActiveListTasks } from "../../store/todoStore";
import Controller from "./Controller";
import FilterGroup from "./FilterGroup";
import TodoTreeTable, {
  convertToTreeTableData,
} from "../../components/TodoTreeTable";
import type { Todo, TreeTableData } from "@/types";
import { getCompletedTasks } from "@/services/todoService";
import SidebarNav from "../../Layout/SidebarNav";

const { Header, Content, Footer } = Layout;

// 添加加载指示器样式
const style = {
  ".loading-indicator": {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    border: "1px solid #e8e8e8",
    minHeight: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ".task-group": {
    marginBottom: 16,
  },
};

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
  const { activeListId, loadCompletedTasks, isTasksLoading } = useTodoStore();
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
  // 移动端侧边栏显示状态
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
  // 使用全局设置中的移动端状态
  const { isMobile } = useGlobalSettingsStore();

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
  return (
    <>
      {/*标题栏*/}
      <Header
        style={{ backgroundColor: "var(--theme--colorBgLayout)" }}
        className="pt-1 pb-1 border-0 pe-2 ps-2"
      >
        <Row className={"h-100"} align={"middle"} justify="space-between">
          <Col>
            {isMobile ? (
              // 移动端显示汉堡菜单按钮
              <Button
                type="text"
                onClick={() => setMobileSidebarVisible(true)}
                style={{ marginRight: 16 }}
              >
                <MenuOutlined style={{ cursor: "pointer", fontSize: 20 }} />
              </Button>
            ) : (
              // 桌面端显示折叠按钮
              <Button type="text" onClick={toggleCollapsed}>
                {collapsed ? (
                  <MenuUnfoldOutlined style={{ cursor: "pointer" }} />
                ) : (
                  <MenuFoldOutlined style={{ cursor: "pointer" }} />
                )}
              </Button>
            )}
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

      {/*移动端侧边栏Drawer*/}
      {isMobile && (
        <SidebarNav
          mobileVisible={mobileSidebarVisible}
          onMobileClose={() => setMobileSidebarVisible(false)}
        />
      )}

      {/*主内容区*/}
      <Content className="overflow-y-scroll custom-scrollbar minHeight-large pe-2 ps-2 ">
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

            {/* 加载指示器 */}
            {isTasksLoading && (
              <div className="task-group loading-indicator text-center p-8">
                <Spin size="large" tip="加载中..." />
              </div>
            )}

            {/*已置顶分组 - 直接渲染置顶任务列表*/}
            {!isTasksLoading && pinnedTasks.length > 0 && (
              <FilterGroup
                key={"pinned"}
                title={"⭐已置顶"}
                tasks={pinnedTasks}
              >
                <div className="task-group">
                  <TodoTreeTable
                    tasks={pinnedTasks}
                    expandedRowKeys={expandedRowKeys}
                    onExpandChange={handleExpandChange}
                    PTableDOM={PTableDOM}
                    filterCompleted={true}
                  />
                </div>
              </FilterGroup>
            )}

            {/*普通渲染模式 - 使用树形表格*/}
            {!isTasksLoading && groupMode === "none" && tasks.length > 0 && (
              <div className="task-group">
                <TodoTreeTable
                  tasks={tasks}
                  expandedRowKeys={expandedRowKeys}
                  onExpandChange={handleExpandChange}
                  PTableDOM={PTableDOM}
                  filterCompleted={true}
                />
              </div>
            )}

            {/*分组模式 - 每个分组使用独立的树形表格*/}
            {!isTasksLoading &&
              groupMode !== "none" &&
              displayGroups.length > 0 &&
              displayGroups.map((group) => (
                <FilterGroup
                  key={group.title}
                  title={group.title}
                  tasks={group.tasks}
                  isUngrouped={group.type === "ungrouped"}
                >
                  <div className="task-group">
                    <TodoTreeTable
                      tasks={group.tasks}
                      expandedRowKeys={expandedRowKeys}
                      onExpandChange={handleExpandChange}
                      PTableDOM={PTableDOM}
                      filterCompleted={true}
                    />
                  </div>
                </FilterGroup>
              ))}

            {/*使用ProTable分页树形表格展示已完成任务，不再虚化显示*/}
            {!isTasksLoading &&
              (activeListId === "cp" ||
                activeListId === "bin" ||
                !hideCompletedTasks) && (
                <FilterGroup title="已完成" tasks={[]}>
                  <div style={{ opacity: ".4" }}>
                    <ProTable
                      columns={columns}
                      showHeader={false}
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

            {/* 无任务提示 */}
            {!isTasksLoading &&
              !pinnedTasks.length &&
              !tasks.length &&
              groupMode === "none" && (
                <div className="task-group text-center p-8">
                  <Typography.Text type="secondary">暂无任务</Typography.Text>
                </div>
              )}

            {/* 分组模式下无任务提示 */}
            {!isTasksLoading &&
              groupMode !== "none" &&
              displayGroups.length === 0 && (
                <div className="task-group text-center p-8">
                  <Typography.Text type="secondary">暂无任务</Typography.Text>
                </div>
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
            <span></span>
          )}
          {activeListId !== "bin" && (
            <span>
              未完成：
              {displayUncompletedCount + pinnedTasks.length
                ? displayUncompletedCount + pinnedTasks.length
                : 0}
              个
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
