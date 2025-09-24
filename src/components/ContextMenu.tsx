import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import type { ContextMenuProps } from "@/types";
import {
  DatePicker,
  type DatePickerProps,
  Dropdown,
  type MenuProps,
  Modal,
  TreeSelect,
  Tag,
} from "antd";
import { message } from "@/utils/antdStatic";
import type { RangePickerProps } from "antd/es/date-picker";
import type { TreeSelectProps } from "antd/es/tree-select";
import type { Tag as TagT } from "@/types";
import dayjs from "dayjs";
import { MESSAGES } from "@/constants/messages";
import { useTodoStore } from "@/store/todoStore";

export default function ContextMenu({ todo, children }: ContextMenuProps) {
  const { dispatchTodo, todoTags } = useTodoStore();

  // 编辑时间
  const onOk = (
    deadLine: DatePickerProps["value"] | RangePickerProps["value"],
  ) => {
    dispatchTodo({
      type: "changed",
      todo: {
        ...todo,
        // @ts-ignore
        deadline: dayjs(deadLine).format(),
      },
    });
    message.info(MESSAGES.INFO.DEADLINE_UPDATED);
  };

  // 添加子任务
  function handleAddSubTask(parentId: string, parentDepth: number): void {
    const { activeListId } = useTodoStore.getState();
    dispatchTodo({
      type: "added",
      title: "",
      completed: false,
      parentId,
      depth: parentDepth + 1,
      listId: activeListId,
    });
  }

  // 将扁平的标签数组转换为TreeSelect所需的树形结构
  const buildTreeData = (tags: TagT[]): TreeSelectProps["treeData"] => {
    // @ts-ignore
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
    dispatchTodo({
      type: "changed",
      todo: {
        ...todo,
        tags: a.slice(),
      },
    });
    message.info(MESSAGES.INFO.TAGS_UPDATED);
  };

  // 构建标签树形数据
  const moveToBin = useTodoStore((state) => state.moveToBin);
  const restoreFromBin = useTodoStore((state) => state.restoreFromBin);
  const deleteFromBin = useTodoStore((state) => state.deleteFromBin);
  const activeListId = useTodoStore((state) => state.activeListId);
  const treeData = buildTreeData(todoTags);
  const normalItems: MenuProps["items"] = [
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
            // @ts-ignore
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
        if (handleAddSubTask) {
          handleAddSubTask(todo.id, todo.depth);
        } else {
          message.warning(MESSAGES.WARNING.SUBTASK_NOT_AVAILABLE);
        }
      },
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "删除",
      onClick: async () => {
        try {
          await moveToBin(todo);
          message.success(MESSAGES.SUCCESS.TASK_DELETED);
        } catch (error) {
          message.error("删除任务失败，请重试");
        }
      },
    }];
  const binItems: MenuProps["items"] = [
    {
      key: "recover",
      icon: <RedoOutlined />,
      label: <span>恢复</span>,
      onClick: async () => {
        try {
          await restoreFromBin(todo.id);
          message.success(MESSAGES.SUCCESS.TASK_RESTORED);
        } catch (error) {
          message.error("恢复任务失败，请重试");
        }
      },
    },
    {
      key: "true-delete",
      icon: <DeleteOutlined />,
      label: <span>彻底删除</span>,
      onClick: () => {
        Modal.confirm({
          title: "确认删除",
          content: "这将会彻底删除这个任务，你确定吗？",
          okText: "确定",
          cancelText: "取消",
          onOk() {
            return new Promise<void>((resolve) => {
              deleteFromBin(todo.id)
                .then(() => {
                  message.success(MESSAGES.SUCCESS.TASK_PERMANENTLY_DELETED);
                  resolve();
                })
                .catch(() => {
                  message.error("彻底删除任务失败，请重试");
                  resolve();
                });
            });
          },
          onCancel() {
            message.info(MESSAGES.INFO.DELETE_CANCELLED);
          },
        });
      },
    },
  ];

  return (
    <Dropdown
      key={todo.id}
      trigger={["contextMenu"]}
      menu={{
        items: activeListId === "bin" ? binItems : normalItems,
        className: "ctx-menu-left",
      }}
    >
      {children}
    </Dropdown>
  );
}
