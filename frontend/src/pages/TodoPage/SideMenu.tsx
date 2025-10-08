import { Menu } from "antd";
import type { MenuProps } from "antd";
import type { SideMenuProps } from "@/types";
import { useEffect, useState } from "react";
import { useTodoStore } from "@/store";
import { useNavigate } from "react-router-dom";
import { getCompletedTasks } from "@/services/todoService";

/**
 * 侧边菜单组件
 * 使用antd的Menu组件实现
 */
export default function SideMenu({ menuItem }: SideMenuProps) {
  const { activeListId, setActiveListId, loadTasksByType, loadCompletedTasks } =
    useTodoStore();
  const navigate = useNavigate();

  // 默认选中菜单项
  const [selectedKeys, setSelectedKeys] = useState<string[]>(["a"]);
  // 默认打开菜单栏
  const [openKeys, setOpenKeys] = useState<string[]>(["grp2"]);

  // 监听activeListId变化，变化时加载对应类型的任务和已完成任务
  useEffect(() => {
    const loadAllTasks = async () => {
      if (activeListId) {
        try {
          // 加载任务数据
          await loadTasksByType(activeListId);

          await loadCompletedTasks(activeListId);
        } catch (error) {
          console.error("加载任务数据失败:", error);
        }
      }
    };

    loadAllTasks();
  }, [activeListId, loadTasksByType]);
  // 菜单项点击处理函数
  const handleClick: MenuProps["onClick"] = async ({ key, keyPath }) => {
    setSelectedKeys([key]);
    /* 如果点的是"父级" */
    if (keyPath.length > 1) {
      setOpenKeys((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    }

    // 当点击搜索菜单项时，导航到搜索页面
    if (key === "search") {
      navigate("/search");
      return;
    }

    // 然后设置激活的列表ID
    setActiveListId(key);
  };

  return (
    <>
      <Menu
        className="h-100 theme-specific-menu"
        onClick={handleClick}
        style={{
          width: "100%",
          height: "100%",
          overflowY: "auto",
        }}
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={(keys) => setOpenKeys(keys)}
        items={menuItem}
      />
    </>
  );
}
