import "@/styles/FilteredTodoList.css";
import React from "react";
import Controller from "../components/Controller";
import FilterGroup from "../components/FilterGroup";
import TaskItemRenderer from "../components/TaskItemRenderer";
import { DndContext, closestCenter } from "@dnd-kit/core";

import { Row, Space } from "antd";

import { Content, Footer, Header } from "antd/es/layout/layout";

import useTodoGrouping from "../hooks/useTodoGrouping";
import useTodoOperations from "../hooks/useTodoOperations";
import useTodoHierarchy from "../hooks/useTodoHierarchy";
import { getActiveListTasks } from "@/store/todoStore";

export default function FilteredTodoList({ groupName }: { groupName: string }) {
  const tasks = getActiveListTasks();
  // 使用hooks获取各种功能
  const { groupMode, groupedTasks, timeGroupedTasks, ungroupedTasks } =
    useTodoGrouping(tasks);
  const {
    title,
    showType,
    setTitle,
    handleAdded,
    handleSwitchShow,
    handleCompleteAll,
    handleDeleteAllCompleted,
    calculateUncompletedCount,
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
    handleDragEnd,
  } = useTodoHierarchy(tasks, renderTodos, renderOtherTodos);

  return (
    <>
      {/*标题栏*/}
      <Header className="theme-color ">
        <Row className={"h-100"} align={"top"} justify="start">
          <span className={"h-100 d-inline-block"}>{groupName}</span>
        </Row>
      </Header>

      {/*主内容区*/}
      <Content className="overflow-y-scroll minHeight-large pe-2 ps-2">
        <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <ul className="col p-2">
          <Space className="w-100" direction="vertical" size="small">
                {/*顶部控制器组件*/}
                <Controller
                  isAllDone={isAllDone}
                  onSwitchShow={handleSwitchShow}
                  onCompleteAll={handleCompleteAll}
                  showType={showType}
                  text={title}
                  setText={setTitle}
                  onAdded={handleAdded}
                  groupMode={groupMode}
                />

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

                {groupMode === "normal" && (
                  // 普通分组模式
                  <>
                    {/* 渲染已分组的任务 */}
                    {groupedTasks.map((group) => (
                      <FilterGroup
                        key={group.groupName}
                        title={group.groupName}
                        tasks={group.tasks}
                      >
                        {getHierarchicalTasksForGroup(group.tasks).map(
                          (item) => (
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
                          ),
                        )}
                      </FilterGroup>
                    ))}

                    {/* 渲染未分组的任务 */}
                    {ungroupedTasks.length > 0 && (
                      <FilterGroup title="未分组" tasks={ungroupedTasks}>
                        {getHierarchicalTasksForGroup(ungroupedTasks).map(
                          (item) => (
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
                          ),
                        )}
                      </FilterGroup>
                    )}
                  </>
                )}

                {groupMode === "time" && (
                  // 时间分组模式
                  <>
                    {/* 渲染按时间分组的任务 */}
                    {timeGroupedTasks.map((timeGroup) => (
                      <FilterGroup
                        key={timeGroup.date}
                        title={timeGroup.date}
                        tasks={timeGroup.tasks}
                      >
                        {getHierarchicalTasksForGroup(timeGroup.tasks).map(
                          (item) => (
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
                          ),
                        )}
                      </FilterGroup>
                    ))}

                    {/* 渲染未设置截止日期的任务 */}
                    {ungroupedTasks.filter((task) => !task.deadline).length >
                      0 && (
                      <FilterGroup
                        title="未设置截止日期"
                        tasks={ungroupedTasks.filter((task) => !task.deadline)}
                      >
                        {getHierarchicalTasksForGroup(
                          ungroupedTasks.filter((task) => !task.deadline),
                        ).map((item) => (
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
                    )}
                  </>
                )}

                {/*虚化显示其他任务（根据showType过滤掉的任务）*/}

                {/* {renderOtherTodos().map((item) => (
                    <TodoTask
                      key={item.id}
                      todo={item}
                      isExpanded={expandedTasks[item.id]}
                      onToggleExpand={() => toggleTaskExpand(item.id)}
                    />
                  ))}*/}
                {renderOtherTodos().length > 0 && (
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
      <Footer className="rounded-bottom">
        <Row align={"middle"} justify={"space-between"}>
          <button
            type="button"
            onClick={() => handleDeleteAllCompleted()}
            className="btn btn-primary btn-sm"
          >
            删除所有已完成
          </button>
          <span className="">未完成：{calculateUncompletedCount()}个</span>
        </Row>
      </Footer>
    </>
  );
}
