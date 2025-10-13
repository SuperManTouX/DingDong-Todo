import React, { useState } from "react";
import { Col, Dropdown, Menu, Drawer, Button } from "antd";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/store/authStore";
import { useTodoStore } from "@/store/todoStore";
import { useNavigate } from "react-router-dom";
import { message } from "@/utils/antdStatic";
import { MESSAGES } from "@/constants/messages";
import {
  CheckSquareOutlined,
  ClockCircleFilled,
  NotificationOutlined,
  PieChartOutlined,
  SearchOutlined,
  SettingOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import type { Todo } from "@/types";
import SearchModal from "@/components/SearchModal";

/**
 * 侧边栏导航组件
 * 用于显示应用的主要导航菜单和用户头像
 */
const SidebarNav: React.FC<{
  mobileVisible?: boolean;
  onMobileClose?: () => void;
}> = ({ mobileVisible, onMobileClose } = {}) => {
  const { user, logout } = useAuthStore();
  const { setUserId, setActiveListId, loadTasksByType } = useTodoStore();
  const [selectedKey, setSelectedKey] = React.useState("todos"); // 默认选中todos菜单项

  // 搜索Modal显示状态
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  // 通知面板显示状态
  const [notificationVisible, setNotificationVisible] = useState(false);
  
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
    {
      key: "notification",
      icon: <NotificationOutlined className={"sideNav-icon"} />,
      label: "邮件提醒",
      className: "menu-item-bottom",
    },
  ];

  const navigate = useNavigate();

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    // 处理菜单点击事件
    console.log("Menu item clicked:", key);
    setSelectedKey(key); // 更新选中的菜单项
    
    // 处理移动端点击菜单后关闭抽屉
    if (mobileVisible && onMobileClose) {
      onMobileClose();
    }
    
    // 当点击搜索菜单项时，显示搜索Modal
    if (key === "search") {
      setSearchModalVisible(true);
      return;
    }
    if (key === "notification") {
      // 切换通知面板的显示状态
      setNotificationVisible(!notificationVisible);
      return;
    }

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

  // 通知面板内容
  const NotificationPanel = () => {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        padding: '20px',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>邮件提醒设置</h2>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p>这里可以配置邮件提醒相关的设置</p>
            <p>1. 设置任务提醒时间</p>
            <p>2. 查看历史提醒记录</p>
            <p>3. 管理提醒偏好</p>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#e6f7ff', borderRadius: '8px' }}>
            <p>邮件提醒可以帮助您及时了解任务进度</p>
          </div>
        </div>
      </div>
    );
  };

  // 移动端侧边栏内容
  const renderMobileSidebar = () => (
    <Drawer
      title={user ? user.username : "任务管理"}
      placement="left"
      onClose={onMobileClose}
      open={mobileVisible}
      width="80%"
      maxWidth={300}
    >
      {user && (
        <div style={{ textAlign: "center", marginBottom: "24px", marginTop: "16px" }}>
          <img
            src={user.avatar}
            alt={user.username}
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              cursor: "pointer",
            }}
          />
          <p style={{ marginTop: "8px" }}>{user.username}</p>
        </div>
      )}
      
      <Menu
        mode="vertical"
        className={
          "sidebar-nav d-flex flex-column h-100 theme-bgcColor-primaryColor"
        }
        items={menuItems}
        onClick={handleMenuClick}
        selectedKeys={[selectedKey]}
      />
      
      {user && (
        <div style={{ marginTop: "auto", padding: "16px", textAlign: "center" }}>
          <Button 
            type="primary" 
            danger 
            onClick={handleLogout}
            style={{ width: "100%" }}
          >
            退出登录
          </Button>
        </div>
      )}
    </Drawer>
  );

  // 如果是移动端调用（通过props判断），返回抽屉形式
  if (mobileVisible !== undefined) {
    return (
      <>
        {renderMobileSidebar()}
        <SearchModal
          visible={searchModalVisible}
          onCancel={() => setSearchModalVisible(false)}
          onSelectTask={handleTaskSelect}
        />
        <Drawer
          title="邮件提醒"
          placement="right"
          onClose={() => setNotificationVisible(false)}
          open={notificationVisible}
          width={360}
          extra={null}
        >
          <NotificationPanel />
        </Drawer>
      </>
    );
  }

  // 桌面端侧边栏
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
        className={
          "sidebar-nav d-flex flex-column h-100 theme-bgcColor-primaryColor"
        }
        items={menuItems}
        onClick={handleMenuClick}
        selectedKeys={[selectedKey]}
      />

      <SearchModal
        visible={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        onSelectTask={handleTaskSelect}
      />
      
      {/* 通知面板Drawer */}
      <Drawer
        title="邮件提醒"
        placement="right"
        onClose={() => setNotificationVisible(false)}
        open={notificationVisible}
        width={360}
        extra={null}
      >
        <NotificationPanel />
      </Drawer>
    </Col>
  );
};

export default SidebarNav;
