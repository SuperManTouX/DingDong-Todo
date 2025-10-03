import React from "react";
import "@/styles/FilteredTodoList.css";
import Controller from "./Controller";
import FilterGroup from "./FilterGroup";
import TaskItemRenderer from "./TaskItemRenderer";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { useState } from "react";
import {
  EllipsisOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button, Col, Dropdown, Menu, Row, Space, Typography } from "antd";
import { Header, Content, Footer } from "antd/es/layout/layout";
import useTodoGrouping from "../../hooks/useTodoGrouping";
import useTodoOperations from "../../hooks/useTodoOperations";
import useTodoHierarchy from "../../hooks/useTodoHierarchy";
import { getActiveListTasks, useTodoStore } from "@/store/todoStore";
import { useGlobalSettingsStore } from "@/store/globalSettingsStore";

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
  // 搜索状态管理
  const [searchText, setSearchText] = useState("");
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
    onClick: (e) => {
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
  const { groupMode, displayGroups, displayUncompletedCount } = useTodoGrouping(
    tasks,
    searchText,
  );
  const {
    handleAdded,
    handleCompleteAll,
    handleDeleteAllCompleted,
    renderTodos,
    renderOtherTodos,
    isAllDone,
  } = useTodoOperations(tasks, searchText);

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
  return (
    <>
      {/*标题栏*/}
      <Header className="theme-color pt-1 pb-1 border-0 pe-2 ps-2">
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
            <Dropdown menu={menuProps} trigger={["click"]}>
              <EllipsisOutlined
                style={{ cursor: "pointer", fontSize: "18px" }}
              />
            </Dropdown>
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
          <ul className="col p-2 pt-0">
            <Space className="w-100" direction="vertical" size="small">
              {/*顶部控制器组件*/}
              {!(activeListId === "bin" || activeListId === "cp") && (
                <Controller
                  isAllDone={isAllDone}
                  onCompleteAll={handleCompleteAll}
                  onAdded={handleAdded}
                  groupMode={groupMode}
                  searchText={searchText}
                  setSearchText={setSearchText}
                />
              )}

              {/*已置顶分组*/}
              {pinnedTasks.length > 0 && (
                <FilterGroup
                  key={"pinned"}
                  title={"⭐已置顶"}
                  tasks={pinnedTasks}
                >
                  {
                    // 已置顶分组元素
                    getHierarchicalTasksForGroup(pinnedTasks).map((item) => (
                      <TaskItemRenderer
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
                    ))
                  }
                </FilterGroup>
              )}

              {/*根据分组模式渲染任务列表*/}
              {groupMode === "none" &&
                // 未分组模式
                getHierarchicalTasks().map((item) => (
                  <TaskItemRenderer
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
                ))}

              {groupMode !== "none" &&
                displayGroups.map((group) => (
                  <FilterGroup
                    key={group.title}
                    title={group.title}
                    tasks={group.tasks}
                    isUngrouped={group.type === "ungrouped"}
                  >
                    {getHierarchicalTasksForGroup(group.tasks).map((item) => (
                      <TaskItemRenderer
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
                    ))}
                  </FilterGroup>
                ))}
              {/*虚化显示其他任务（根据showType过滤掉的任务）*/}
              {/*隐藏已完成任务，但是在“已完成”清单或“回收站”清单时依然显示*/}
              {renderOtherTodos().length > 0 &&
                (activeListId === "cp" ||
                  activeListId === "bin" ||
                  !hideCompletedTasks) && (
                  <FilterGroup title="已完成" tasks={renderOtherTodos()}>
                    <div style={{ opacity: `.3` }}>
                      {renderOtherTodos().map((item) => (
                        <TaskItemRenderer
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
                      ))}
                    </div>
                  </FilterGroup>
                )}
            </Space>
          </ul>
        </DndContext>
      </Content>

      {/*底部操作栏*/}
      <Footer className="rounded-bottom theme-color">
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
