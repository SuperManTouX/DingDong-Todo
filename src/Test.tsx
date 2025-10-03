import React, { useState } from "react";
import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ContainerOutlined,
  DesktopOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  PieChartOutlined,
  SettingOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Button, Col, Dropdown, Row } from "antd";
import type { MenuProps } from "antd";
import type { CSSProperties } from "react";
const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

// 生成带有图标的菜单项函数
const generateMenuItem = (
  key: string,
  icon: React.ReactNode,
  label: string | React.ReactNode,
  children?: MenuItem[]
): MenuItem => ({
  key,
  icon,
  label: (
    <Row justify="space-between" align="middle">
      <Col>{typeof label === "string" ? <span>{label}</span> : label}</Col>
      <Col>
        <EllipsisOutlined
          className="opacityHover0-1"
          style={{ cursor: "pointer" }}
        />
      </Col>
    </Row>
  ),
  children,
});

// 递归处理菜单配置，确保所有层级都有icon属性和正确的label结构
const processMenuItems = (items: MenuItem[]): MenuItem[] => {
  return items.map(item => {
    // 确保所有包含children的菜单项都有icon属性
    if (item.children && !item.icon) {
      item.icon = <FileTextOutlined />; // 为缺少图标的子菜单设置默认图标
    }
    
    // 如果有子菜单，递归处理子菜单
    if (item.children) {
      return {
        ...item,
        children: processMenuItems(item.children),
      };
    }
    
    return item;
  });
};

const Test: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  // 切换菜单收缩状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  /* const dropdownMenu = {
    items: [
      {
        key: "1",
        label: (
          <span
            onClick={(e) => {
              e.stopPropagation();
              showModal("edit", tg);
            }}
          >
            <EditOutlined />
            编辑清单
          </span>
        ),
      },
      {
        key: "2",
        label: (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteListGroup(tg.id, tg.title);
            }}
            style={{ color: "#ff4d4f" }}
          >
            删除清单
          </span>
        ),
      },
    ],
  };

  <Row className={"h-100"} justify={"space-between"} align={"middle"}>
    <span>123123123123123</span>
    <Col>
      <Button
        style={{
          width: "10px",
          minWidth: "5px",
          height: "10px",
          backgroundColor: "transparent",
          border: "1px solid #d9d9d9",
        }}
        size={"small"}
        shape="circle"
      ></Button>
      <Dropdown menu={dropdownMenu}>
        <EllipsisOutlined
          className="opacityHover0-1"
          style={{ cursor: "pointer" }}
        />
      </Dropdown>
    </Col>
  </Row>,*/

  // 菜单配置，所有子菜单项都包含icon属性
  const items: MenuItem[] = [
    generateMenuItem("1", <PieChartOutlined />, "数据分析"),
    generateMenuItem("2", <DesktopOutlined />, "仪表盘"),
    generateMenuItem("3", <ContainerOutlined />, "资源管理"),
    {
      key: "sub1",
      label: (
        <Row justify="space-between" align="middle">
          <Col>
            <span>导航菜单一</span>
          </Col>
          <Col>
            <EllipsisOutlined
              className="opacityHover0-1"
              style={{ cursor: "pointer" }}
            />
          </Col>
        </Row>
      ),
      icon: <MailOutlined />,
      children: [
        generateMenuItem("5", <AppstoreOutlined />, "123123123"),
        generateMenuItem("6", <BarChartOutlined />, "数据分析"),
        generateMenuItem("7", <CalendarOutlined />, "日历安排"),
        generateMenuItem("8", <MessageOutlined />, "消息通知"),
      ],
    },
    {
      key: "sub2",
      label: (
        <Row justify="space-between" align="middle">
          <Col>
            <span>导航菜单二</span>
          </Col>
          <Col>
            <EllipsisOutlined
              className="opacityHover0-1"
              style={{ cursor: "pointer" }}
            />
          </Col>
        </Row>
      ),
      icon: <AppstoreOutlined />,
      children: [
        generateMenuItem("9", <SettingOutlined />, "系统设置"),
        generateMenuItem("10", <UserOutlined />, "用户管理"),
        {
          key: "sub3",
          label: (
            <Row justify="space-between" align="middle">
              <Col>
                <span>子菜单</span>
              </Col>
              <Col>
                <EllipsisOutlined
                  className="opacityHover0-1"
                  style={{ cursor: "pointer" }}
                />
              </Col>
            </Row>
          ),
          icon: <FileTextOutlined />, // 为子菜单添加图标
          children: [
            generateMenuItem("11", <VideoCameraOutlined />, "媒体中心"),
            generateMenuItem("12", <EditOutlined />, "内容编辑"),
          ],
        },
      ],
    },
  ];

  const siderStyle: CSSProperties = {
    overflow: "auto",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
  };

  return (
    <Layout hasSider>
      <Sider
        style={siderStyle}
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={256}
        collapsedWidth={80}
      >
        <div
          className="demo-logo-vertical"
          style={{
            height: 32,
            margin: 16,
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: 6,
          }}
        />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          inlineCollapsed={collapsed}
          items={processMenuItems(items)}
        />
      </Sider>
      <Layout
        className="site-layout"
        style={{ marginLeft: collapsed ? 80 : 256 }}
      >
        <div
          className="site-layout-background"
          style={{ padding: 24, minHeight: 360 }}
        >
          <Button
            type="primary"
            onClick={toggleCollapsed}
            style={{ marginBottom: 16 }}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          >
            {collapsed ? "展开菜单" : "收起菜单"}
          </Button>
          <div
            style={{ padding: 20, backgroundColor: "#f0f2f5", borderRadius: 8 }}
          >
            <h1>Test组件 - Ant Design可收缩菜单示例</h1>
            <p>点击按钮测试菜单收缩功能，所有菜单项（包括子菜单）都包含图标</p>
          </div>
        </div>
      </Layout>
    </Layout>
  );
};

export default Test;
