import React, { useEffect } from "react";
import { Layout, type MenuProps } from "antd";
import {
  useTodoStore,
  getActiveListData,
  useSelectTodo,
} from "@/store/todoStore";
import FilteredTodoList from "@/pages/TodoPage/FilteredTodoList";
import EditTodo from "@/pages/TodoPage/EditTodo";
import Sider from "antd/es/layout/Sider";
import SideMenu from "@/pages/TodoPage/SideMenu";
import { useAuthStore } from "@/store/authStore";
import ListGroupManager from "@/pages/TodoPage/ListGroupManager";

/**
 * 待办事项页面组件
 * 显示主待办事项列表和编辑功能
 */
const TodoPage: React.FC = () => {
  const { setActiveListId, loadData } = useTodoStore();
  // 检查数据是否为初始化状态，如果是则加载数据
  useEffect(() => {
    // 检查数据是否为初始化状态的条件
    const isInitialState =
      // 检查todoListData是否为空或只有fallback数据
      (todoStoreState.todoListData.length === 0 ||
        (todoStoreState.todoListData.length === 1 &&
          todoStoreState.todoListData[0].id === "fallback_list")) &&
      // 检查用户是否已登录
      useAuthStore.getState().isAuthenticated;

    if (isInitialState) {
      console.log("检测到初始状态，加载数据...");
      loadData();
    }
  }, [loadData]);
  const activeListData = getActiveListData();
  const selectTodo = useSelectTodo();
  const todoStoreState = useTodoStore.getState();

  // 使用ListGroupManager组件管理清单组
  const listGroupManager = ListGroupManager({
    onActiveGroupChange: setActiveListId,
  });

  // 直接使用listGroupManager.menuItem作为第一层菜单
  const menuItem: MenuProps["items"] = listGroupManager.menuItem;
  return (
    <>
      <Sider width="250">
        <SideMenu menuItem={menuItem} onActiveGroupChange={setActiveListId} />
      </Sider>
      <Layout>
        <FilteredTodoList
          key={useTodoStore.getState().activeListId}
          groupName={activeListData.title}
        ></FilteredTodoList>
      </Layout>
      <Layout>
        {selectTodo && (
          <EditTodo
            key={selectTodo.id}
            onTodoChange={useTodoStore.getState().dispatchTodo}
          />
        )}
      </Layout>
      {/* 清单管理模态框 */}
      {listGroupManager.groupModal}
      {/* 标签管理模态框 */}
      {listGroupManager.tagModal}
    </>
  );
};

export default TodoPage;
