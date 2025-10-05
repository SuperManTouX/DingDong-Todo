import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import "@/styles/FilteredTodoList.css";
import Controller from "./Controller";
import FilterGroup from "./FilterGroup";
import TaskItemRenderer from "./TaskItemRenderer";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  EllipsisOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button, Col, Dropdown, Row, Space, Typography, message } from "antd";
import { Header, Content, Footer } from "antd/es/layout/layout";
import useTodoGrouping from "@/hooks/useTodoGrouping";
import useTodoOperations from "../../hooks/useTodoOperations";
import useTodoHierarchy from "../../hooks/useTodoHierarchy";
import { getActiveListTasks, useTodoStore } from "@/store/todoStore";
import { useGlobalSettingsStore } from "@/store/globalSettingsStore";
import { isEqual } from "lodash";
import api from "@/services/api";
import { SpecialLists } from "@/constants";

// 虚拟滚动组件接口
interface VirtualListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  keyExtractor: (item: any, index: number) => string;
}

// 虚拟滚动组件实现
const VirtualList: React.FC<VirtualListProps> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算可见项的数量
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  // 计算起始索引和结束索引
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

  // 获取可见项
  const visibleItems = items.slice(startIndex, endIndex);

  // 计算偏移量
  const offsetY = startIndex * itemHeight;

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: `${containerHeight}px`,
        overflowY: "auto",
        position: "relative",
        width: "100%",
      }}
      onScroll={handleScroll}
      className="custom-scrollbar"
    >
      <div
        style={{
          height: `${items.length * itemHeight}px`,
          position: "relative",
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={keyExtractor(item, index + startIndex)}
              style={{ height: `${itemHeight}px` }}
            >
              {renderItem(item, index + startIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function FilteredTodoList({
  groupName,
  toggleCollapsed,
  collapsed,
}: {
  groupName: string;
  toggleCollapsed: () => void;
  collapsed: boolean;
}) {
  // 获取所有任务，然后根据用户ID过滤
  const tasks = getActiveListTasks();
  const { pinnedTasks, activeListId } = useTodoStore();
  // 获取全局设置和操作方法
  const {
    showTaskDetails,
    toggleShowTaskDetails,
    toggleHideCompletedTasks,
    hideCompletedTasks,
  } = useGlobalSettingsStore();

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
    renderTodos,
    renderOtherTodos,
    isAllDone,
  } = useTodoOperations(tasks);

  const {
    expandedTasks,
    sensors,
    toggleTaskExpand,
    hasSubTasks,
    getHierarchicalTasks,
    getHierarchicalTasksForGroup,
    handleDragOver,
    handleDragEnd,
  } = useTodoHierarchy(tasks, renderTodos, renderOtherTodos);

  // 使用useMemo缓存渲染的任务数据，避免不必要的重渲染
  const hierarchicalTasks = useMemo(() => {
    return getHierarchicalTasks();
  }, [getHierarchicalTasks, expandedTasks, tasks]);
  console.log(hierarchicalTasks);
  // 使用useMemo缓存置顶任务的层次结构
  const pinnedTasksHierarchical = useMemo(() => {
    return getHierarchicalTasksForGroup(pinnedTasks);
  }, [getHierarchicalTasksForGroup, pinnedTasks, expandedTasks]);

  // 使用useMemo缓存其他任务
  const otherTodos = useMemo(() => {
    return renderOtherTodos();
  }, [renderOtherTodos, tasks]);

  // 使用React.memo包装TaskItemRenderer以避免不必要的重渲染
  const MemoizedTaskItemRenderer = React.memo(
    TaskItemRenderer,
    (prevProps, nextProps) => {
      // 深度比较props以确定是否需要重新渲染
      return isEqual(prevProps, nextProps);
    },
  );

  // 渲染任务项
  const renderTaskItem = useCallback(
    (item: any) => (
      <MemoizedTaskItemRenderer
        key={
          typeof item === "object" && "id" in item
            ? item.id
            : `group-${Math.random()}`
        }
        item={item}
        expandedTasks={expandedTasks}
        hasSubTasks={hasSubTasks}
        toggleTaskExpand={toggleTaskExpand}
      />
    ),
    [expandedTasks, hasSubTasks, toggleTaskExpand],
  );

  // 判断是否需要使用虚拟滚动（任务数量超过50个时启用）
  const shouldUseVirtualScroll = tasks.length > 50;

  return (
    <>
      {/*标题栏*/}
      <Header
        style={{ backgroundColor: "var(--theme--colorBgLayout)" }}
        className=" pt-1 pb-1 border-0 pe-2 ps-2"
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
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

              {/*已置顶分组 - 不使用虚拟滚动，因为置顶任务通常较少*/}
              {pinnedTasks.length > 0 && (
                <FilterGroup
                  key={"pinned"}
                  title={"⭐已置顶"}
                  tasks={pinnedTasks}
                >
                  {pinnedTasksHierarchical.map(renderTaskItem)}
                </FilterGroup>
              )}

              {/*根据分组模式渲染任务列表*/}
              {groupMode === "none" &&
                hierarchicalTasks.length > 0 &&
                (shouldUseVirtualScroll ? (
                  // 使用虚拟滚动优化长列表
                  <VirtualList
                    items={hierarchicalTasks}
                    itemHeight={60} // 假设每个任务项的高度为60px
                    containerHeight={400} // 设置虚拟滚动容器高度
                    renderItem={(item) => (
                      <div className="py-1">{renderTaskItem(item)}</div>
                    )}
                    keyExtractor={(item) =>
                      typeof item === "object" && "id" in item
                        ? item.id
                        : `item-${Math.random()}`
                    }
                  />
                ) : (
                  // 普通渲染模式
                  hierarchicalTasks.map(renderTaskItem)
                ))}

              {groupMode !== "none" &&
                displayGroups.length > 0 &&
                displayGroups.map((group) => (
                  <FilterGroup
                    key={group.title}
                    title={group.title}
                    tasks={group.tasks}
                    isUngrouped={group.type === "ungrouped"}
                  >
                    {group.tasks.length > 30 ? (
                      // 每个分组内的任务超过30个时使用虚拟滚动
                      <VirtualList
                        items={getHierarchicalTasksForGroup(group.tasks)}
                        itemHeight={60}
                        containerHeight={300}
                        renderItem={(item) => (
                          <div className="py-1">{renderTaskItem(item)}</div>
                        )}
                        keyExtractor={(item) =>
                          typeof item === "object" && "id" in item
                            ? item.id
                            : `group-item-${Math.random()}`
                        }
                      />
                    ) : (
                      getHierarchicalTasksForGroup(group.tasks).map(
                        renderTaskItem,
                      )
                    )}
                  </FilterGroup>
                ))}

              {/*虚化显示其他任务 - 通常数量不多，不使用虚拟滚动*/}
              {otherTodos.length > 0 &&
                (activeListId === "cp" ||
                  activeListId === "bin" ||
                  !hideCompletedTasks) && (
                  <FilterGroup title="已完成" tasks={otherTodos}>
                    <div style={{ opacity: `.3` }}>
                      {otherTodos.map(renderTaskItem)}
                    </div>
                  </FilterGroup>
                )}
            </Space>
          </div>
        </DndContext>
      </Content>

      {/*底部操作栏*/}
      <Footer className="rounded-bottom">
        <Row align={"middle"} justify={"space-between"}>
          <button
            type="button"
            onClick={() => handleDeleteAllCompleted()}
            className="btn btn-primary btn-sm"
          >
            删除所有已完成
          </button>
          <span className="">
            未完成：{displayUncompletedCount + pinnedTasks.length}个
          </span>
        </Row>
      </Footer>
    </>
  );
}
