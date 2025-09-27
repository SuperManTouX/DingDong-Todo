import React from "react";
import { Layout, type MenuProps } from "antd";
import {
  useTodoStore,
  getActiveListData,
  useSelectTodo,
  activeListId,
} from "@/store/todoStore";
import FilteredTodoList from "@/pages/TodoPage/FilteredTodoList";
import EditTodo from "@/pages/TodoPage/EditTodo";
import Sider from "antd/es/layout/Sider";
import SideMenu from "@/pages/TodoPage/SideMenu";
import ListGroupManager from "@/pages/TodoPage/ListGroupManager";
import { useTodoDataLoader } from "@/hooks/useTodoDataLoader";
/**
 * 待办事项页面组件
 * 显示主待办事项列表和编辑功能
 */
const Index: React.FC = () => {
  const { setActiveListId, dispatchTodo, activeListId } = useTodoStore();

  // 使用自定义hook加载待办数据
  useTodoDataLoader();

  const activeListData = getActiveListData();
  const selectedTodo = useSelectTodo();
  let activeListTitle: string = "";
  if (activeListData.title === "") {
    switch (activeListId) {
      case "tody":
        activeListTitle = "今天";
        break;
      case "nearlyWeek":
        activeListTitle = "最近七天";
        break;
      case "cp":
        activeListTitle = "已完成";
        break;
      case "bin":
        activeListTitle = "回收站";
        break;
    }
  }
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
          groupName={activeListTitle}
        ></FilteredTodoList>
      </Layout>
      <Layout>
        {selectedTodo && (
          <EditTodo key={selectedTodo.id} onTodoChange={dispatchTodo} />
        )}
      </Layout>
      {/* 清单管理模态框 */}
      {listGroupManager.groupModal}
      {/* 标签管理模态框 */}
      {listGroupManager.tagModal}
    </>
  );
};

export default Index;
