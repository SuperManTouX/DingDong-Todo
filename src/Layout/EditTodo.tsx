import { Content, Footer, Header } from "antd/es/layout/layout";
import {
  Col,
  DatePicker,
  DatePickerProps,
  Input,
  message,
  Row,
  Select,
  Tag,
} from "antd";
import type { Todo, TodoAction } from "@/types";
import { Priority, PriorityName } from "@/constants";
import dayjs from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import type { SelectProps } from "antd/es/select";
import type { InputProps } from "antd/es/input";

export default function EditTodo({
  selectTodo,
  onTodoChange,
}: {
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
            <Input.TextArea
              autoFocus
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
          </Col>
        </Row>
      </Content>
      <Footer className={"bg-primary"}>
        <Row justify={"start"} align={"middle"}>
          <Tag color="magenta">magenta</Tag>
          所属组，标签
        </Row>
      </Footer>
    </>
  );
}
