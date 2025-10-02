import { Col, Drawer, Layout, theme } from "antd";
import { message } from "@/utils/antdStatic";
import { Priority } from "@/constants";
import { PlusOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import { useTodoStore, dispatchTodo } from "@/store/todoStore";
import { useThemeStore } from "@/store/themeStore";
import TimeCountDownNode from "@/pages/TodoPage/TimeCountDownNode";
import RichNote from "@/components/RichNote";
import TodoCheckbox from "@/components/TodoCheckbox";
import TaskDateTimePicker from "@/components/TaskDateTimePicker";
import { Dropdown, Input, Row, Select, Tag } from "antd";

// 解构Layout组件
const { Header, Content, Footer } = Layout;

interface EditTodoDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function EditTodoDrawer({ open, onClose }: EditTodoDrawerProps) {
  const todoTags = useTodoStore((state) => state.todoTags);
  const todoListData = useTodoStore((state) => state.todoListData);
  const selectTodo = useTodoStore((state) => state.selectTodo());
  const { currentTheme } = useThemeStore(); // 获取当前主题
  const { token } = theme.useToken(); // 移到组件顶部，在条件返回之前调用

  // 使用useMemo缓存options，避免每次渲染都创建新数组
  const listOptions = useMemo(() => {
    return todoListData.map((list) => ({
      value: list.id,
      label: list.title,
    }));
  }, [todoListData]);

  if (!selectTodo) return null;

  let priClass;
  switch (selectTodo?.priority) {
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

  // 更改日期
  const handleDateTimeChange = (date: string) => {
    dispatchTodo({
      type: "changed",
      todo: {
        ...selectTodo,
        deadline: date,
      },
    });
    message.info("时间更改成功");
  };

  // 处理标签点击添加
  const handleTagClick = (tagId: string) => {
    // 如果标签已经存在，则不重复添加
    if (selectTodo.tags?.includes(tagId)) {
      message.info("该标签已添加");
      return;
    }
    // 添加新标签
    const updatedTags = [...(selectTodo.tags || []), tagId];
    console.log(selectTodo);
    dispatchTodo({
      type: "changed",
      todo: {
        ...selectTodo,
        tags: updatedTags,
        listId: selectTodo.listId,
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

  const tagPlusStyle: React.CSSProperties = {
    height: 22,
    background: token.colorBgContainer,
    borderStyle: "dashed",
  };

  return (
    <Drawer
      title={
        <Row className="h-100 " justify="space-between" align="middle">
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
            <TaskDateTimePicker
              todo={selectTodo}
              onDateChange={handleDateTimeChange}
            />
            <TimeCountDownNode
              deadline={selectTodo.deadline}
              datetimeLocal={selectTodo.datetimeLocal}
            />
          </Row>
          <Select
            className={"p-select"}
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
      }
      open={open}
      onClose={onClose}
      width={600}
      placement="right"
      className="theme-color"
    >
      <Layout className="h-100">
        <Content
          className={"theme-color pt-0"}
          style={{
            padding: "16px 24px",
            color: currentTheme.textColor,
            minHeight: "calc(100% - 100px)",
          }}
        >
          <Row className={"h-100"} justify="start">
            <Col className="w-100">
              {/*待办标题*/}
              <input
                type="text"
                autoFocus
                className="w-100"
                value={selectTodo.title}
                onChange={(e) => {
                  if (selectTodo) {
                    dispatchTodo({
                      type: "changed",
                      todo: {
                        ...selectTodo,
                        title: e.currentTarget.value,
                      },
                    });
                  }
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
                  if (selectTodo) {
                    dispatchTodo({
                      type: "changed",
                      todo: {
                        ...selectTodo,
                        text: text,
                      },
                    });
                  }
                }}
                placeholder="开始编写待办详情..."
              />
              {/*标签列表*/}
              {selectTodo.tags?.map((tagId) => {
                // 查找标签信息，如果找不到则提供默认值
                const tagItem = todoTags.find((t) => t.id === tagId);

                // 如果标签不存在，显示为"未知标签"并允许删除
                const tagName = tagItem?.name || `未知标签(${tagId})`;

                return (
                  <Tag
                    key={tagId}
                    color={tagItem?.color || token.colorPrimary}
                    closeIcon
                    onClose={() => {
                      // 从tags数组中移除当前点击的标签
                      const updatedTags =
                        selectTodo.tags?.filter((id) => id !== tagId) || [];
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
                  style: {
                    maxHeight: "300px",
                    overflowY: "auto",
                    backgroundColor: currentTheme.bgColor,
                    color: currentTheme.textColor,
                    border: `1px solid ${token.colorBorder}`,
                  },
                }}
                trigger={["hover"]}
                placement="bottomLeft"
              >
                <Tag style={tagPlusStyle}>
                  <PlusOutlined /> New Tag
                </Tag>
              </Dropdown>
            </Col>
          </Row>
        </Content>
        <Footer
          className={"theme-color"}
          style={{
            color: currentTheme.textColor,
            borderTop: `1px solid ${token.colorBorder}`,
            padding: "0 24px",
          }}
        >
          <Row justify={"start"} align={"middle"}>
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
    </Drawer>
  );
}
