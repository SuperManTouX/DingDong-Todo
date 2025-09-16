import Sider from "antd/es/layout/Sider";
import React from "react";
import SideMenu from "./SideMenu";

import TODOList from "../TODOList";
import { Layout } from "antd";
import todoListGroup from "../data/todoListGroup.json";

/**
 * 应用布局组件
 * 封装了Ant Design的Layout结构，包含侧边栏和主内容区域
 */
export default function AppLayout() {
  const siderStyle1: React.CSSProperties = {
    textAlign: "center",
    lineHeight: "120px",
    color: "#fff",
    backgroundColor: "#3af152",
  };

  const siderStyle2: React.CSSProperties = {
    textAlign: "center",
    lineHeight: "120px",
    color: "#fff",
    backgroundColor: "#1677ff",
  };

  return (
    <Layout>
      <Sider width="10%" style={siderStyle1}>
        Sider
      </Sider>
      <Sider width="25%" style={siderStyle2}>
        <SideMenu />
      </Sider>
      <Layout>
        <TODOList initialTodoList={todoListGroup[1]}></TODOList>
        {/*{React.cloneElement(children as React.ReactElement, {*/}
        {/*  initialTodoList*/}
        {/*})}*/}
      </Layout>
    </Layout>
  );
}
