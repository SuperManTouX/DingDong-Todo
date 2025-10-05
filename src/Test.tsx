// App.tsx
import React, { useState } from "react";
import {
  SortableTree,
  SimpleTreeItemWrapper, // 官方给的“裸”外壳，只负责缩进 + 拖拽手柄
} from "dnd-kit-sortable-tree";

const init = [
  { id: "1", children: [{ id: "4" }, { id: "5" }] },
  { id: "2" },
  { id: "3" },
];

export default function App() {
  const [items, setItems] = useState(init);

  return (
    <div style={{ width: 320, margin: "2rem auto" }}>
      <h3>dnd-kit-sortable-tree 最小示例</h3>
      <SortableTree
        items={items}
        onItemsChanged={setItems} // 拖拽完成后自动回调，参数就是新树
        TreeItemComponent={React.forwardRef((props, ref) => (
          <SimpleTreeItemWrapper
            item={{
              children: undefined,
              id: "",
              collapsed: undefined,
              canHaveChildren: undefined,
              disableSorting: undefined,
            }}
            parent={null}
            depth={0}
            isLast={false}
            isOver={false}
            isOverParent={false}
            indentationWidth={0}
            {...props}
            ref={ref}
          >
            <div>{props.item.id}</div> {/* 这里随便渲染你的节点内容 */}
          </SimpleTreeItemWrapper>
        ))}
      />
    </div>
  );
}
