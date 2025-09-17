import Sider from "antd/es/layout/Sider";
import React, { useState, useMemo } from "react";
import SideMenu from "../components/SideMenu";
import ListGroupManager from "../components/ListGroupManager";
import { Layout, type MenuProps } from "antd";
import todoListGroup from "../data/todoListGroup.json";
import type { TodoActionExtended, TodoListData } from "@/types";
import { useImmerReducer } from "use-immer";
import reducer from "../utils/reducer";
import EditTodo from "@/Layout/EditTodo";
import TODOList from "@/Layout/TODOList";

/**
 * 应用布局组件
 * 封装了Ant Design的Layout结构，包含侧边栏和主内容区域
 */

export default function AppLayout() {
  const [activeGroupId, setActiveGroupId] = useState<string>("a");

  // 使用整个todoListGroup数组初始化reducer
  const [todoListGroups, dispatch] = useImmerReducer<
    TodoListData[],
    TodoActionExtended
  >(reducer, todoListGroup);

  // 找出激活的组
  const activeGroup: TodoListData = useMemo(() => {
    return (
      todoListGroups.find((item) => item.id === activeGroupId) ||
      todoListGroups[0]
    );
  }, [todoListGroups, activeGroupId]);
  // 选中右侧编辑todo
  const [selectTodoId, setSelectTodoId] = useState<string>("");
  // 创建一个新的dispatch函数，自动添加groupId参数
  const dispatchWithGroupId = React.useCallback(
    (action: any) => {
      dispatch({
        ...action,
        groupId: activeGroupId,
      });
    },
    [dispatch, activeGroupId],
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
    dispatch,
    onActiveGroupChange: setActiveGroupId,
  });

  // 直接使用listGroupManager.menuItem作为第一层菜单
  const menuItem: MenuProps["items"] = listGroupManager.menuItem;

  return (
    <Layout className="w-100 h-100">
      <Sider width="5%" style={siderStyle1}>
        SiderNav
      </Sider>
      <Sider width="15%">
        <SideMenu menuItem={menuItem} onActiveGroupChange={setActiveGroupId} />
      </Sider>
      <Layout>
        <TODOList
          key={activeGroupId}
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
        ></TODOList>
      </Layout>
      <Layout>
        <EditTodo />
      </Layout>
      {/* 添加清单模态框 */}
      {listGroupManager.addModal}

      {/* 编辑清单模态框 */}
      {listGroupManager.editModal}
    </Layout>
  );
}
