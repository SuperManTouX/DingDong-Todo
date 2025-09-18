import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { ContextMenuProps } from "@/types";
import {
  DatePicker,
  type DatePickerProps,
  Dropdown,
  type MenuProps,
  message,
} from "antd";
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

  const items: MenuProps["items"] = [
    {
      key: "date",
      icon: <CalendarOutlined />,
      label: <span>日期</span>,
      disabled: true,
    },
    {
      key: "date_set",
      label: <DatePicker value={dayjs(todo.deadline)} showTime onOk={onOk} />,
      disabled: true,
    },
    {
      key: "add_sub",
      icon: <EditOutlined />,
      label: "添加子任务",
      onClick: () => {
        if (onAddSubTask) {
          onAddSubTask(todo.id, todo.depth);
        } else {
          message.warning("添加子任务功能不可用");
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
