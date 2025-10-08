import React, { useEffect, useState } from "react";
import { Layout, type MenuProps, Button } from "antd";
import {
  useTodoStore,
  getActiveListData,
  useSelectTodo,
} from "@/store/todoStore";
import { useGlobalSettingsStore } from "@/store/globalSettingsStore";
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
  const { activeListId, todoTags } = useTodoStore();
  const {
    isTodoDrawerOpen,
    setIsTodoDrawerOpen,
    isMobile,
    collapsed,
    toggleCollapsed,
  } = useGlobalSettingsStore();

  // 使用自定义hook加载待办数据
  useTodoDataLoader();

  const activeListData = getActiveListData();
  const selectedTodo = useSelectTodo();
  let activeListTitle: string =
    activeListData.emoji + activeListData.title || "";
  //多种情况的Title
  if (activeListTitle === "") {
    if (activeListId.includes("tag")) {
      // 当activeListId包含"tag"字样时，从todoTags中查找对应的标签
      const tag = todoTags.find((t) => t.id === activeListId);
      if (tag) {
        activeListTitle = tag.name;
      }
    } else {
      switch (activeListId) {
        case "today":
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
  }
  // 使用ListGroupManager组件管理清单组
  const listGroupManager = ListGroupManager();

  // 直接使用listGroupManager.menuItem作为第一层菜单
  const menuItem: MenuProps["items"] = listGroupManager.menuItem;

  return (
    <>
      <Sider width={250} collapsedWidth={80} collapsed={collapsed}>
        <SideMenu menuItem={menuItem} />
      </Sider>
      <Layout className={" border-0"}>
        <FilteredTodoList
          key={useTodoStore.getState().activeListId}
          groupName={activeListTitle}
          toggleCollapsed={toggleCollapsed}
          collapsed={collapsed}
        />
      </Layout>
      {/*如果屏幕小了就不显示*/}
      <EditTodo
        key={selectedTodo ? selectedTodo.id : "s"}
        asDrawer={isMobile}
        open={isMobile ? isTodoDrawerOpen : true}
        onClose={isMobile ? () => setIsTodoDrawerOpen(false) : undefined}
      />

      {/* 清单管理模态框 */}
      {listGroupManager.groupModal}
      {/* 标签管理模态框 */}
      {listGroupManager.tagModal}
    </>
  );
};

export default Index;
