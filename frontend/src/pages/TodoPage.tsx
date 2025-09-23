import React from "react";
import { Layout, MenuProps } from "antd";
import {
  useTodoStore,
  getActiveListData,
  useSelectTodo,
  getActiveListTasks,
} from "@/store/todoStore";
import FilteredTodoList from "@/Layout/FilteredTodoList";
import EditTodo from "@/Layout/EditTodo";
import { Outlet } from "react-router-dom";
import Sider from "antd/es/layout/Sider";
import SideMenu from "@/Layout/SideMenu";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { generateAntdThemeConfig } from "@/theme/themeConfig";
import ListGroupManager from "@/components/ListGroupManager";

/**
 * 待办事项页面组件
 * 显示主待办事项列表和编辑功能
 */
const TodoPage: React.FC = () => {
  const activeListData = getActiveListData();
  const selectTodo = useSelectTodo();
  const { setActiveListId } = useTodoStore();

  // 使用ListGroupManager组件管理清单组
  const listGroupManager = ListGroupManager({
    onActiveGroupChange: setActiveListId,
  });

  // 直接使用listGroupManager.menuItem作为第一层菜单
  const menuItem: MenuProps["items"] = listGroupManager.menuItem;
  return (
    <>
      <Sider width="15%">
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
