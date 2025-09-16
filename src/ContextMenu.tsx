import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationOutlined,
} from "@ant-design/icons";
import type { ContextMenuProps, Priority } from "@/types";
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
  onAddSubTask,
}: ContextMenuProps) {
  // 编辑时间
  const onOk = (
    deadLine: DatePickerProps["value"] | RangePickerProps["value"],
  ) => {
    onTodoChange({
      type: "changed",
      todo: {
        ...todo,
        // @ts-ignore
        deadline: dayjs(deadLine).format(),
      },
    });
    message.info("时间更改成功");
  };
  // 更改任务优先级
  const setPriority = (p: Priority) => {
    onTodoChange({ type: "changed", todo: { ...todo, priority: p } });
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
          <Button
            onClick={() => setPriority(2)}
            size="small"
            variant="solid"
            color="yellow"
          >
            中
          </Button>
          <Button
            onClick={() => setPriority(1)}
            size="small"
            variant="solid"
            color="blue"
          >
            低
          </Button>
          <Button
            onClick={() => setPriority(0)}
            size="small"
            variant="solid"
            color="geekblue"
          >
            无
          </Button>
        </Space>
      ),
    },
    {
      key: "add_sub",
      icon: <EditOutlined />,
      label: "添加子任务",
      onClick: () => {
        if (onAddSubTask) {
          onAddSubTask(todo.id, todo.depth);
        } else {
          message.warning('添加子任务功能不可用');
        }
      },
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "删除",
      onClick: () => {
        onTodoChange({
          type: "deleted",
          deleteId: todo.id,
        });
        message.info("删除成功");
      },
    },
  ];

  return (
    <>
      <Dropdown
        key={todo.id}
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
