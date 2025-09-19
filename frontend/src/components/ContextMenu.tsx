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
  TreeSelect,
  Tag,
} from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import type { TreeSelectProps } from "antd/es/tree-select";
import type { Tag as TagT } from "@/types";
import dayjs from "dayjs";

export default function ContextMenu({
  todo,
  children,
  onTodoChange,
  onAddSubTask,
  tags = [],
}: ContextMenuProps & { tags?: TagT[] }) {
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

  // 将扁平的标签数组转换为TreeSelect所需的树形结构
  const buildTreeData = (tags: TagT[]): TreeSelectProps["treeData"] => {
    const tagMap = new Map<string, TreeSelectProps["treeData"][0]>();
    const treeData: TreeSelectProps["treeData"] = [];

    // 首先将所有标签转换为TreeSelect节点并存入Map
    tags.forEach((tag) => {
      tagMap.set(tag.id, {
        value: tag.id,
        title: (
          <span className="flex items-center">
            <Tag color={tag.color || "magenta"} className="mr-2">
              {tag.name}
            </Tag>
          </span>
        ),
        children: [],
      });
    });

    // 构建树形结构
    tags.forEach((tag) => {
      const node = tagMap.get(tag.id)!;

      if (tag.parentId === null) {
        // 根节点直接添加到treeData
        treeData.push(node);
      } else if (tagMap.has(tag.parentId)) {
        // 非根节点添加到父节点的children中
        const parentNode = tagMap.get(tag.parentId)!;
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push(node);
      }
    });

    return treeData;
  };

  // 处理标签选择变化（多选）
  // TreeSelect在multiple模式下，onChange参数类型可能是(string | number)[]
  const handleTagsChange = (
    keys: { label: React.ReactNode; value: string }[],
  ) => {
    const a: string[] = [];
    keys.map((item) => a.push(item.value));
    console.log(a);
    // 确保转换为字符串数组后更新任务标签
    onTodoChange({
      type: "changed",
      todo: {
        ...todo,
        tags: a.slice(),
      },
    });
    message.info("标签更新成功");
  };

  // 构建标签树形数据
  const treeData = buildTreeData(tags);
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
      key: "tags_select",
      disabled: true,
      label: (
        <div style={{ width: 300, padding: "8px 0" }}>
          <TreeSelect
            mode="multiple"
            treeData={treeData}
            value={(todo.tags || []).filter(
              (tagId) => typeof tagId === "string",
            )}
            onChange={handleTagsChange}
            treeCheckable={true}
            treeCheckStrictly={true} // 点击父标签不会自动选择子标签
            placeholder="选择标签"
            style={{ width: "100%" }}
            maxTagCount="responsive"
            allowClear={true}
          />
        </div>
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
