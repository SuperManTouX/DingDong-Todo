import Sider from "antd/es/layout/Sider";
import React from "react";
import SideMenu from "./SideMenu";
import ListGroupManager from "../components/ListGroupManager";
import { Layout, type MenuProps, ConfigProvider } from "antd";
import { useTodoStore, useActiveGroup, useSelectTodo } from "@/store/todoStore";
import EditTodo from "@/Layout/EditTodo";
import TODOList from "@/Layout/TODOList";
import ThemeSwitcher from "../components/ThemeSwitcher"; // 导入主题切换组件
import { useThemeStore } from "@/store/themeStore"; // 导入主题状态管理
import { generateAntdThemeConfig } from "@/theme/themeConfig"; // 导入主题配置生成函数

/**
 * 应用布局组件
 * 封装了Ant Design的Layout结构，包含侧边栏和主内容区域
 */
export default function AppLayout() {
  const { setActiveGroupId } = useTodoStore();
  const activeGroup = useActiveGroup();
  const selectTodo = useSelectTodo();
  const { currentTheme } = useThemeStore(); // 获取当前主题

  // 使用提取的函数生成Ant Design的Design Token配置
  const themeConfig = generateAntdThemeConfig(currentTheme);

  const siderStyle1: React.CSSProperties = {
    textAlign: "center",
    lineHeight: "120px",
    color: "#fff",
    backgroundColor: "#3af152",
  };

  // 使用ListGroupManager组件管理清单组
  const listGroupManager = ListGroupManager({
    onActiveGroupChange: setActiveGroupId,
  });

  // 主题切换器容器样式
  const themeSwitcherContainerStyle: React.CSSProperties = {
    position: "absolute",
    top: "16px",
    right: "16px",
    zIndex: 1000,
  };

  // 直接使用listGroupManager.menuItem作为第一层菜单
  const menuItem: MenuProps["items"] = listGroupManager.menuItem;
  return (
    <ConfigProvider theme={themeConfig}>
      <Layout className="w-100 h-100">
        {/* 主题切换器 - 不修改原有结构，只添加新的组件 */}
        <div style={themeSwitcherContainerStyle}>
          <ThemeSwitcher />
        </div>

        <Sider width="5%" style={siderStyle1}>
          SiderNav
        </Sider>
        <Sider width="18%">
          <SideMenu
            menuItem={menuItem}
            onActiveGroupChange={setActiveGroupId}
          />
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
          ></TODOList>
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
      </Layout>
    </ConfigProvider>
  );
}
