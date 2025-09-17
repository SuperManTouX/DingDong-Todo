import { Menu } from "antd";
import type { MenuProps } from "antd";
import type { SideMenuProps } from "@/types";

/**
 * 侧边菜单组件
 * 使用antd的Menu组件实现
 */
export default function SideMenu({
  menuItem,
  onActiveGroupChange,
}: SideMenuProps) {
  // 菜单项点击处理函数
  const handleClick: MenuProps["onClick"] = (e) => {
    console.log("点击菜单项:", e.key);
    onActiveGroupChange(e.key);
  };

  return (
    <>
      <Menu
        className="my-custom-menu"
        defaultSelectedKeys={["a"]}
        defaultOpenKeys={["grp2"]}
        onClick={handleClick}
        style={{ width: "100%", height: "100%" }}
        mode="inline"
        items={menuItem}
      />
    </>
  );
}
