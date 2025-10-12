import {
  DeleteOutlined,
  EditOutlined,
  RedoOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { ContextMenuProps, Todo } from "@/types";
import { Dropdown, type MenuProps, Modal, TreeSelect } from "antd";
import { message } from "@/utils/antdStatic";
import { formatMessage, MESSAGES } from "@/constants/messages";
import { userId, useTodoStore } from "@/store/todoStore";
import { togglePinTask } from "@/services/todoService";
import TagTreeSelect from "./TagTreeSelect";
import TaskDateTimePicker from "./TaskDateTimePicker";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

// 定义树形表格数据类型
interface TreeTableData extends Todo {
  key: string;
  children?: TreeTableData[];
}

// 定义TreeSelect需要的数据格式
interface TreeNode {
  value: string;
  title: string;
  children?: TreeNode[];
}

export default function ContextMenu({ todo, children }: ContextMenuProps) {
  const { dispatchTodo, todoTags, tasks } = useTodoStore();
  const { userId } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const dropdownRef = useRef<Dropdown>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>(
    todo.parentId,
  );

  // 添加样式到组件
  useEffect(() => {
    // 创建样式元素
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      /* 限制移动任务子菜单的高度 */
      .move-task-submenu + .ant-dropdown-menu-sub {
        max-height: 300px;
        overflow-y: auto;
      }
      
      /* 限制所有嵌套子菜单的高度 */
      .ant-dropdown-menu-submenu-popup .ant-dropdown-menu {
        max-height: 300px;
        overflow-y: auto;
      }
      
      /* 为TreeSelect在Dropdown中设置样式 */
      .tree-select-wrapper {
        width: 250px;
        padding: 8px;
      }
      
      /* 为TreeSelect的下拉菜单设置样式 */
      .custom-tree-select .ant-select-dropdown {
        max-height: 300px;
        overflow: auto;
      }
    `;

    // 添加到文档头部
    document.head.appendChild(styleElement);

    // 组件卸载时移除样式
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // 将任务数据转换为TreeSelect需要的格式
  const convertToTreeSelectData = useCallback(
    (tasks: Todo[], currentTodoId: string): TreeNode[] => {
      // 创建ID到任务的映射
      const taskMap = new Map<string, TreeNode>();
      const rootNodes: TreeNode[] = [];

      // 首先创建所有节点
      tasks.forEach((task) => {
        taskMap.set(task.id, { value: task.id, title: task.title });
      });

      // 构建树形结构
      tasks.forEach((task) => {
        const node = taskMap.get(task.id);
        if (node) {
          if (!task.parentId) {
            // 根节点直接加入
            rootNodes.push(node);
          } else {
            // 添加到父节点的children中
            const parentNode = taskMap.get(task.parentId);
            if (parentNode) {
              if (!parentNode.children) {
                parentNode.children = [];
              }
              parentNode.children.push(node);
            } else {
              // 如果父节点不存在或被过滤掉，则作为根节点
              rootNodes.push(node);
            }
          }
        }
      });

      // 在最前面添加"移到顶层"选项
      return [{ value: "", title: "移到顶层" }, ...rootNodes];
    },
    [],
  );

  // 处理任务移动层级
  const handleTaskMove = async (value: string | null) => {
    try {
      // 获取store状态一次，避免多次获取可能导致的状态不一致
      const store = useTodoStore.getState();
      const targetParentId = value === "" || value === null ? null : value;

      // 检查是否选择了当前任务作为父任务
      if (targetParentId === todo.id) {
        message.warning("不能将任务移动到自身下");
        // 重置选择
        setSelectedParentId(undefined);
        return;
      }

      // 更新服务器数据
      await store.updateParentId(todo.id, targetParentId);

      message.success(value ? "任务层级移动成功" : "任务层级已移至顶级");

      // 重置选择
      setSelectedParentId(undefined);
    } catch (error) {
      console.error("移动任务层级失败:", error);
      message.error("任务移动层级失败，请重试");
    }
  };

  // 添加子任务
  function handleAddSubTask(todo: Todo): void {
    const { activeListId } = useTodoStore.getState();
    const action: any = {
      type: "added",
      newTask: {
        title: "",
        completed: false,
        tag: [],
        parentId: todo.id,
        depth: todo.depth + 1,
        groupId: todo.groupId,
        isPinned: todo.isPinned,
        pinnedAt: todo.pinnedAt, // 新增：置顶时间，用于多个置顶任务的排序
        listId: todo.listId,
        userId: userId,
      },
    };
    if (activeListId === "today" || activeListId === "nearlyWeek") {
      action.newTask.deadline = todo.deadline;
    }
    console.log(action.newTask);
    dispatchTodo(action);
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

  // 转换为TreeSelect需要的数据格式
  const treeSelectData = convertToTreeSelectData(tasks, todo.id);

  const normalItems: MenuProps["items"] = [
    {
      key: "date",
      label: <TaskDateTimePicker todo={todo} />,
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
      key: "move_group",
      label: "移动分组",
      children: [
        {
          key: "group-null",
          label: "无分组",
          onClick: async () => {
            try {
              await dispatchTodo({
                type: "moveToGroup",
                todoId: todo.id,
                groupId: null,
                listId: todo.listId, // 使用当前任务的清单ID
              });
              message.success("任务已移出分组");
            } catch (error) {
              console.error("移动任务到分组失败:", error);
              message.error("移动任务到分组失败，请重试");
            }
          },
        },
        ...useTodoStore.getState().groups.map((group) => {
          // 获取分组对应的清单信息
          const list = useTodoStore
            .getState()
            .todoListData.find((l) => l.id === group.listId);
          return {
            key: `group-${group.id}`,
            label: `${group.groupName} (${list?.title || "未知清单"})`,
            onClick: async () => {
              try {
                await dispatchTodo({
                  type: "moveToGroup",
                  todoId: todo.id,
                  groupId: group.id,
                  listId: list?.id,
                });
                message.success(`任务已移动到分组：${group.groupName}`);
              } catch (error) {
                console.error("移动任务到分组失败:", error);
                message.error("移动任务到分组失败，请重试");
              }
            },
          };
        }),
      ],
    },
    {
      key: "pin",
      icon: <EditOutlined />,
      label: todo.isPinned ? "取消置顶" : "置顶",
      onClick: async () => {
        try {
          // 直接调用togglePinTask API，而不是使用dispatchTodo
          const newIsPinned = !todo.isPinned;
          await togglePinTask(todo.id, newIsPinned);

          message.success(MESSAGES.SUCCESS.TASK_PINNED);
        } catch (error) {
          message.error("更新任务置顶状态失败，请重试");
        }
      },
    },
    {
      key: "add_sub",
      icon: <EditOutlined />,
      label: "添加子任务",
      onClick: () => {
        if (handleAddSubTask) {
          handleAddSubTask(todo);
        } else {
          message.warning(MESSAGES.WARNING.SUBTASK_NOT_AVAILABLE);
        }
      },
    },
    {
      key: "move_task_select",
      disabled: true,
      label: (
        <div className="tree-select-wrapper">
          <div style={{ marginBottom: "8px" }}>移动任务到：</div>
          <TreeSelect
            showSearch
            treeNodeFilterProp="title"
            showCheckedStrategy="SHOW_PARENT"
            style={{ width: "120%" }}
            placeholder="搜索并选择目标任务"
            className="custom-tree-select"
            treeData={treeSelectData}
            value={selectedParentId}
            onChange={(value) => handleTaskMove(value)}
            onSelect={(value) => {
              if (value === todo.id) {
                message.warning("不能将任务移动到自身下");
                return false;
              }
              return true;
            }}
          />
        </div>
      ),
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "删除",
      onClick: async () => {
        try {
          await moveToBin(todo);
          message.success({
            content: (
              <div style={{ display: "flex", alignItems: "center" }}>
                <span>
                  {formatMessage(MESSAGES.SUCCESS.TASK_DELETED, {
                    taskTitle: todo.title,
                  })}
                </span>
                <RollbackOutlined
                  style={{
                    marginLeft: 8,
                    cursor: "pointer",
                    color: "orange",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // 撤销删除状态 - 从回收站恢复任务
                    restoreFromBin(todo.id);
                  }}
                />
              </div>
            ),
            duration: 5, // 增加显示时间，给用户更多时间点击撤销
          });
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
        items:
          useTodoStore.getState().activeListId === "bin"
            ? binItems
            : normalItems,
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
