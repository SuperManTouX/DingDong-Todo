import React, { useState, useEffect, useCallback } from "react";
import {
  Input,
  List,
  Empty,
  Spin,
  Typography,
  Tag,
  Button,
  Row,
  Col,
  Layout,
} from "antd";
import {
  SearchOutlined,
  RollbackOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchTasks } from "@/services/todoService";
import type { Todo } from "@/types";
import { message } from "@/utils/antdStatic";
import { useTodoStore } from "@/store";
import EditTodo from "@/pages/TodoPage/EditTodo";
import { useSelectTodo } from "@/store/todoStore";
import { useGlobalSettingsStore } from "@/store/globalSettingsStore";
import TodoTask from "@/pages/TodoPage/TodoTask";
import { websocketService } from "@/services/websocketService";

const { Title, Paragraph } = Typography;
const { Search } = Input;

/**
 * 搜索结果页面组件
 * 显示任务搜索结果并提供相关操作
 */
export default function SearchResultPage() {
  const navigate = useNavigate();
  const { setActiveListId, loadTasksByType, selectTodoId } = useTodoStore();
  const [searchParams] = useSearchParams();

  const initialKeyword = searchParams.get("keyword") || "";
  const [keyword, setKeyword] = useState(initialKeyword);
  const [searchResults, setSearchResults] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { isTodoDrawerOpen, setIsTodoDrawerOpen, isMobile } =
    useGlobalSettingsStore();
  // 使用state存储任务数据
  const [selectedTodo, setSelectedTodo] = useState<any>();
  // 异步获取任务的函数
  const fetchTodo = async () => {
    if (!selectTodoId) return null;
    try {
      const { getTodoById } = await import("@/services/todoService");
      const todoData = await getTodoById(selectTodoId);
      setSelectedTodo(todoData);
      return todoData;
    } catch (error) {
      console.error(`获取任务 ${selectTodoId} 失败:`, error);
      return null;
    }
  };

  // 当selectTodoId变化时获取任务数据
  useEffect(() => {
    fetchTodo();
  }, [selectTodoId, setSelectedTodo]);

  // 监听WebSocket任务更新事件，当当前编辑的任务发生变化时自动刷新
  useEffect(() => {
    const handleTaskUpdate = async () => {
      if (selectTodoId) {
        // 只有在当前有选中任务的情况下才刷新
        await fetchTodo();
      }
    };

    // 订阅任务更新、创建和删除事件
    websocketService.subscribe("task:updated", handleTaskUpdate);
    websocketService.subscribe("task:created", handleTaskUpdate);
    websocketService.subscribe("task:deleted", handleTaskUpdate);

    // 组件卸载时取消订阅
    return () => {
      websocketService.unsubscribe("task:updated", handleTaskUpdate);
      websocketService.unsubscribe("task:created", handleTaskUpdate);
      websocketService.unsubscribe("task:deleted", handleTaskUpdate);
    };
  }, [selectTodoId]); // 仅依赖selectTodoId，避免不必要的重订阅

  // 执行搜索
  const performSearch = useCallback(
    async (searchKeyword: string) => {
      if (!searchKeyword.trim()) {
        message.warning("请输入搜索关键词");
        return;
      }

      setLoading(true);
      try {
        // 更新URL查询参数，以便用户可以分享或刷新页面
        navigate(
          { search: `?keyword=${encodeURIComponent(searchKeyword)}` },
          { replace: true },
        );

        const results = await searchTasks(searchKeyword);
        setSearchResults(results);
        setHasSearched(true);
      } catch (error) {
        message.error("搜索失败，请重试");
        console.error("搜索任务失败:", error);
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  // 初始加载时执行搜索
  useEffect(() => {
    if (initialKeyword) {
      performSearch(initialKeyword);
    }
  }, [initialKeyword, performSearch]);

  // 处理搜索提交
  const handleSearch = (value: string) => {
    setKeyword(value);
    performSearch(value);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && keyword.trim()) {
      handleSearch(keyword);
    }
  };

  // 处理任务点击
  const handleTaskClick = async (task: Todo) => {
    // 如果任务有对应的列表，切换到该列表
    if (task.listId) {
      setActiveListId(task.listId);
      await loadTasksByType(task.listId);
      navigate("/"); // 返回到主页面
    }
  };

  // 处理返回按钮点击
  const handleBack = () => {
    navigate("/");
  };

  // 格式化任务文本显示
  const formatTaskText = (text: string | null | undefined) => {
    if (!text) return null;

    // 如果文本过长，显示部分内容
    if (text.length > 100) {
      return <Paragraph ellipsis={{ rows: 3 }}>{text}</Paragraph>;
    }
    return <Paragraph>{text}</Paragraph>;
  };

  return (
    <>
      <Layout style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        {/* 头部 */}
        <div style={{ marginBottom: 24 }}>
          <Row align="middle" gutter={[16, 16]}>
            <Col>
              <Button
                type="text"
                icon={<RollbackOutlined />}
                onClick={handleBack}
                style={{ marginBottom: 8 }}
              >
                返回
              </Button>
            </Col>
          </Row>

          <Title level={3} style={{ marginBottom: 16 }}>
            搜索任务
          </Title>

          <Search
            placeholder="输入关键词搜索任务..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleKeyPress}
            style={{ maxWidth: 600 }}
          />
        </div>

        {/* 搜索结果统计 */}
        {hasSearched && (
          <div style={{ marginBottom: 20 }}>
            <Paragraph>
              {searchResults.length > 0
                ? `找到 ${searchResults.length} 个包含 "${keyword}" 的任务`
                : `没有找到包含 "${keyword}" 的任务`}
            </Paragraph>
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }}>正在搜索...</Paragraph>
          </div>
        ) : hasSearched ? (
          searchResults.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={searchResults}
              renderItem={(task) => (
                <TodoTask
                  todo={task}
                  hasSubTasks={false}
                  isExpanded={false}
                  onToggleExpand={() => {}}
                />
              )}
            />
          ) : (
            <Empty
              description="没有找到相关任务"
              style={{ padding: 80 }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
        ) : (
          <div style={{ textAlign: "center", padding: 80 }}>
            <FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
            <Paragraph style={{ marginTop: 16, color: "#8c8c8c" }}>
              输入关键词开始搜索任务
            </Paragraph>
          </div>
        )}
      </Layout>
      <Layout>
        {selectedTodo && (
          <EditTodo
            asDrawer={isMobile}
            open={isMobile ? isTodoDrawerOpen : true}
            onClose={isMobile ? () => setIsTodoDrawerOpen(false) : undefined}
          />
        )}
      </Layout>
    </>
  );
}
