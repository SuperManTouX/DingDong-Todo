import React from "react";
import { Col, Dropdown, Menu } from "antd";
import type { MenuProps } from "antd";
import type { DropdownProps } from "antd";
import { useAuthStore } from "@/store/authStore";
import { useTodoStore } from "@/store/todoStore";

import { useNavigate } from "react-router-dom";
import { message } from "@/utils/antdStatic";
import { MESSAGES } from "@/constants/messages";
import { CheckSquareOutlined, ClockCircleFilled } from "@ant-design/icons";
import { useToken } from "antd/es/theme/internal";

/**
 * 侧边栏导航组件
 * 用于显示应用的主要导航菜单和用户头像
 */
const SidebarNav: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { setUserId } = useTodoStore();
  const [selectedKey, setSelectedKey] = React.useState("todos"); // 默认选中todos菜单项
  const menuItems: MenuProps["items"] = [
    {
      key: "todos",
      icon: <CheckSquareOutlined className={"text-secondary"} />,
      label: "清单",
    },
    {
      key: "zhuanZhu",
      icon: <ClockCircleFilled className={"text-secondary"} />,
      label: "专注",
    },
    {
      key: "stats",
      icon: <span>📊</span>,
      label: "数据",
    },
    {
      key: "settings",
      icon: <span>⚙️</span>,
      label: "设置",
    },
  ];

  const navigate = useNavigate();

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    // 处理菜单点击事件
    console.log("Menu item clicked:", key);
    setSelectedKey(key); // 更新选中的菜单项
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
        className={"flex-1 h-100 theme-bgcColor-primaryColor"}
        items={menuItems}
        onClick={handleMenuClick}
        selectedKeys={[selectedKey]}
      />
    </Col>
  );
};

export default SidebarNav;
