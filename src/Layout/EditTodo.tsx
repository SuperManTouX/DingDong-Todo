import {
  Col,
  DatePicker,
  type DatePickerProps,
  Dropdown,
  Input,
  Row,
  Select,
  Tag,
  theme,
  Layout,
} from "antd";
import { message } from "@/utils/antdStatic";
import type { TodoAction } from "@/types";
import { Priority } from "@/constants";
import dayjs from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import { PlusOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import { useSelectTodo, useTodoStore } from "@/store/todoStore";
import { useThemeStore } from "@/store/themeStore";
import TimeCountDownNode from "@/components/TimeCountDownNode"; // 导入主题状态管理

// 解构Layout组件
const { Header, Content, Footer } = Layout;

export default function EditTodo({
  onTodoChange,
}: {
  onTodoChange: (action: TodoAction) => void;
}) {
  const todoTags = useTodoStore((state) => state.todoTags);
  const todoListData = useTodoStore((state) => state.todoListData);
  const selectTodo = useSelectTodo();
  const { currentTheme } = useThemeStore(); // 获取当前主题

  if (!selectTodo) return;
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
  const onChange: DatePickerProps["onChange"] = (
    deadLine: DatePickerProps["value"] | RangePickerProps["value"],
  ) => {
    onTodoChange({
      type: "changed",
      todo: {
        ...selectTodo,
        // @ts-ignore
        deadline: dayjs(deadLine).format(),
      },
    });
    message.info("时间更改成功");
  };

  const { token } = theme.useToken();

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
    onTodoChange({
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
        style={{
          backgroundColor: currentTheme.bgColor,
          color: currentTheme.textColor,
          borderBottom: `1px solid ${token.colorBorder}`,
          padding: "0 24px",
        }}
      >
        <Row className={"h-100"} justify="space-between" align="middle">
          <Row justify="start" align="middle">
            <input
              type="checkbox"
              className={`me-1 mt-2 mb-2 ${priClass}`}
              checked={selectTodo.completed}
              onChange={(e) => {
                onTodoChange({
                  type: "toggle",
                  todoId: selectTodo.id,
                  listId: selectTodo.listId,
                  newCompleted: e.currentTarget.checked,
                });
                if (e.currentTarget.checked)
                  message.info(`已完成${selectTodo.title}`);
              }}
            />
            <DatePicker
              value={dayjs(selectTodo.deadline)}
              showTime
              onChange={onChange}
              style={{
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
              }}
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
              onTodoChange({
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
        style={{
          padding: "16px 24px",
          backgroundColor: currentTheme.bgColor,
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
                  onTodoChange({
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
            {/*长文本内容编辑框*/}
            <Input.TextArea
              value={selectTodo.text || ""}
              onChange={(e) => {
                if (selectTodo) {
                  onTodoChange({
                    type: "changed",
                    todo: {
                      ...selectTodo,
                      text: e.currentTarget.value,
                    },
                  });
                }
              }}
              style={{
                borderRadius: "6px",
                minHeight: "120px",
                resize: "vertical",
                border: `1px solid ${token.colorBorder}`,
                backgroundColor: currentTheme.bgColor,
                color: currentTheme.textColor,
                padding: "8px 12px",
              }}
              autoSize={{ minRows: 20 }}
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
                    onTodoChange({
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
        style={{
          backgroundColor: currentTheme.bgColor,
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
                onTodoChange({
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
                  `已成功移动至清单：${newList?.name || "未知清单"}`,
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
