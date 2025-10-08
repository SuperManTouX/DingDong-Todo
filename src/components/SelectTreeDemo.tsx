import React, { useState } from 'react';
import SelectTree, { TreeNodeData } from './SelectTree';

// Mock数据用于演示
const mockFlatData: TreeNodeData[] = [
  // 分组1的节点
  { id: '1-1', parentId: null, groupId: 'group1', name: '根节点1', code: 'G1-001' },
  { id: '1-2', parentId: '1-1', groupId: 'group1', name: '子节点1-1', code: 'G1-001-01' },
  { id: '1-3', parentId: '1-1', groupId: 'group1', name: '子节点1-2', code: 'G1-001-02' },
  { id: '1-4', parentId: '1-2', groupId: 'group1', name: '孙节点1-1-1', code: 'G1-001-01-01' },
  { id: '1-5', parentId: null, groupId: 'group1', name: '根节点2', code: 'G1-002' },
  
  // 分组2的节点
  { id: '2-1', parentId: null, groupId: 'group2', name: '根节点A', code: 'G2-001' },
  { id: '2-2', parentId: '2-1', groupId: 'group2', name: '子节点A-1', code: 'G2-001-01' },
  { id: '2-3', parentId: null, groupId: 'group2', name: '根节点B', code: 'G2-002' },
  
  // 分组3的节点（只读）
  { id: '3-1', parentId: null, groupId: 'group3', name: '只读节点1', code: 'G3-001' },
  { id: '3-2', parentId: '3-1', groupId: 'group3', name: '只读子节点1-1', code: 'G3-001-01' }
];

/**
 * SelectTree组件使用示例
 */
const SelectTreeDemo: React.FC = () => {
  // 初始化扁平数据
  const [flatData, setFlatData] = useState<TreeNodeData[]>(mockFlatData);
  
  // 初始化展开状态
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({
    // 默认展开部分节点
    'group1-1-1': true,
    'group2-2-1': true
  });

  // 处理节点拖拽结束
  const handleNodeDragEnd = (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    console.log('拖拽结束:', {
      draggedId,
      targetId,
      position
    });

    // 更新数据（实际应用中应调用后端API）
    const newFlatData = [...flatData];
    const draggedNode = newFlatData.find(node => node.id === draggedId);
    
    if (!draggedNode) return;

    // 更新节点的parentId或groupId
    if (position === 'inside' && targetId) {
      // 作为子节点
      const targetNode = newFlatData.find(node => node.id === targetId);
      if (targetNode) {
        draggedNode.parentId = targetId;
        draggedNode.groupId = targetNode.groupId;
      }
    } else {
      // 作为同级节点
      draggedNode.parentId = null;
      if (targetId) {
        const targetNode = newFlatData.find(node => node.id === targetId);
        if (targetNode) {
          draggedNode.groupId = targetNode.groupId;
        }
      }
    }

    setFlatData(newFlatData);
    
    // 这里可以调用后端API同步数据
    // syncToBackend(newFlatData);
  };

  // 处理节点展开收起
  const handleToggleExpanded = (groupId: string, nodeId: string) => {
    const key = `${groupId}-${nodeId}`;
    setExpandedKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    console.log('切换节点展开状态:', { groupId, nodeId, expanded: !expandedKeys[key] });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>SelectTree 组件使用示例</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3 style={{ marginBottom: '10px' }}>功能说明：</h3>
        <ul>
          <li>支持跨分组拖拽节点</li>
          <li>支持展开/收起树形结构（点击 +/- 图标）</li>
          <li>拖拽时显示可视化指示器：上方插入、下方插入、作为子节点</li>
          <li>group3 为只读分组，不允许拖入或拖出节点</li>
          <li>自动展开靠近的收起节点，便于拖拽操作</li>
          <li>防止循环引用（不能将节点拖入其后代节点）</li>
        </ul>
      </div>

      <SelectTree
        flatData={flatData}
        expandedKeys={expandedKeys}
        onNodeDragEnd={handleNodeDragEnd}
        onToggleExpanded={handleToggleExpanded}
        maxExpandedLevel={5}          // 最大展开层级
        initialExpandedLevel={1}      // 初始展开层级
        disabledGroups={['group3']}   // 禁用的分组（只读）
      />

      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
        <h3 style={{ marginBottom: '10px' }}>当前数据状态（用于调试）：</h3>
        <pre style={{ background: '#fafafa', padding: '10px', overflow: 'auto', maxHeight: '200px' }}>
          <code>
            {JSON.stringify({ flatData, expandedKeys }, null, 2)}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default SelectTreeDemo;