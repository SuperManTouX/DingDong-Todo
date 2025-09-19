import Sider from "antd/es/layout/Sider";
import React from "react";
import SideMenu from "./SideMenu";
import ListGroupManager from "../components/ListGroupManager";
import { Layout, type MenuProps } from "antd";
import { useTodoStore, useActiveGroup, useSelectTodo } from "@/store/todoStore";
import EditTodo from "@/Layout/EditTodo";
import TODOList from "@/Layout/TODOList";
import { useTodoActions } from "@/store/hooks";

/**
 * 应用布局组件
 * 封装了Ant Design的Layout结构，包含侧边栏和主内容区域
 */

export default function AppLayout() {
  const { todoListGroups, todoTags, setActiveGroupId, setSelectTodoId } = useTodoStore();
  const activeGroup = useActiveGroup();
  const selectTodo = useSelectTodo();
  const { handleAddTodo } = useTodoActions();
  // 验证函数，确保setSelectTodoId被正确调用
  const handleSelectTodoId = (todo: Todo) => {
    console.log("Selected todo:", todo);
    setSelectTodoId(todo.id);
  };

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
    dispatchTodo: useTodoStore.getState().dispatchTodo,
    dispatchTag: useTodoStore.getState().dispatchTag,
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
          key={useTodoStore.getState().activeGroupId}
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
          onTodoSelect={handleSelectTodoId}
          tags={todoTags}
        ></TODOList>
      </Layout>
      <Layout>
        {selectTodo && (
          <EditTodo
            todoTags={todoTags}
            key={selectTodo.id}
            selectTodo={selectTodo}
            onTodoChange={useTodoStore.getState().dispatchTodo}
          />
        )}
      </Layout>
      {/* 清单管理模态框 */}
      {listGroupManager.groupModal}
      {/* 标签管理模态框 */}
      {listGroupManager.tagModal}
    </Layout>
  );
}
