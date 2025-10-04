import React, { useMemo } from "react";
import { Col, Dropdown, Row, Select, Tag, theme, Layout } from "antd";
import { message } from "@/utils/antdStatic";
import { Priority } from "@/constants";
import { PlusOutlined } from "@ant-design/icons";
import { useTodoStore, dispatchTodo } from "@/store/todoStore";
import { useThemeStore } from "@/store/themeStore";
import TimeCountDownNode from "@/pages/TodoPage/TimeCountDownNode";
import RichNote from "@/components/RichNote";
import TodoCheckbox from "@/components/TodoCheckbox";
import TaskDateTimePicker from "@/components/TaskDateTimePicker";

// 解构Layout组件
const { Header, Content, Footer } = Layout;

export default function EditTodo() {
  // 获取状态
  const todoTags = useTodoStore((state) => state.todoTags);
  const todoListData = useTodoStore((state) => state.todoListData);
  const selectTodo = useTodoStore((state) => state.selectTodo());
  const { currentTheme } = useThemeStore();
  const { token } = theme.useToken();

  // 如果没有选中的任务，返回null
  if (!selectTodo) return null;

  // 确定优先级样式类
  let priClass = "";
  switch (selectTodo.priority) {
    case Priority.Low:
      priClass = "low-todo";
      break;
    case Priority.Medium:
      priClass = "medium-todo";
      break;
    case Priority.High:
      priClass = "high-todo";
      break;
    default:
      priClass = "";
  }

  // 处理标签点击添加
  const handleTagClick = (tagId: string) => {
    // 如果标签已经存在，则不重复添加
    if (selectTodo.tags?.includes(tagId)) {
      message.info("该标签已添加");
      return;
    }

    // 添加新标签
    const updatedTags = [...(selectTodo.tags || []), tagId];
    dispatchTodo({
      type: "changed",
      todo: {
        ...selectTodo,
        tags: updatedTags,
      },
    });

    // 查找标签名称并显示成功消息
    const tagItem = todoTags.find((t) => t.id === tagId);
    message.info(`已添加标签: ${tagItem?.name || "未知标签"}`);
  };

  // 生成Dropdown菜单的items
  const dropdownItems = todoTags.map((tag) => ({
    key: tag.id,
    label: (
      <span style={{ display: "flex", alignItems: "center" }}>
        <Tag color={tag.color || "magenta"} className="mr-2">
          {tag.name}
        </Tag>
      </span>
    ),
    onClick: () => handleTagClick(tag.id),
  }));

  // 标签样式
  const tagPlusStyle: React.CSSProperties = {
    height: 22,
    background: token.colorBgContainer,
    borderStyle: "dashed",
  };

  // 使用useMemo缓存options，避免每次渲染都创建新数组
  const listOptions = useMemo(() => {
    return todoListData.map((list) => ({
      value: list.id,
      label: list.title,
    }));
  }, [todoListData]);

  return (
    <Layout className="h-100">
      <Header
        className="theme-color"
        style={{
          borderBottom: `1px solid ${token.colorBorder}`,
          padding: "0 24px",
        }}
      >
        <Row className="h-100" justify="space-between" align="middle">
          <Row justify="start" align="middle">
            <TodoCheckbox
              completed={selectTodo.completed}
              priority={selectTodo.priority}
              title={selectTodo.title}
              onChange={(checked) => {
                dispatchTodo({
                  type: "changed",
                  todo: { ...selectTodo, completed: checked },
                });
                if (checked) message.info(`已完成${selectTodo.title}`);
              }}
            />
            <TaskDateTimePicker todo={selectTodo} />
            <TimeCountDownNode
              deadline={selectTodo.deadline}
              datetimeLocal={selectTodo.datetimeLocal}
            />
          </Row>
          <Select
            className="p-select"
            value={selectTodo.priority}
            style={{
              width: 60,
              border: "none",
              backgroundColor: "transparent",
              outline: "none",
              color: currentTheme.textColor,
            }}
            onChange={(priority) => {
              dispatchTodo({
                type: "changed",
                todo: {
                  ...selectTodo,
                  priority: priority,
                },
              });
            }}
            options={[
              { value: Priority.None, label: "无" },
              { value: Priority.Low, label: "低" },
              { value: Priority.Medium, label: "中" },
              { value: Priority.High, label: "高" },
            ]}
          />
        </Row>
      </Header>
      <Content
        className="theme-color"
        style={{
          padding: "16px 24px",
          color: currentTheme.textColor,
          minHeight: "calc(100% - 100px)",
        }}
      >
        <Row className="h-100" justify="start">
          <Col className="w-100">
            {/*待办标题*/}
            <input
              type="text"
              autoFocus
              className="w-100"
              value={selectTodo.title}
              onChange={(e) => {
                dispatchTodo({
                  type: "changed",
                  todo: {
                    ...selectTodo,
                    title: e.currentTarget.value,
                  },
                });
              }}
              style={{
                fontSize: 18,
                fontWeight: "bold",
                border: "none",
                backgroundColor: "transparent",
                outline: "none",
                width: "100%",
                padding: "0",
                marginBottom: "16px",
                color: currentTheme.textColor,
              }}
            />
            {/*富文本内容编辑框*/}
            <RichNote
              value={selectTodo.text || ""}
              onChange={(text) => {
                dispatchTodo({
                  type: "changed",
                  todo: {
                    ...selectTodo,
                    text: text,
                  },
                });
              }}
              placeholder="开始编写待办详情..."
            />
            {/*标签列表*/}
            {selectTodo.tags?.map((tagId) => {
              // 查找标签信息，如果找不到则提供默认值
              const tagItem = todoTags.find((t) => t.id === tagId);

              // 如果标签不存在，显示为"未知标签"并允许删除
              const tagName = tagItem?.name || `未知标签(${tagId})`;
              const tagColor = tagItem?.color || "gray";

              return (
                <Tag
                  color={tagColor}
                  key={tagId}
                  closable
                  style={{ marginRight: 8, marginBottom: 8 }}
                  onClose={() => {
                    // 过滤掉要删除的标签ID
                    const updatedTags = selectTodo.tags
                      ?.filter((id) => id !== tagId)
                      .filter(Boolean);

                    // 更新任务标签
                    dispatchTodo({
                      type: "changed",
                      todo: {
                        ...selectTodo,
                        tags: updatedTags,
                      },
                    });
                    message.info(`已移除标签: ${tagName}`);
                  }}
                >
                  {tagName}
                </Tag>
              );
            })}
            <Dropdown
              menu={{
                items: dropdownItems,
              }}
            >
              <Tag style={tagPlusStyle} className="border-dashed">
                <PlusOutlined /> New Tag
              </Tag>
            </Dropdown>
          </Col>
        </Row>
      </Content>
      <Footer
        className="theme-color"
        style={{
          color: currentTheme.textColor,
          borderTop: `1px solid ${token.colorBorder}`,
          padding: "0 24px",
        }}
      >
        <Row justify="start" align="middle">
          <span style={{ marginRight: "12px" }}>所属清单：</span>
          <Select
            value={selectTodo.listId}
            style={{
              width: 200,
              color: currentTheme.textColor,
            }}
            showSearch
            placeholder="选择清单"
            optionFilterProp="label"
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            onChange={(newListId) => {
              if (newListId !== selectTodo.listId) {
                dispatchTodo({
                  type: "changed",
                  todo: {
                    ...selectTodo,
                    listId: newListId,
                  },
                });

                // 查找新清单的名称
                const newList = todoListData.find(
                  (list) => list.id === newListId,
                );
                message.success(
                  `已成功移动至清单：${newList?.title || "未知清单"}`,
                );
              }
            }}
            options={listOptions}
          />
        </Row>
      </Footer>
    </Layout>
  );
}
