import React, { useState, useCallback } from "react";
import { Modal, Input, Button, List, Empty, Spin, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { searchTasks as searchTasksApi } from "@/services/todoService";
import { Todo } from "@/types";
import { message } from "@/utils/antdStatic";
import { MESSAGES } from "@/constants/messages";
import TodoTask from "@/pages/TodoPage/TodoTask";

const { Title, Paragraph } = Typography;
const { Search } = Input;

interface SearchModalProps {
  visible: boolean;
  onCancel: () => void;
  onSelectTask?: (task: Todo) => void;
}

export default function SearchModal({
  visible,
  onCancel,
  onSelectTask,
}: SearchModalProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (value: string) => {
    if (!value.trim()) {
      message.warning("请输入搜索关键词");
      return;
    }

    setLoading(true);
    try {
      const results = await searchTasksApi(value);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      message.error("搜索失败，请重试");
      console.error("搜索任务失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      handleSearch(searchTerm);
    }
  };

  const handleTaskClick = (task: Todo) => {
    if (onSelectTask) {
      onSelectTask(task);
    }
    onCancel();
  };

  const handleCancel = () => {
    setSearchTerm("");
    setSearchResults([]);
    setHasSearched(false);
    onCancel();
  };

  return (
    <Modal
      title="搜索任务"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      mask={false}
    >
      <Search
        placeholder="输入关键词搜索任务..."
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onSearch={handleSearch}
        onPressEnter={handleKeyPress}
        style={{ marginBottom: 20 }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16 }}>正在搜索...</Paragraph>
        </div>
      ) : hasSearched ? (
        searchResults.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={searchResults}
            renderItem={(task) => (
              <div
                onClick={() => {
                  console.log("跳转/search:keyword");
                  // 跳转到搜索结果页面，并传递当前搜索关键词
                  navigate(`/search?keyword=${encodeURIComponent(searchTerm)}`);
                  // 关闭当前Modal
                  onCancel();
                }}
              >
                <TodoTask
                  todo={task}
                  hasSubTasks={false}
                  isExpanded={false}
                  onToggleExpand={() => {}}
                />
              </div>
            )}
          />
        ) : (
          <Empty description="没有找到相关任务" style={{ padding: 40 }} />
        )
      ) : null}
    </Modal>
  );
}
