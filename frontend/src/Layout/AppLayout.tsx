import Sider from "antd/es/layout/Sider";
import React, { useState, useMemo } from "react";
import SideMenu from "./SideMenu";
import ListGroupManager from "../components/ListGroupManager";
import { Layout, type MenuProps } from "antd";
import todoListGroup from "../data/todoListGroup.json";
import todoTag from "../data/todoTags.json";
import type {
  Tag,
  TagReducerAction,
  Todo,
  TodoActionExtended,
  TodoListData,
} from "@/types";
import { useImmerReducer } from "use-immer";
import reducer from "../utils/reducer";
import EditTodo from "@/Layout/EditTodo";
import TODOList from "@/Layout/TODOList";
import tagReducer from "@/utils/tagReducer";

/**
 * 应用布局组件
 * 封装了Ant Design的Layout结构，包含侧边栏和主内容区域
 */

export default function AppLayout() {
  const [activeGroupId, setActiveGroupId] = useState<string>("a");

  // 使用整个todoListGroup数组初始化reducer
  const [todoListGroups, dispatchTodo] = useImmerReducer<
    TodoListData[],
    TodoActionExtended
  >(reducer, todoListGroup);
  const [todoTags, dispatchTag] = useImmerReducer<Tag[], TagReducerAction>(
    tagReducer,
    todoTag,
  );

  // 找出激活的组
  const activeGroup: TodoListData = useMemo(() => {
    return (
      todoListGroups.find((item) => item.id === activeGroupId) ||
      todoListGroups[0]
    );
  }, [todoListGroups, activeGroupId]);
  // 选中右侧编辑todo的ID
  const [selectTodoId, setSelectTodoId] = useState<string>(null);
  // 从todoListGroups中派生当前选中的todo对象
  const selectTodo = useMemo(() => {
    if (!selectTodoId) return null;
    for (const group of todoListGroups) {
      const todo = group.tasks.find((t) => t.id === selectTodoId);
      if (todo) return todo;
    }
    return null;
  }, [todoListGroups, selectTodoId]);
  // 验证函数，确保setSelectTodoId被正确调用
  const handleSelectTodoId = (todo: Todo) => {
    console.log("Selected todo:", todo);
    setSelectTodoId(todo.id);
  };
  // 创建一个新的dispatch函数，自动添加groupId参数
  const dispatchWithGroupId = React.useCallback(
    (action: any) => {
      dispatchTodo({
        ...action,
        groupId: activeGroupId,
      });
    },
    [dispatchTodo, activeGroupId],
  );

  const siderStyle1: React.CSSProperties = {
    textAlign: "center",
    lineHeight: "120px",
    color: "#fff",
    backgroundColor: "#3af152",
  };

  // 使用ListGroupManager组件管理清单组
  const listGroupManager = ListGroupManager({
    todoListGroups,
    todoTags,
    dispatch: dispatchTodo,
    onActiveGroupChange: setActiveGroupId,
  });

  // 直接使用listGroupManager.menuItem作为第一层菜单
  const menuItem: MenuProps["items"] = listGroupManager.menuItem;
  return (
    <Layout className="w-100 h-100">
      <Sider width="5%" style={siderStyle1}>
        SiderNav
      </Sider>
      <Sider width="18%">
        <SideMenu menuItem={menuItem} onActiveGroupChange={setActiveGroupId} />
      </Sider>
      <Layout>
        <TODOList
          key={activeGroupId}
          groupName={activeGroup.title}
          todoList={
            activeGroup || {
              id: "",
              title: "",
              tasks: [],
              createdAt: "",
              updatedAt: "",
            }
          }
          dispatch={dispatchWithGroupId}
          onTodoSelect={handleSelectTodoId}
        ></TODOList>
      </Layout>
      <Layout>
        {selectTodo && (
          <EditTodo
            todoTags={todoTags}
            key={selectTodo.id}
            selectTodo={selectTodo}
            onTodoChange={dispatchWithGroupId}
          />
        )}
      </Layout>
      {/* 清单管理模态框 */}
      {listGroupManager.groupModal}
    </Layout>
  );
}
