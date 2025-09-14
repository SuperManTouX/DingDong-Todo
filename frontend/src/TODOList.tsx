import "./TODOList.css";
import { v4 as uuidv4 } from "uuid";
import { useImmerReducer } from "use-immer";
// @ts-ignore
import React, { useState } from "react";
import Controller from "./Controller";
import TodoItem from "./TodoItem";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import reducer from "./reducer.ts";
import type {
  ShowType as ST,
  SubTodo,
  Todo,
  TodoCompleteAllAction,
} from "@/types.d.ts";
import { ShowType, type ShowTypeValue } from "@/constants";
import dayjs from "dayjs";

import ContextMenu from "./ContextMenu";
import { Col, Row, Space } from "antd";
import { Content, Footer, Header } from "antd/es/layout/layout";

// 1. 完成   / 未完成 过滤栏添加三个按钮：All / Active / Completed，点谁就只显示对应列表。
// 2. 完成  一键全选 / 取消全选顶部放 checkbox，逻辑：若已全选则 取消全选，否则全部勾选。
// 3. 完成   未完成计数器 / 在标题旁实时显示 “还剩 3 项未完成”。
// 4. 完成  双击快速编辑 / 在 TodoItem 上双击文字直接进入编辑模式（现有必须点“编辑”按钮）。
// 5. 完成  拖拽排序/ 用 @dnd-kit/sortable 或 react-beautiful-dnd 实现上下拖拽调整顺序。
// 6. 完成  本地持久化 / 每次改动后把 todos 写进 localStorage，刷新页面自动读回。
// 7. 完成  优先级标记 / 给 Todo 加 priority: 'low' | 'medium' | 'high' 字段，UI 用颜色或图标区分，并可切换优先级。
// 8. 完成  批量删除已完成 / 底部增加“清除已完成”按钮，一键删掉所有 done === true 的项。

export default function TODOList() {
  let initialTodoList: Todo[] = [
    {
      id: "1",
      text: "学习 React",
      completed: false,
      priority: 2,
      datetimeLocal: dayjs().format(),
      deadline: dayjs("2025-9-15").format(),
      subTodo: [
        {
          subId: uuidv4(),
          subText: "Sub 学习  React1",
          subCompleted: false,
          subPriority: 2,
          subDatetimeLocal: dayjs().format(),
          subDeadline: dayjs("2025-9-18").format(),
          todoId: "1",
        },
        {
          subId: uuidv4(),
          subText: "Sub 学习  React2",
          subCompleted: false,
          subPriority: 2,
          subDatetimeLocal: dayjs().format(),
          subDeadline: dayjs("2025-9-18").format(),
          todoId: "1",
        },
        {
          subId: uuidv4(),
          subText: "Sub 学习  React3",
          subCompleted: false,
          subPriority: 2,
          subDatetimeLocal: dayjs().format(),
          subDeadline: dayjs("2025-9-18").format(),
          todoId: "1",
        },
      ],
    },
    {
      id: uuidv4(),
      text: "写一个 TODOListOriginal 组件",
      completed: true,
      priority: 1,
      datetimeLocal: dayjs().format(),
      deadline: dayjs("2025-9-10").format(),
    },
    {
      id: uuidv4(),
      text: "部署到 GitHub Pages",
      completed: false,
      priority: 0,
      datetimeLocal: dayjs().format(),
      deadline: dayjs("2025-9-10").format(),
    },
    {
      id: uuidv4(),
      text: "test",
      completed: false,
      priority: 0,
    },
  ];
  // 读取本地值
  // if (localStorage.getItem('todoList') !== null) {
  //     0
  //     initialTodoList = JSON.parse(localStorage.getItem('todoList') as string) as Todo[];
  // }
  const [text, setText] = useState<string>("");
  const [showType, setShowType] = useState<ST>(ShowType.uncompleted);
  const [todoList, dispatch] = useImmerReducer(reducer, initialTodoList);
  let isAllDone = todoList.length > 0 && todoList.every((t) => t.completed);

  // 设置本地值
  // localStorage.setItem('todoList', JSON.stringify(todoList))

  //点击添加按钮
  function handleAdded(): void {
    dispatch({ type: "added", text, completed: false });
    setText("");
  }

  //切换任务列表（全部，未完成，已完成）
  function handleSwitchShow(showType: ShowTypeValue) {
    setShowType(showType);
  }

  //todo模板初始化
  function renderTodos(): Todo[] {
    switch (showType) {
      case ShowType.all:
        return todoList;
      case ShowType.completed:
        return todoList.filter((t) => t.completed);
      case ShowType.uncompleted:
        return todoList.filter((t) => !t.completed);
      case ShowType.overdue:
        return todoList.filter(
          (t) => dayjs(t.deadline).diff(dayjs(), "day") < 0,
        );
      default:
        return [];
    }
  }

  function renderOtherTodos(): Todo[] | null {
    switch (showType) {
      case ShowType.all:
        return null;
      //   已完成
      case ShowType.completed:
        return todoList.filter((t) => !t.completed);
      //未完成
      case ShowType.uncompleted:
        return todoList.filter((t) => t.completed);
      //已逾期
      case ShowType.overdue:
        return todoList.filter(
          (t) => dayjs(t.deadline).diff(dayjs(), "day") < 0,
        );
      default:
        return [];
    }
  }

  //当一键完成或一键取消完成的时候
  function handleCompleteAll(action: TodoCompleteAllAction) {
    dispatch({ ...action, showType });
  }

  //计算未完成的个数
  function calculateUncompletedCount() {
    return todoList.reduce((l, n) => {
      if (!n.completed) return l + 1;
      return l;
    }, 0);
  }

  // 拖动排序方法
  function onDragEnd(result: DropResult) {
    const { destination, source, type, draggableId } = result;
    if (type === "PARENT") {
      // 没放下 / 原地放下
      if (!destination) return;
      if (destination.index === source.index) return;
      // 1. 深拷贝（Immer 外做，避免 draft 混淆）
      const rT = [...renderTodos()];
      const newOrder = [...todoList];
      const originalSourceIndex = todoList.findIndex(
        (t) => t.id === draggableId,
      );
      const originalDestinationIndex = todoList.findIndex(
        (t) => t.id === rT[destination.index].id,
      );
      console.log();
      todoList.findIndex((t) => t.id === draggableId);
      const [moved] = newOrder.splice(originalSourceIndex, 1);
      newOrder.splice(originalDestinationIndex, 0, moved);
      console.log(newOrder);
      // 2. 一次性替换， reducer 里已写好 "replaced" 分支
      dispatch({ type: "replaced", todoList: newOrder });
    }
    if (type === "SUB") {
      // @ts-ignore
      let subId = draggableId;
      let todo =
        todoList[
          todoList.findIndex((t) => t.subTodo?.some((st) => st.subId === subId))
        ];
      let subTodo = todo.subTodo as SubTodo[];

      const newOrder = [...subTodo];
      const [moved] = newOrder.splice(source.index, 1);
      // @ts-ignore
      newOrder.splice(destination.index, 0, moved);

      // 2. 一次性替换， reducer 里已写好 "changed" 分支
      dispatch({ type: "changed", todo: { ...todo, subTodo: newOrder } });
    }
  }

  // 删除所有已完成
  function handleDeleteAllCompleted() {
    dispatch({ type: "deletedAll", todoList });
  }

  return (
    <>
      <Header className="bg-info rounded-top">
        <Row align={"middle"} justify="space-between">
          <Col>TODOLIST</Col>

          <Col>
            <div className="input-group input-group-sm ">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="form-control"
                placeholder="Username"
                aria-label="Username"
                aria-describedby="basic-addon1"
              />
              <button
                type="button"
                onClick={handleAdded}
                className="btn btn-primary btn-sm"
              >
                添加
              </button>
            </div>
          </Col>
        </Row>
      </Header>

      <Content className="minHeight-large pe-4 ps-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable" type="PARENT">
            {(provided) => (
              <ul
                className="col p-2"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <Space className="w-100" direction="vertical" size="small">
                  {/*顶部操作Li*/}
                  {
                    <Controller
                      isAllDone={isAllDone}
                      onSwitchShow={handleSwitchShow}
                      onCompleteAll={handleCompleteAll}
                      showType={showType}
                    />
                  }
                  {/*可拖动列表*/}
                  {renderTodos().map((t, index) => (
                    <Draggable key={t.id} draggableId={t.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <ContextMenu todo={t} onTodoChange={dispatch}>
                            <div style={{ cursor: "context-menu" }}>
                              <TodoItem todo={t} onTodoChange={dispatch} />
                            </div>
                          </ContextMenu>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {renderOtherTodos()?.map((t) => {
                    return (
                      <TodoItem
                        other={true}
                        key={t.id}
                        todo={t}
                        onTodoChange={dispatch}
                      />
                    );
                  })}
                </Space>
              </ul>
            )}
          </Droppable>
        </DragDropContext>
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
