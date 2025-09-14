import "./bootstrap.css";
import "./TODOList.css";
import { v4 as uuidv4 } from "uuid";
import { useImmerReducer } from "use-immer";
import { useState } from "react";
import Controller from "./Controller";
import TodoItem from "./TodoItem";

// 1. 完成 / 未完成 过滤栏添加三个按钮：All / Active / Completed，点谁就只显示对应列表。
// 2. 一键全选 / 取消全选顶部放 checkbox，逻辑：若已全选则 取消全选，否则全部勾选。
// 3. 未完成计数器 / 在标题旁实时显示 “还剩 3 项未完成”。
// 4. 双击快速编辑 / 在 TodoItem 上双击文字直接进入编辑模式（现有必须点“编辑”按钮）。
// 5. 拖拽排序/ 用 @dnd-kit/sortable 或 react-beautiful-dnd 实现上下拖拽调整顺序。
// 6. 本地持久化 / 每次改动后把 todos 写进 localStorage，刷新页面自动读回。
// 7. 优先级标记 / 给 Todo 加 priority: 'low' | 'medium' | 'high' 字段，UI 用颜色或图标区分，并可切换优先级。
// 8. 批量删除已完成 / 底部增加“清除已完成”按钮，一键删掉所有 done === true 的项。

// @ts-ignore
enum ShowType {
  all = "all",
  completed = "completed",
  uncompleted = "uncompleted",
}

export default function TODOListOriginal() {
  const initialTodoList: Todo[] = [
    { id: uuidv4(), text: "学习 React", completed: false },
    { id: uuidv4(), text: "写一个 TODOListOriginal 组件", completed: true },
    { id: uuidv4(), text: "部署到 GitHub Pages", completed: false },
  ];
  const [text, setText] = useState<string>("");
  const [showType, setShowType] = useState<ShowType>(ShowType.all);
  const [todoList, dispatch] = useImmerReducer(
    todoListReducer,
    initialTodoList,
  );
  let isAllDone = todoList.length > 0 && todoList.every((t) => t.completed);

  //todoReducer
  function todoListReducer(draft: Todo[], action: TodoAction) {
    switch (action.type) {
      case "completeAll":
        switch (showType) {
          case ShowType.all:
            draft.forEach((t) => (t.completed = action.completeOrUncomplete));
            break;
          case ShowType.completed:
            draft.forEach((t) => {
              if (t.completed) {
                t.completed = false;
              }
            });
            break;
          case ShowType.uncompleted:
            draft.forEach((t) => {
              if (!t.completed) {
                t.completed = true;
              }
            });
            break;
        }
        break;
      case "deleted":
        return draft.filter((d) => d.id !== action.deleteId);
      case "added":
        draft.push({
          id: uuidv4(),
          text: action.text,
          completed: action.completed,
        });
        break;
      case "changed":
        let i = draft.findIndex((d) => d.id == action.todo.id);
        draft[i] = action.todo;
        break;
      case "replaced":
        console.log(action.todoList);
        return action.todoList;
    }
    //计算是否全部完成，如果是，打钩
  }

  //点击添加按钮
  function handleAdded(): void {
    dispatch({ type: "added", text, completed: false });
    setText("");
  }

  //切换任务列表（全部，未完成，已完成）
  function handleSwitchShow(showType: ShowType) {
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
    }
  }

  function renderOtherTodos(): Todo[] | null {
    switch (showType) {
      case ShowType.all:
        return null;
      case ShowType.completed:
        return todoList.filter((t) => !t.completed);
      case ShowType.uncompleted:
        return todoList.filter((t) => t.completed);
    }
  }

  //当一键完成或一键取消完成的时候
  function handleCompleteAll(action: TodoAction) {
    dispatch(action);
  }

  //当单个任务完成的时候
  function handleTodoChange(action: TodoAction) {
    dispatch(action);
  }

  //计算未完成的个数
  function calculateUncompletedCount() {
    return todoList.reduce((l, n) => {
      if (!n.completed) return l + 1;
      return l;
    }, 0);
  }

  return (
    <>
      <div className="container rounded mx-auto h-50 vertical-align">
        <div className="row bg-info rounded row-cols-2 justify-content-between p-2">
          <div className="col-2 align-items-center">TODOLIST</div>
          <div className="col">
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
          </div>
        </div>

        <div className="row  rounded h-50 mt-2 mb-2">
          <div className="col-2 border">侧边</div>
          <ul className="col">
            {
              <Controller
                isAllDone={isAllDone}
                onSwitchShow={handleSwitchShow}
                onCompleteAll={handleCompleteAll}
              />
            }

            {renderTodos().map((t) => {
              return (
                <TodoItem
                  key={t.id}
                  todo={t}
                  onTodoChange={handleTodoChange}
                  onTodoChange={dispatch}
                />
              );
            })}

            {renderOtherTodos()?.map((t) => {
              return (
                <TodoItem
                  other={true}
                  key={t.id}
                  todo={t}
                  onTodoChange={handleTodoChange}
                  onTodoChange={dispatch}
                />
              );
            })}
          </ul>
        </div>

        <div className="row rounded bg-light justify-content-end">
          未完成：{calculateUncompletedCount()}个{}
        </div>
      </div>
    </>
  );
}
