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
import EditTodoDrawer from "@/pages/TodoPage/EditTodoDrawer";
import Sider from "antd/es/layout/Sider";
import SideMenu from "@/pages/TodoPage/SideMenu";
import ListGroupManager from "@/pages/TodoPage/ListGroupManager";
import { useTodoDataLoader } from "@/hooks/useTodoDataLoader";
import { EditOutlined } from "@ant-design/icons";
/**
 * 待办事项页面组件
 * 显示主待办事项列表和编辑功能
 */
const Index: React.FC = () => {
  const { setActiveListId, activeListId, todoTags } = useTodoStore();
  const { isTodoDrawerOpen, setIsTodoDrawerOpen } = useGlobalSettingsStore();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // 添加isMobile状态
  const toggleCollapsed = () => setCollapsed(!collapsed);

  // 响应式监听：当屏幕宽度小到一定程度时设置状态
  useEffect(() => {
    // 定义响应式阈值
    const MOBILE_BREAKPOINT = 960;

    // 检查屏幕宽度并设置状态的函数
    const checkScreenWidth = () => {
      const screenWidth = window.innerWidth;
      // 按照要求，小于960px时设置isMobile为false

      setIsMobile(screenWidth <= MOBILE_BREAKPOINT);
      console.log(
        `屏幕宽度: ${screenWidth}px, isMobile: ${screenWidth <= MOBILE_BREAKPOINT}`,
      );
    };

    // 初始化时检查一次
    checkScreenWidth();

    // 添加resize事件监听器
    window.addEventListener("resize", checkScreenWidth);

    // 清理函数
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);
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
  const listGroupManager = ListGroupManager({
    onActiveGroupChange: setActiveListId,
  });

  // 直接使用listGroupManager.menuItem作为第一层菜单
  const menuItem: MenuProps["items"] = listGroupManager.menuItem;

  return (
    <>
      <Sider width={250} collapsedWidth={80} collapsed={collapsed}>
        <SideMenu
          menuItem={menuItem}
          onActiveGroupChange={setActiveListId}
          collapsed={collapsed}
        />
      </Sider>
      <Layout className={"theme-color border-0"}>
        <FilteredTodoList
          key={useTodoStore.getState().activeListId}
          groupName={activeListTitle}
          toggleCollapsed={toggleCollapsed}
          collapsed={collapsed}
        />
      </Layout>
      {/*如果屏幕小了就不显示*/}
      {!isMobile && (
        <Layout className={"theme-color border-0"}>
          {selectedTodo && <EditTodo key={selectedTodo.id} />}
        </Layout>
      )}
      {isMobile && (
        <EditTodoDrawer
          open={isTodoDrawerOpen}
          onClose={() => setIsTodoDrawerOpen(false)}
        />
      )}
      {/* 清单管理模态框 */}
      {listGroupManager.groupModal}
      {/* 标签管理模态框 */}
      {listGroupManager.tagModal}
    </>
  );
};

export default Index;
