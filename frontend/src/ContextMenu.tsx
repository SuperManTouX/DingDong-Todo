import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationOutlined,
} from "@ant-design/icons";
import type { ContextMenuProps, Priority, SubTodo } from "@/types";
import {
  Button,
  DatePicker,
  type DatePickerProps,
  Dropdown,
  type MenuProps,
  message,
  Space,
} from "antd";
// @ts-ignore
import React from "react";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";

export default function ContextMenu({
  todo,
  children,
  onTodoChange,
}: ContextMenuProps) {
  // 编辑时间
  const onOk = (
    deadLine: DatePickerProps["value"] | RangePickerProps["value"],
  ) => {
    if ("id" in todo) {
      onTodoChange({
        type: "changed",
        todo: {
          ...todo,
          // @ts-ignore
          deadline: dayjs(deadLine).format(),
        },
      });
    } else {
      const subTodo = todo as SubTodo;
      onTodoChange({
        type: "change_sub",
        newSubTodo: {
          ...subTodo,
          // @ts-ignore
          subDeadline: dayjs(deadLine).format(),
        },
      });
    }
    message.info("时间更改成功");
  };
  // 更改任务优先级
  const setPriority = (p: Priority) => {
    if ("id" in todo) {
      onTodoChange({ type: "changed", todo: { ...todo, priority: p } });
    } else {
      const subTodo = todo as SubTodo;
      onTodoChange({
        newSubTodo: { ...subTodo, subPriority: p },
        type: "change_sub",
      });
    }
  };
  const items: MenuProps["items"] = [
    {
      key: "date",
      icon: <CalendarOutlined />,
      label: <span>日期</span>,
      disabled: true,
    },
    {
      key: "date_set",
      label: <DatePicker showTime onOk={onOk} />,
      disabled: true,
    },
    {
      key: "priority",
      icon: <ExclamationOutlined />,
      label: <span>优先级</span>,
      disabled: true,
    },
    {
      key: "priority_set",
      label: (
        <Space>
          <Button
            onClick={() => setPriority(3)}
            size="small"
            variant="solid"
            color="danger"
          >
            高
          </Button>
          <Button size="small" variant="solid" color="yellow">
            中
          </Button>
          <Button size="small" variant="solid" color="blue">
            低
          </Button>
          <Button size="small" variant="solid" color="geekblue">
            无
          </Button>
        </Space>
      ),
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "编辑",
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "删除",
      onClick: () => {
        if ("id" in todo) {
          onTodoChange({
            type: "deleted",
            deleteId: todo.id,
          });
        } else {
          const subTodo = todo as SubTodo;
          onTodoChange({
            subId: subTodo.subId,
            todoId: subTodo.todoId,
            type: "delete_sub",
          });
        }
        message.info("删除成功");
      },
    },
  ];

  return (
    <>
      <Dropdown
        key={"id" in todo ? todo.id : todo.subId}
        trigger={["contextMenu"]}
        menu={{
          items,
          className: "ctx-menu-left",
        }}
      >
        {children}
      </Dropdown>
    </>
  );
}
