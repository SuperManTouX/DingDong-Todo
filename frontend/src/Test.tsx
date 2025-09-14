import React, { useState } from "react";
import { Dropdown, type MenuProps } from "antd";

const A_ITEMS: MenuProps["items"] = [{ key: "a", label: "A 菜单" }];
const B_ITEMS: MenuProps["items"] = [{ key: "b", label: "B 菜单" }];

export default function NestedDropdown() {
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);

  /* A 区域右键 */
  const onContextMenuA = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenA(true);
  };

  /* B 区域右键：先阻冒泡再阻默认 */
  const onContextMenuB = (e: React.MouseEvent) => {
    e.stopPropagation(); // 关键：不让事件继续向上
    e.preventDefault();
    setOpenB(true);
  };

  return (
    <Dropdown
      trigger={["contextMenu"]}
      open={openA}
      onOpenChange={setOpenA}
      menu={{ items: A_ITEMS }}
    >
      <div
        onContextMenu={onContextMenuA}
        style={{ padding: 40, background: "#f0f0f0" }}
      >
        区域 A
        <Dropdown
          trigger={["contextMenu"]}
          open={openB}
          onOpenChange={setOpenB}
          menu={{ items: B_ITEMS }}
        >
          <div
            onContextMenu={onContextMenuB} // ← 阻冒泡
            style={{
              marginTop: 20,
              padding: 20,
              background: "#fff",
              border: "1px solid #d9d9d9",
            }}
          >
            区域 B（右键只出 B 菜单）
          </div>
        </Dropdown>
      </div>
    </Dropdown>
  );
}
