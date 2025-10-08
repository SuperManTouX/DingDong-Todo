// App.tsx
import React, { useState, useEffect } from "react";
import { Table, Button, Input, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface TreeItem {
  id: string;
  parentId?: string;
  level: number;
  childrenCount: number;
  path: string;
}

const init = [
  {
    id: "1",
    children: [
      { id: "4" },
      { id: "5" },
      ...Array.from({ length: 100 }, (_, i) => ({ id: `1-${6 + i}` })),
    ],
  },
  { id: "2", children: [] },
  {
    id: "3",
    children: Array.from({ length: 50 }, (_, i) => ({ id: `3-${i + 1}` })),
  },
];

// 将树形结构转换为扁平的表格数据
const flattenTree = (tree: any[], parentId?: string, level = 0, path = ""): TreeItem[] => {
  let result: TreeItem[] = [];
  
  tree.forEach((item) => {
    const currentPath = parentId ? `${path}/${item.id}` : item.id;
    const flattenedItem: TreeItem = {
      id: item.id,
      parentId,
      level,
      childrenCount: item.children ? item.children.length : 0,
      path: currentPath,
    };
    
    result.push(flattenedItem);
    
    if (item.children && item.children.length > 0) {
      result = result.concat(flattenTree(item.children, item.id, level + 1, currentPath));
    }
  });
  
  return result;
};

export default function App() {
  const [tableData, setTableData] = useState<TreeItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<TreeItem[]>([]);

  useEffect(() => {
    // 初始化时转换数据
    const flattened = flattenTree(init);
    setTableData(flattened);
    setFilteredData(flattened);
  }, []);

  useEffect(() => {
    // 根据搜索文本过滤数据
    if (searchText) {
      const filtered = tableData.filter(item => 
        item.id.includes(searchText) || 
        item.path.includes(searchText) ||
        (item.parentId && item.parentId.includes(searchText))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(tableData);
    }
  }, [searchText, tableData]);

  const columns: ColumnsType<TreeItem> = [
    {
      title: "节点ID",
      dataIndex: "id",
      key: "id",
      render: (id, record) => (
        <div style={{ paddingLeft: `${record.level * 20}px` }}>
          {Array(record.level).fill(0).map((_, i) => (
            <span key={i} style={{ marginRight: '10px' }}>│</span>
          ))}
          {record.level > 0 && <span style={{ marginRight: '5px' }}>├─</span>}
          <Text strong>{id}</Text>
        </div>
      ),
    },
    {
      title: "层级",
      dataIndex: "level",
      key: "level",
      width: 80,
      sorter: (a, b) => a.level - b.level,
    },
    {
      title: "父节点ID",
      dataIndex: "parentId",
      key: "parentId",
      width: 120,
      render: (parentId) => parentId || <Text type="secondary">无</Text>,
    },
    {
      title: "子节点数",
      dataIndex: "childrenCount",
      key: "childrenCount",
      width: 100,
      sorter: (a, b) => a.childrenCount - b.childrenCount,
    },
    {
      title: "路径",
      dataIndex: "path",
      key: "path",
      ellipsis: true,
      tooltip: (text: string) => text,
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button size="small">查看详情</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <Title level={3}>Ant Design 属性表格展示</Title>
      
      <div style={{ marginBottom: "16px" }}>
        <Input
          placeholder="搜索节点ID或路径"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Text style={{ marginLeft: 16 }}>共 {filteredData.length} 条数据</Text>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条数据`,
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
      
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
        <Title level={5}>统计信息</Title>
        <div style={{ display: "flex", gap: "20px" }}>
          <Text>总节点数: {tableData.length}</Text>
          <Text>根节点数: {tableData.filter(item => !item.parentId).length}</Text>
          <Text>最大层级: {Math.max(...tableData.map(item => item.level), 0)}</Text>
        </div>
      </div>
    </div>
  );
}
