import { Content, Footer, Header } from "antd/es/layout/layout";
import {
  Col,
  DatePicker,
  type DatePickerProps,
  Dropdown,
  Input,
  message,
  Row,
  Select,
  Tag,
  theme,
} from "antd";
import type { Todo, Tag as TagT, TodoAction } from "@/types";
import { Priority } from "@/constants";
import dayjs from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import { PlusOutlined } from "@ant-design/icons";

export default function EditTodo({
  todoTags,
  selectTodo,
  onTodoChange,
}: {
  todoTags: TagT[];
  selectTodo: Todo;
  onTodoChange: (action: TodoAction) => void;
}) {
  let priClass;
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
        groupId: selectTodo.groupId,
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
    <>
      <Header className="bg-white">
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
                  groupId: selectTodo.groupId,
                  newCompleted: e.currentTarget.checked,
                });
                if (e.currentTarget.checked)
                  message.info(`已完成${selectTodo.title}`);
              }}
            />
            <DatePicker
              className={"bg-transparent border-0"}
              value={dayjs(selectTodo.deadline)}
              showTime
              onChange={onChange}
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
      <Content className="minHeight-large pe-2 ps-2">
        <Row className={"h-100"} justify="start">
          <Col className="p-4 w-100">
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
                border: "none",
                backgroundColor: "transparent",
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
                  color={tagItem?.color || "magenta"}
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
                style: { maxHeight: "300px", overflowY: "auto" },
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
      <Footer className={"bg-primary"}>
        <Row justify={"start"} align={"middle"}>
          所属组，标签
        </Row>
      </Footer>
    </>
  );
}
