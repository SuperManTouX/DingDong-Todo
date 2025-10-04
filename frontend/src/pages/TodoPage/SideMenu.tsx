import { Menu } from "antd";
import type { MenuProps } from "antd";
import type { SideMenuProps } from "@/types";
import { useState } from "react";
import { useTodoStore } from "@/store";

/**
 * 侧边菜单组件
 * 使用antd的Menu组件实现
 */
export default function SideMenu({ menuItem }: SideMenuProps) {
  const { setActiveListId, loadTasksByType } = useTodoStore();

  // 默认选中菜单项
  const [selectedKeys, setSelectedKeys] = useState<string[]>(["a"]);
  // 默认打开菜单栏
  const [openKeys, setOpenKeys] = useState<string[]>(["grp2"]);
  // 菜单项点击处理函数
  const handleClick: MenuProps["onClick"] = async ({ key, keyPath }) => {
    setSelectedKeys([key]);
    /* 如果点的是"父级" */
    if (keyPath.length > 1) {
      setOpenKeys((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    }

    // 加载任务数据（loadTasksByType现在会同时处理普通任务和置顶任务）
    await loadTasksByType(key);

    // 然后设置激活的列表ID
    setActiveListId(key);
  };

  return (
    <>
      <Menu
        className="h-100 theme-bgcColor-menuColor"
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
