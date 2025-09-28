import { DeleteOutlined, EditOutlined, RedoOutlined } from "@ant-design/icons";
import type { ContextMenuProps } from "@/types";
import { Dropdown, type MenuProps, Modal } from "antd";
import { message } from "@/utils/antdStatic";
import { MESSAGES } from "@/constants/messages";
import { useTodoStore } from "@/store/todoStore";
import TagTreeSelect from "./TagTreeSelect";
import TaskDateTimePicker from "./TaskDateTimePicker";
import { useState, useEffect, useRef } from "react";

export default function ContextMenu({ todo, children }: ContextMenuProps) {
  const { dispatchTodo, todoTags } = useTodoStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const dropdownRef = useRef<Dropdown>(null);

  // 编辑时间
  const handleDateTimeChange = (date: any) => {
    dispatchTodo({
      type: "changed",
      todo: {
        ...todo,
        deadline: date,
      },
    });
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

  // 处理标签变化
  const handleTagsChange = (tags: string[]) => {
    // 确保转换为字符串数组后更新任务标签
    dispatchTodo({
      type: "changed",
      todo: {
        ...todo,
        tags: tags.slice(),
      },
    });
  };

  // 检查数据是否加载完成
  useEffect(() => {
    // 模拟数据加载检查，实际项目中可以根据具体的数据加载状态来判断
    const checkDataLoaded = () => {
      // 检查todo和todoTags是否已加载
      if (todo && Array.isArray(todoTags)) {
        setIsDataLoaded(true);
      }
    };

    // 初始检查
    checkDataLoaded();

    // 监听数据变化
    const interval = setInterval(checkDataLoaded, 100);
    return () => clearInterval(interval);
  }, [todo, todoTags]);

  // 处理下拉菜单打开/关闭
  const handleOpenChange = (open: boolean) => {
    // 在数据加载完成前，强制保持打开状态
    if (isDataLoaded) {
      setIsOpen(open);
    } else {
      setIsOpen(true);
    }
  };

  // 构建标签树形数据
  const moveToBin = useTodoStore((state) => state.moveToBin);
  const restoreFromBin = useTodoStore((state) => state.restoreFromBin);
  const deleteFromBin = useTodoStore((state) => state.deleteFromBin);
  const activeListId = useTodoStore((state) => state.activeListId);

  const normalItems: MenuProps["items"] = [
    {
      key: "date",
      label: (
        <TaskDateTimePicker todo={todo} onDateChange={handleDateTimeChange} />
      ),
      disabled: true,
    },
    {
      key: "tags_select",
      disabled: true,
      label: (
        <TagTreeSelect
          todoTags={todoTags}
          todoTagsValue={todo.tags}
          onTagsChange={handleTagsChange}
        />
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
    },
  ];
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
      open={isOpen}
      onOpenChange={handleOpenChange}
      ref={dropdownRef}
    >
      {children}
    </Dropdown>
  );
}
