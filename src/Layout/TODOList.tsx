import "@/styles/TODOList.css";
import { useState, useCallback } from "react";
import Controller from "../components/Controller";
import TodoItem from "../components/TodoItem";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { SortableList, SortableItem } from "@/components/SortableComponents";
import type { Todo, TodoCompleteAllAction, TodoListData } from "@/types";
import { ShowType, type ShowTypeValue } from "@/constants";
import dayjs from "dayjs";
import ContextMenu from "../components/ContextMenu";
import { Row, Space } from "antd";
import { Collapse } from "react-bootstrap";
import { Content, Footer, Header } from "antd/es/layout/layout";
import { useTodoStore } from "@/store/todoStore";

export default function TODOList({
  groupName,
  todoList: propTodoList,
}: {
  groupName: string;
  todoList: TodoListData;
}) {
  const { dispatchTodo } = useTodoStore();
  // 设置@dnd-kit传感器
  const sensors = [
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  ];

  // 读取本地值
  // if (localStorage.getItem('todoList') !== null) {
  //     todoTasks = JSON.parse(localStorage.getItem('todoList') as string) as TodoListData;
  // }
  const [title, setTitle] = useState<string>("");
  const [showType, setShowType] = useState<ShowTypeValue>(ShowType.uncompleted);
  const todoList = propTodoList;
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    {},
  );
  let isAllDone =
    todoList.tasks.length > 0 && todoList.tasks.every((t) => t.completed);

  // 设置本地值
  // localStorage.setItem('todoList', JSON.stringify(todoList))
  //点击添加按钮 - 添加根任务
  function handleAdded(): void {
    const { activeGroupId } = useTodoStore.getState();
    dispatchTodo({
      type: "added",
      title: title,
      completed: false,
      groupId: activeGroupId,
    });
    setTitle("");
  }

  //切换任务列表（全部，未完成，已完成）
  function handleSwitchShow(showType: ShowTypeValue) {
    setShowType(showType);
  }

  // 获取层次化的任务列表（考虑过滤条件）
  function getHierarchicalTasks(type: boolean = true): (Todo | Todo[])[] {
    if (!type && renderOtherTodos().length === 0) return [];
    // 首先获取过滤后的任务列表
    const filteredTodos = type ? renderTodos() : renderOtherTodos();

    // 递归构建层次化任务结构
    const buildHierarchicalTasks = (
      parentId: string | null,
    ): (Todo | Todo[])[] => {
      const result: (Todo | Todo[])[] = [];

      // 获取当前父任务的直接子任务
      const tasks = filteredTodos.filter((task) => task.parentId === parentId);

      tasks.forEach((task) => {
        result.push(task);

        // 获取该任务的子任务
        const subTasks = buildHierarchicalTasks(task.id);

        // 仅在任务展开状态下添加子任务
        if (subTasks.length > 0 && expandedTasks[task.id]) {
          // 收集所有子任务（包括嵌套的子任务）
          const allSubTasks: Todo[] = [];

          const collectSubTasks = (items: (Todo | Todo[])[]) => {
            items.forEach((item) => {
              if ("id" in item) {
                allSubTasks.push(item);
              } else {
                collectSubTasks(item);
              }
            });
          };

          collectSubTasks(subTasks);

          if (allSubTasks.length > 0) {
            result.push(allSubTasks);
          }
        }
      });

      return result;
    };

    // 从根任务开始构建层次结构
    return buildHierarchicalTasks(null);
  }

  // 切换任务展开状态
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // 检查任务是否有子任务
  const hasSubTasks = (taskId: string): boolean => {
    return todoList.tasks.some((task) => task.parentId === taskId);
  };

  //todo模板初始化
  function renderTodos(): Todo[] {
    switch (showType) {
      case ShowType.all:
        return todoList.tasks;
      case ShowType.completed:
        return todoList.tasks.filter((t) => t.completed);
      case ShowType.uncompleted:
        return todoList.tasks.filter((t) => !t.completed);
      case ShowType.overdue:
        return todoList.tasks.filter(
          (t) => dayjs(t.deadline).diff(dayjs(), "day") >= 0,
        );
      default:
        return [];
    }
  }

  function renderOtherTodos(): Todo[] {
    switch (showType) {
      case ShowType.all:
        return [];
      //   已完成
      case ShowType.completed:
        return todoList.tasks.filter((t) => !t.completed);
      //未完成
      case ShowType.uncompleted:
        return todoList.tasks.filter((t) => t.completed);
      //已逾期
      case ShowType.overdue:
        return todoList.tasks.filter(
          (t) => dayjs(t.deadline).diff(dayjs(), "day") < 0,
        );
      default:
        return [];
    }
  }

  //当一键完成或一键取消完成的时候
  function handleCompleteAll(action: TodoCompleteAllAction) {
    const { activeGroupId } = useTodoStore.getState();
    dispatchTodo({ ...action, showType, groupId: activeGroupId });
  }

  //计算未完成的个数
  function calculateUncompletedCount() {
    return todoList.tasks.reduce((l, n) => {
      if (!n.completed) return l + 1;
      return l;
    }, 0);
  }

  // 拖动排序方法 - 使用@dnd-kit处理拖拽排序和层级转换
  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;

      // 如果没有放置目标或放置在自身上，则不处理
      if (!over || active.id === over.id) {
        return;
      }

      // 获取拖动和放置的任务
      const draggedTask = todoList.tasks.find((item) => item.id === active.id);
      const targetTask = todoList.tasks.find((item) => item.id === over.id);

      if (!draggedTask || !targetTask) return;

      // 深拷贝任务列表以进行修改
      const updatedTasks: Todo[] = JSON.parse(JSON.stringify(todoList.tasks));
      const draggedIndex = updatedTasks.findIndex(
        (item) => item.id === active.id,
      );
      const targetIndex = updatedTasks.findIndex((item) => item.id === over.id);

      // 处理层级转换
      // 1. 如果拖动的是子任务（有parentId）到顶级任务位置（无parentId或parentId不同）
      if (
        draggedTask.parentId &&
        (!targetTask.parentId || targetTask.parentId !== draggedTask.parentId)
      ) {
        // 将子任务转换为父任务
        updatedTasks[draggedIndex].parentId = null;
        updatedTasks[draggedIndex].depth = 0;

        // 更新该任务的所有子任务的depth
        const updateChildDepths = (taskId: string, newDepth: number) => {
          updatedTasks.forEach((task) => {
            if (task.parentId === taskId) {
              task.depth = newDepth + 1;
              updateChildDepths(task.id, task.depth);
            }
          });
        };
        updateChildDepths(updatedTasks[draggedIndex].id, 0);
      }
      // 2. 如果拖动的是父任务（无parentId或depth为0）到子任务位置
      else if (
        (!draggedTask.parentId || draggedTask.depth === 0) &&
        targetTask.depth > 0
      ) {
        // 将父任务转换为子任务，成为目标任务的兄弟任务
        updatedTasks[draggedIndex].parentId = targetTask.parentId;
        updatedTasks[draggedIndex].depth = targetTask.depth;

        // 更新该任务的所有子任务的depth
        const updateChildDepths = (taskId: string, newDepth: number) => {
          updatedTasks.forEach((task) => {
            if (task.parentId === taskId) {
              task.depth = newDepth + 1;
              updateChildDepths(task.id, task.depth);
            }
          });
        };
        updateChildDepths(updatedTasks[draggedIndex].id, targetTask.depth);
      }

      // 执行排序操作
      const [removed] = updatedTasks.splice(draggedIndex, 1);
      updatedTasks.splice(targetIndex, 0, removed);
      // 一次性替换整个列表
      const { activeGroupId } = useTodoStore.getState();
      dispatchTodo({
        type: "replaced",
        todoList: updatedTasks,
        groupId: activeGroupId,
      });
    },
    [todoList, dispatchTodo],
  );

  // 删除所有已完成
  function handleDeleteAllCompleted() {
    const { activeGroupId } = useTodoStore.getState();
    dispatchTodo({
      type: "deletedAll",
      todoList: todoList.tasks,
      groupId: activeGroupId,
    });
  }

  // 获取所有可排序的任务ID
  const sortableTaskIds = getHierarchicalTasks()
    .flatMap((item) =>
      "id" in item ? [item.id] : item.map((subItem) => subItem.id),
    )
    .filter(Boolean);

  return (
    <>
      {/*rounded-top*/}
      <Header className="theme-color ">
        <Row className={"h-100"} align={"top"} justify="start">
          <span className={"h-100 d-inline-block"}>{groupName}</span>
        </Row>
      </Header>

      <Content className="minHeight-large pe-2 ps-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableList items={sortableTaskIds}>
            <ul className="col p-2">
              <Space className="w-100" direction="vertical" size="small">
                {/*顶部操作Li*/}
                {
                  <Controller
                    isAllDone={isAllDone}
                    onSwitchShow={handleSwitchShow}
                    onCompleteAll={handleCompleteAll}
                    showType={showType}
                    text={title}
                    setText={setTitle}
                    onAdded={handleAdded}
                  />
                }
                {/*层次化任务列表渲染*/}
                {getHierarchicalTasks().map((item) => {
                  // 如果是根任务
                  if ("id" in item) {
                    return (
                      <SortableItem key={item.id} id={item.id}>
                        <ContextMenu key={item.id} todo={item}>
                          <div style={{ cursor: "context-menu" }}>
                            <TodoItem
                              todo={item}
                              hasSubTasks={hasSubTasks(item.id)}
                              isExpanded={expandedTasks[item.id]}
                              onToggleExpand={() => toggleTaskExpand(item.id)}
                            />
                          </div>
                        </ContextMenu>
                        {/* 子任务折叠面板 */}
                        <Collapse in={expandedTasks[item.id]}>
                          <div style={{ marginLeft: "20px" }}>
                            {/* 子任务将在getHierarchicalTasks中自动渲染 */}
                          </div>
                        </Collapse>
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
                              <TodoItem
                                todo={subTodo}
                                hasSubTasks={hasSubTasks(subTodo.id)}
                                isExpanded={expandedTasks[subTodo.id]}
                                onToggleExpand={() =>
                                  toggleTaskExpand(subTodo.id)
                                }
                              />
                            </div>
                          </ContextMenu>
                        </div>
                      </SortableItem>
                    ));
                  }
                })}
                {/*虚化Todo*/}
                <div style={{ opacity: `.3` }}>
                  {renderOtherTodos().map((item) => {
                    /* if ("id" in item) {*/
                    return (
                      <TodoItem
                        key={item.id}
                        todo={item}
                        isExpanded={expandedTasks[item.id]}
                        onToggleExpand={() => toggleTaskExpand(item.id)}
                      />
                    );
                  })}
                </div>
              </Space>
            </ul>
          </SortableList>
        </DndContext>
      </Content>
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
            未完成：{calculateUncompletedCount()}个{}
          </span>
        </Row>
      </Footer>
    </>
  );
}
