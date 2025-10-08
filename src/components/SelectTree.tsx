import React, { useState, useRef, useMemo } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { message } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';

// 树节点接口
export interface TreeNodeData {
  id: string;
  parentId: string | null;
  groupId: string;
  name: string;
  code?: string;
  [key: string]: any;
}

// 组件属性接口
export interface SelectTreeProps {
  flatData: TreeNodeData[];
  expandedKeys: Record<string, boolean>; // 格式: "groupId-id": boolean
  onNodeDragEnd: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  onToggleExpanded: (groupId: string, nodeId: string) => void;
  maxExpandedLevel?: number;
  initialExpandedLevel?: number;
  disabledGroups?: string[];
}

// 嵌套树节点结构
interface NestedTreeNode {
  data: TreeNodeData;
  children: NestedTreeNode[];
  depth: number;
}

// 拖拽指示器位置
type IndicatorPosition = {
  top: number;
  left: number;
  type: 'before' | 'after' | 'inside';
  visible: boolean;
};

// 拖拽状态
type DragState = {
  activeId: string | null;
  activeNode: TreeNodeData | null;
  draggedData: NestedTreeNode | null;
};

/**
 * 自定义树形结构拖拽组件，支持跨分组拖拽、展开收起功能
 */
const SelectTree: React.FC<SelectTreeProps> = ({
  flatData,
  expandedKeys,
  onNodeDragEnd,
  onToggleExpanded,
  maxExpandedLevel = 5,
  initialExpandedLevel = 1,
  disabledGroups = []
}) => {
  const [indicator, setIndicator] = useState<IndicatorPosition>({
    top: 0,
    left: 0,
    type: 'before',
    visible: false
  });
  const [ghostNode, setGhostNode] = useState<{
    top: number;
    left: number;
    height: number;
    width: number;
    visible: boolean;
  }>({
    top: 0,
    left: 0,
    height: 0,
    width: 0,
    visible: false
  });
  const [dragState, setDragState] = useState<DragState>({
    activeId: null,
    activeNode: null,
    draggedData: null
  });
  
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (args) => {
        const node = nodeRefs.current[args.id];
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }
    })
  );

  // 根据flatData生成嵌套的树形结构
  const nestedTreeData = useMemo(() => {
    const groupMap = new Map<string, Record<string, NestedTreeNode>>();
    const rootNodesByGroup = new Map<string, NestedTreeNode[]>();

    // 按分组初始化
    flatData.forEach(item => {
      if (!groupMap.has(item.groupId)) {
        groupMap.set(item.groupId, {});
        rootNodesByGroup.set(item.groupId, []);
      }
    });

    // 第一遍：创建所有节点
    flatData.forEach(item => {
      const groupNodes = groupMap.get(item.groupId)!;
      groupNodes[item.id] = {
        data: item,
        children: [],
        depth: 0 // 稍后计算
      };
    });

    // 第二遍：构建父子关系并计算深度
    flatData.forEach(item => {
      const groupNodes = groupMap.get(item.groupId)!;
      const currentNode = groupNodes[item.id];

      if (item.parentId === null) {
        // 根节点
        rootNodesByGroup.get(item.groupId)!.push(currentNode);
      } else {
        // 子节点
        const parentNode = groupNodes[item.parentId];
        if (parentNode) {
          parentNode.children.push(currentNode);
          // 计算深度
          let depth = 1;
          let tempNode = parentNode;
          while (tempNode) {
            depth++;
            const grandparentId = tempNode.data.parentId;
            if (!grandparentId) break;
            tempNode = groupNodes[grandparentId] || null;
          }
          currentNode.depth = depth;
        } else {
          // 父节点不存在，作为根节点处理
          rootNodesByGroup.get(item.groupId)!.push(currentNode);
        }
      }
    });

    return rootNodesByGroup;
  }, [flatData]);

  // 检查是否可展开
  const canExpand = (node: NestedTreeNode): boolean => {
    return node.children.length > 0 && node.depth < maxExpandedLevel;
  };

  // 检查节点是否展开
  const isExpanded = (node: NestedTreeNode): boolean => {
    const key = `${node.data.groupId}-${node.data.id}`;
    return expandedKeys[key] ?? (node.depth < initialExpandedLevel);
  };

  // 处理节点展开收起
  const handleToggleExpand = (node: NestedTreeNode) => {
    if (!canExpand(node)) return;
    onToggleExpanded(node.data.groupId, node.data.id);
  };

  // 获取拖拽节点信息
  const getNodeById = (id: string): { node: NestedTreeNode; groupId: string } | null => {
    for (const [groupId, rootNodes] of nestedTreeData.entries()) {
      const found = findNodeInTree(rootNodes, id);
      if (found) {
        return { node: found, groupId };
      }
    }
    return null;
  };

  // 在树中查找节点
  const findNodeInTree = (nodes: NestedTreeNode[], id: string): NestedTreeNode | null => {
    for (const node of nodes) {
      if (node.data.id === id) return node;
      const found = findNodeInTree(node.children, id);
      if (found) return found;
    }
    return null;
  };

  // 检查拖拽是否合法
  const isDragValid = (draggedNode: TreeNodeData, targetNode: TreeNodeData | null, position: string): boolean => {
    // 检查是否拖入禁用分组
    if (targetNode && disabledGroups.includes(targetNode.groupId)) {
      return false;
    }

    // 检查循环引用
    if (position === 'inside' && targetNode) {
      const targetInfo = getNodeById(targetNode.id);
      if (targetInfo) {
        const hasDescendant = checkDescendant(targetInfo.node, draggedNode.id);
        if (hasDescendant) {
          return false;
        }
      }
    }

    return true;
  };

  // 检查节点是否是目标节点的后代
  const checkDescendant = (node: NestedTreeNode, targetId: string): boolean => {
    if (node.data.id === targetId) return true;
    for (const child of node.children) {
      if (checkDescendant(child, targetId)) return true;
    }
    return false;
  };

  // 自动展开节点
  const autoExpandNode = (nodeId: string) => {
    const nodeInfo = getNodeById(nodeId);
    if (nodeInfo && !isExpanded(nodeInfo.node) && canExpand(nodeInfo.node)) {
      onToggleExpanded(nodeInfo.node.data.groupId, nodeInfo.node.data.id);
    }
  };

  // 处理拖拽开始
  const handleDragStart = (event: any) => {
    const { active } = event;
    const draggedNodeInfo = getNodeById(active.id);
    
    if (!draggedNodeInfo) return;

    // 检查是否从禁用分组拖拽
    if (disabledGroups.includes(draggedNodeInfo.node.data.groupId)) {
      event.cancel();
      return;
    }

    // 获取拖拽节点的DOM信息
    const nodeElement = nodeRefs.current[active.id];
    if (nodeElement) {
      const rect = nodeElement.getBoundingClientRect();
      setGhostNode({
        top: rect.top,
        left: rect.left,
        height: rect.height,
        width: rect.width,
        visible: true
      });
    }

    setDragState({
      activeId: active.id,
      activeNode: draggedNodeInfo.node.data,
      draggedData: draggedNodeInfo.node
    });
  };

  // 处理拖拽移动
  const handleDragMove = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    // 自动展开节点
    if (active.id !== over.id) {
      autoExpandNode(over.id);
    }

    // 计算拖拽指示器位置
    const overElement = nodeRefs.current[over.id];
    const activeElement = nodeRefs.current[active.id];
    
    if (!overElement || !activeElement) return;

    const overRect = overElement.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();
    const pointerY = event.clientOffset?.y || 0;
    const pointerX = event.clientOffset?.x || 0;

    // 计算拖拽位置类型
    let type: 'before' | 'after' | 'inside';
    const verticalMiddle = overRect.top + overRect.height / 2;
    const indentWidth = 20;
    
    if (pointerX > overRect.left + indentWidth * 2) {
      // 可以作为子节点
      type = 'inside';
    } else if (pointerY < verticalMiddle) {
      type = 'before';
    } else {
      type = 'after';
    }

    // 设置指示器位置
    let left = overRect.left;
    let top = overRect.top;

    if (type === 'before') {
      top = overRect.top - 2;
    } else if (type === 'after') {
      top = overRect.bottom - 2;
    } else {
      left = overRect.left + indentWidth;
      top = overRect.top + overRect.height / 2 - 10;
    }

    setIndicator({
      top,
      left,
      type,
      visible: true
    });

    // 更新幽灵节点位置
    setGhostNode(prev => ({
      ...prev,
      top: pointerY - activeRect.height / 2,
      left: pointerX - activeRect.width / 2
    }));
  };

  // 处理拖拽结束
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    // 重置拖拽状态
    setIndicator(prev => ({ ...prev, visible: false }));
    setGhostNode(prev => ({ ...prev, visible: false }));
    
    if (!over || !dragState.activeNode) {
      setDragState({ activeId: null, activeNode: null, draggedData: null });
      return;
    }

    // 计算最终位置
    const overElement = nodeRefs.current[over.id];
    const pointerY = event.clientOffset?.y || 0;
    const pointerX = event.clientOffset?.x || 0;

    if (!overElement) {
      setDragState({ activeId: null, activeNode: null, draggedData: null });
      return;
    }

    const overRect = overElement.getBoundingClientRect();
    const verticalMiddle = overRect.top + overRect.height / 2;
    const indentWidth = 20;

    let position: 'before' | 'after' | 'inside';
    if (pointerX > overRect.left + indentWidth * 2) {
      position = 'inside';
    } else if (pointerY < verticalMiddle) {
      position = 'before';
    } else {
      position = 'after';
    }

    // 检查拖拽是否合法
    const overNodeInfo = getNodeById(over.id);
    if (!overNodeInfo) {
      setDragState({ activeId: null, activeNode: null, draggedData: null });
      return;
    }

    const isValid = isDragValid(dragState.activeNode, overNodeInfo.node.data, position);
    if (!isValid) {
      message.error('无效的拖拽操作');
      setDragState({ activeId: null, activeNode: null, draggedData: null });
      return;
    }

    // 执行拖拽结束回调
    const targetId = position === 'inside' ? overNodeInfo.node.data.id : null;
    onNodeDragEnd(active.id, targetId, position);

    setDragState({ activeId: null, activeNode: null, draggedData: null });
  };

  // 渲染单个树节点
  const renderTreeNode = (node: NestedTreeNode, level = 0) => {
    const isActive = dragState.activeId === node.data.id;
    const hasChildren = node.children.length > 0;
    const expanded = isExpanded(node);
    
    return (
      <div
        key={`${node.data.groupId}-${node.data.id}`}
        ref={el => nodeRefs.current[node.data.id] = el}
        style={{
          paddingLeft: `${level * 20}px`,
          height: '40px',
          lineHeight: '40px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          cursor: disabledGroups.includes(node.data.groupId) ? 'not-allowed' : 'pointer',
          backgroundColor: isActive ? '#f5f5f5' : 'transparent',
          opacity: isActive ? 0.5 : 1
        }}
        className="select-tree-node"
      >
        {/* 拖拽方格 */}
        <div 
          style={{
            width: '20px',
            height: '20px',
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabledGroups.includes(node.data.groupId) ? 'not-allowed' : 'grab',
            opacity: disabledGroups.includes(node.data.groupId) ? 0.5 : 1
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{
            width: '14px',
            height: '14px',
            border: '1px solid #d9d9d9',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '1px'
          }}>
            {Array(4).fill(0).map((_, i) => (
              <div 
                key={i} 
                style={{
                  backgroundColor: '#d9d9d9',
                  width: '5px',
                  height: '5px'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* 展开收起图标 */}
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand(node);
            }}
            style={{ marginRight: '8px', cursor: 'pointer', userSelect: 'none' }}
          >
            {expanded ? <DownOutlined size={12} /> : <RightOutlined size={12} />}
          </span>
        )}
        {!hasChildren && <span style={{ marginRight: '8px' }} />}
        
        {/* 节点内容 */}
        <div style={{ flex: 1, userSelect: 'none' }}>
          {dragState.activeId && !isActive && (
            <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
              {node.data.code}
            </span>
          )}
          {node.data.name}
        </div>
        
        {/* 子节点 */}
        {expanded && (
          <div style={{ width: '100%' }}>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // 渲染每个分组的树
  const renderTreeGroups = () => {
    return Array.from(nestedTreeData.entries()).map(([groupId, rootNodes]) => (
      <div key={groupId} className="select-tree-group" style={{ marginBottom: '20px' }}>
        <div style={{ 
          padding: '10px', 
          backgroundColor: disabledGroups.includes(groupId) ? '#f5f5f5' : '#e6f7ff',
          borderRadius: '4px 4px 0 0',
          fontWeight: 'bold',
          color: disabledGroups.includes(groupId) ? '#999' : '#1890ff'
        }}>
          分组: {groupId} ({disabledGroups.includes(groupId) ? '只读' : '可编辑'})
        </div>
        <div style={{ 
          border: '1px solid #d9d9d9', 
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          minHeight: '60px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <SortableContext
            id={`sortable-${groupId}`}
            items={rootNodes.map(n => n.data.id)}
            strategy={verticalListSortingStrategy}
          >
            {rootNodes.length === 0 ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#999',
                fontSize: '14px'
              }}>
                暂无节点，可从其他分组拖拽
              </div>
            ) : (
              rootNodes.map(node => renderTreeNode(node))
            )}
          </SortableContext>
        </div>
      </div>
    ));
  };

  return (
    <div className="select-tree">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {renderTreeGroups()}
      </DndContext>
      
      {/* 拖拽指示器 */}
      {indicator.visible && (
        <div
          style={{
            position: 'fixed',
            left: `${indicator.left}px`,
            top: `${indicator.top}px`,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {indicator.type === 'inside' ? (
            <div style={{
              background: '#1890ff',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}>
              → 作为子节点
            </div>
          ) : (
            <div style={{
              width: '200px',
              height: '2px',
              background: '#1890ff',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: indicator.type === 'before' ? '-6px' : 'calc(100% - 6px)',
                width: '12px',
                height: '12px',
                background: '#1890ff',
                clipPath: indicator.type === 'before' ? 'polygon(0 0, 100% 50%, 0 100%)' : 'polygon(100% 0, 0 50%, 100% 100%)'
              }} />
            </div>
          )}
        </div>
      )}
      
      {/* 幽灵占位 */}
      {ghostNode.visible && dragState.draggedData && (
        <div
          style={{
            position: 'fixed',
            left: `${ghostNode.left}px`,
            top: `${ghostNode.top}px`,
            width: `${ghostNode.width}px`,
            height: `${ghostNode.height}px`,
            background: 'rgba(24, 144, 255, 0.1)',
            border: '1px dashed #1890ff',
            borderRadius: '4px',
            zIndex: 9998,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '20px',
            color: '#1890ff'
          }}
        >
          {dragState.draggedData.data.name}
        </div>
      )}
    </div>
  );
};

export default SelectTree;