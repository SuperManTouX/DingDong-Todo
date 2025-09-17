import Sider from "antd/es/layout/Sider";
import React, { useState, useMemo } from "react";
import SideMenu from "../components/SideMenu";

import TODOList from "../components/TODOList";
import { Layout, type MenuProps, Row } from "antd";
import todoListGroup from "../data/todoListGroup.json";
import {
  AppstoreOutlined,
  PieChartOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Content } from "antd/es/layout/layout";
import type { TodoListData } from "@/types";
import { useImmerReducer } from "use-immer";
import reducer from "../utils/reducer";

/**
 * 应用布局组件
 * 封装了Ant Design的Layout结构，包含侧边栏和主内容区域
 */

export default function AppLayout() {
  const [activeGroupId, setActiveGroupId] = useState<string>("a");

  // 使用整个todoListGroup数组初始化reducer
  const [todoListGroups, dispatch] = useImmerReducer(reducer, todoListGroup);

  // 找出激活的组
  const activeGroup: TodoListData = useMemo(() => {
    return (
      todoListGroups.find((item) => item.id === activeGroupId) ||
      todoListGroups[0]
    );
  }, [todoListGroups, activeGroupId]);

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
  const renderTodoListGroups = (): MenuProps["items"] => {
    return todoListGroup.map((tg) => {
      return {
        key: tg.id,
        icon: <AppstoreOutlined />,
        label: tg.title,
      };
    });
  };
  // 菜单项配置
  const menuItem: MenuProps["items"] = [
    {
      key: "1",
      icon: <PieChartOutlined />,
      label: "今天",
    },
    {
      key: "2",
      icon: <PieChartOutlined />,
      label: "最近七天",
    },
    { type: "divider" },
    {
      key: "grp2",
      label: (
        <Row justify={"space-between"} className="text-secondary fs-6">
          清单
          <PlusOutlined
            className={"opacityHover"}
            onClick={(e) => {
              e.stopPropagation();
              console.log("加号");
            }}
          />
        </Row>
      ),
      children: renderTodoListGroups(),
    },
    {
      key: "grp3",
      label: "标签",
      children: [
        {
          key: "3",
          icon: <SettingOutlined />,
          label: "设置",
        },
      ],
    },
    { type: "divider", style: { margin: "2rem 0" } },
    {
      key: "3-1",
      icon: <SettingOutlined />,
      label: "已完成",
    },
    {
      key: "3-2",
      icon: <SettingOutlined />,
      label: "回收站",
    },
  ];

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
          todoTasks={activeGroup}
        ></TODOList>
      </Layout>
      <Content>1234</Content>
    </Layout>
  );
}
