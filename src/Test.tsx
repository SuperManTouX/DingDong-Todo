// TreeDnd.tsx
import React, { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { CSS } from "@dnd-kit/utilities";

type TreeNode = {
  id: string;
  name: string;
  children?: TreeNode[];
};

/* ========= 初始两棵示例树 ========= */
const makeTree = (prefix: string): TreeNode[] => [
  {
    id: `${prefix}1`,
    name: `${prefix}-节点 1`,
    children: [
      { id: `${prefix}1-1`, name: `${prefix}-1-1` },
      { id: `${prefix}1-2`, name: `${prefix}-1-2` },
    ],
  },
  { id: `${prefix}2`, name: `${prefix}-节点 2` },
];

/* ========= 工具：扁平化树，方便查找 ========= */
const flatten = (nodes: TreeNode[]): Map<string, TreeNode> => {
  const map = new Map<string, TreeNode>();
  const dfs = (list: TreeNode[]) =>
    list.forEach((n) => {
      map.set(n.id, n);
      if (n.children) dfs(n.children);
    });
  dfs(nodes);
  return map;
};

/* ========= 单节点组件 ========= */
const Node: React.FC<{
  node: TreeNode;
}> = ({ node }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    paddingLeft: 12,
    lineHeight: "32px",
    border: "1px solid #ddd",
    margin: "2px 0",
    background: "#fff",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {node.name}
      {node.children && node.children.length > 0 && (
        <SortableContext
          items={node.children.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {node.children.map((c) => (
            <Node key={c.id} node={c} />
          ))}
        </SortableContext>
      )}
    </div>
  );
};

/* ========= 整棵树组件 ========= */
const Tree: React.FC<{
  tree: TreeNode[];
  setTree: (t: TreeNode[]) => void;
  prefix: string;
}> = ({ tree, setTree, prefix }) => {
  return (
    <div style={{ width: 300, border: "1px solid #aaa", padding: 8 }}>
      <h4>{prefix} 树</h4>
      <SortableContext
        items={tree.map((n) => n.id)}
        strategy={verticalListSortingStrategy}
      >
        {tree.map((n) => (
          <Node key={n.id} node={n} />
        ))}
      </SortableContext>
    </div>
  );
};

/* ========= 页面：两棵树 + 拖动逻辑 ========= */
export default function TreeDnd() {
  const [treeA, setTreeA] = useState<TreeNode[]>(makeTree("A"));
  const [treeB, setTreeB] = useState<TreeNode[]>(makeTree("B"));
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /* -------- 查找节点所在树及父链 -------- */
  const findNodeAndParent = (
    trees: [TreeNode[], React.Dispatch<React.SetStateAction<TreeNode[]>>][],
    id: string,
  ) => {
    for (const [t, setter] of trees) {
      const map = flatten(t);
      if (map.has(id)) {
        return { tree: t, setTree: setter, node: map.get(id)! };
      }
    }
    return null;
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const from = findNodeAndParent(
      [
        [treeA, setTreeA],
        [treeB, setTreeB],
      ],
      activeId,
    );
    const to = findNodeAndParent(
      [
        [treeA, setTreeA],
        [treeB, setTreeB],
      ],
      overId,
    );
    if (!from || !to) return;

    /* 同一棵树内排序 */
    if (from.setTree === to.setTree) {
      const sameRoot = from.tree;
      const oldIds = sameRoot.map((n) => n.id);
      if (!oldIds.includes(activeId) || !oldIds.includes(overId)) return;
      const oldIndex = oldIds.indexOf(activeId);
      const newIndex = oldIds.indexOf(overId);
      from.setTree(arrayMove(sameRoot, oldIndex, newIndex));
      return;
    }

    /* 跨树移动：简单插到目标树根部，你可以改成插到某节点前后 */
    const [removed] = from.tree.splice(
      from.tree.findIndex((n) => n.id === activeId),
      1,
    );
    to.tree.push(removed);
    from.setTree([...from.tree]);
    to.setTree([...to.tree]);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div style={{ display: "flex", gap: 40 }}>
        <Tree tree={treeA} setTree={setTreeA} prefix="A" />
        <Tree tree={treeB} setTree={setTreeB} prefix="B" />
      </div>

      {createPortal(
        <DragOverlay>
          {activeId ? (
            <div
              style={{
                padding: "8px 12px",
                background: "#fff",
                border: "1px solid #666",
                borderRadius: 4,
              }}
            >
              {activeId}
            </div>
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
