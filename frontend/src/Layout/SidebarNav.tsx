import React, { useState } from "react";
import { Col, Dropdown, Menu } from "antd";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/store/authStore";
import { useTodoStore } from "@/store/todoStore";

import { useNavigate } from "react-router-dom";
import { message } from "@/utils/antdStatic";
import { MESSAGES } from "@/constants/messages";
import {
  CheckSquareOutlined,
  ClockCircleFilled,
  PieChartOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Todo } from "@/types";
import SearchModal from "@/components/SearchModal";

/**
 * 侧边栏导航组件
 * 用于显示应用的主要导航菜单和用户头像
 */
const SidebarNav: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { setUserId, setActiveListId, loadTasksByType } = useTodoStore();
  const [selectedKey, setSelectedKey] = React.useState("todos"); // 默认选中todos菜单项

  // 搜索Modal显示状态
  const [searchModalVisible, setSearchModalVisible] = useState(true);
  const menuItems: MenuProps["items"] = [
    {
      key: "todos",
      icon: <CheckSquareOutlined className={"sideNav-icon"} />,
      label: "清单",
    },
    {
      key: "zhuanZhu",
      icon: <ClockCircleFilled className={"sideNav-icon"} />,
      label: "专注",
    },
    {
      key: "status",
      icon: <PieChartOutlined className={"sideNav-icon"} />,
      label: "数据",
    },
    {
      key: "settings",
      icon: <SettingOutlined className={"sideNav-icon"} />,
      label: "设置",
    },
    {
      key: "search",
      icon: <SearchOutlined className={"sideNav-icon"} />,
      label: "全局搜索",
    },
  ];

  const navigate = useNavigate();

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    // 处理菜单点击事件
    console.log("Menu item clicked:", key);
    setSelectedKey(key); // 更新选中的菜单项
    // 当点击搜索菜单项时，显示搜索Modal
    // if (key === "search") {
    //   setSearchModalVisible(true);
    //   return;
    // }

    // 路由跳转逻辑
    navigate(`/${key}`);
  };

  // 处理用户注销
  const handleLogout = async () => {
    try {
      await logout();
      message.success(MESSAGES.SUCCESS.USER_LOGGED_OUT);
    } catch (error) {
      message.error(MESSAGES.WARNING.LOGOUT_FAILED);
    } finally {
      setUserId(null); // 清除todoStore中的用户ID
    }
  };

  // 下拉菜单配置
  const dropdownMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      label: "退出登录",
      danger: true, // 设置为红色危险项
    },
  ];

  // 处理任务选择
  const handleTaskSelect = (task: Todo) => {
    // 如果任务有对应的列表，切换到该列表
    if (task.listId) {
      setActiveListId(task.listId);
      loadTasksByType(task.listId);
    }
  };

  return (
    <Col
      className={"theme-bgcColor-primaryColor"}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        paddingTop: "1rem",
      }}
    >
      {/* 用户头像区域 - 悬停弹出下拉菜单 */}
      {user && (
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <Dropdown
            menu={{
              items: dropdownMenuItems,
              onClick: ({ key }) => {
                if (key === "logout") {
                  handleLogout();
                }
              },
            }}
            trigger={["hover"]}
            placement="bottom"
          >
            <img
              src={user.avatar}
              alt={user.username}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
            />
          </Dropdown>
        </div>
      )}

      {/* 菜单区域 */}
      <Menu
        mode="vertical"
        className={"sidebar-nav lex-1 h-100 theme-bgcColor-primaryColor"}
        items={menuItems}
        onClick={handleMenuClick}
        selectedKeys={[selectedKey]}
      />
      <SearchModal
        visible={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        onSelectTask={handleTaskSelect}
      />
    </Col>
  );
};

export default SidebarNav;
