import {
  Button,
  Col,
  Dropdown,
  type MenuProps,
  message,
  Modal,
  Row,
  Select,
} from "antd";
import { useState } from "react";
import {
  AppstoreOutlined,
  EditOutlined,
  EllipsisOutlined,
  PlusOutlined,
  TagOutlined,
} from "@ant-design/icons";
import type { Tag, TodoActionExtended, TodoListData } from "@/types";
import { ListColorNames, ListColors } from "@/constants";
import TagManager from "./TagManager";

interface ListGroupManagerProps {
  todoListGroups: TodoListData[];
  todoTags: Tag[];
  dispatchTodo: React.Dispatch<TodoActionExtended>;
  dispatchTag: React.Dispatch<TodoActionExtended>;
  onActiveGroupChange: (groupId: string) => void;
}

/**
 * 清单组管理组件
 * 负责清单组的添加、编辑、删除等功能
 */
export default function ListGroupManager({
  todoListGroups,
  todoTags,
  dispatchTodo,
  dispatchTag,
  onActiveGroupChange,
}: ListGroupManagerProps) {
  // 统一管理添加和编辑的状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add"); // 模式：添加或编辑
  const [groupName, setGroupName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [selectedColor, setSelectedColor] = useState(ListColors.none);
  const [groupId, setGroupId] = useState("");

  // 初始化标签管理器
  const { showModal: showTagModal, tagModal } = TagManager({
    dispatchTag,
  });

  // 显示模态框 - 统一处理添加和编辑
  const showModal = (
    type: "add" | "edit" = "add",
    groupData?: TodoListData,
  ) => {
    setMode(type);
    if (type === "add") {
      // 添加模式：重置状态
      setGroupName("");
      setSelectedEmoji("");
      setSelectedColor(ListColors.none);
      setGroupId("");
    } else if (type === "edit" && groupData) {
      // 编辑模式：设置现有数据
      setGroupName(groupData.title);
      setSelectedEmoji(groupData.emoji || "");
      setSelectedColor(groupData.color || ListColors.none);
      setGroupId(groupData.id);
    }
    setIsModalOpen(true);
  };

  // 处理确认按钮 - 统一处理添加和编辑
  const handleOk = () => {
    if (groupName.trim()) {
      if (mode === "add") {
        // 添加新清单
        dispatchTodo({
          type: "addListGroup",
          title: groupName.trim(),
          emoji: selectedEmoji,
          color: selectedColor,
        });
        message.success("清单添加成功");
      } else if (mode === "edit") {
        // 编辑现有清单
        dispatchTodo({
          type: "updateListGroup",
          groupId: groupId,
          title: groupName.trim(),
          emoji: selectedEmoji,
          color: selectedColor,
        });
        message.success("清单更新成功");
      }
      setIsModalOpen(false);
    } else {
      message.warning("清单名称不能为空");
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleDeleteListGroup = (groupId: string, groupTitle: string) => {
    Modal.confirm({
      title: "确认删除清单",
      content: `确定要删除清单 "${groupTitle}" 吗？此操作无法撤销。`,
      okText: "确认删除",
      okType: "danger",
      cancelText: "取消",
      onOk() {
        dispatchTodo({
          type: "deleteListGroup",
          groupId: groupId,
        });
        message.success("清单已删除");

        // 如果删除的是当前激活的清单，切换到第一个清单
        if (todoListGroups.length > 0) {
          const remainingGroups = todoListGroups.filter(
            (g) => g.id !== groupId,
          );
          if (remainingGroups.length > 0) {
            onActiveGroupChange(remainingGroups[0].id);
          }
        }
      },
    });
  };

  const handleDeleteTag = (tagId: string, tagName: string) => {
    // 检查是否有子标签
    const hasChildren = todoTags.some((t) => t.parentId === tagId);
    const confirmContent = hasChildren
      ? `确定要删除标签 "${tagName}" 吗？此操作无法撤销。`
      : `确定要删除标签 "${tagName}" 吗？此操作无法撤销。`;

    Modal.confirm({
      title: "确认删除标签",
      content: confirmContent,
      okText: "确认删除",
      okType: "danger",
      cancelText: "取消",
      onOk() {
        dispatchTodo({
          type: "deleteTag",
          payload: tagId,
        } as any);
        message.success("标签已删除");
      },
    });
  };

  const renderTodoListGroups = (): MenuProps["items"] => {
    return todoListGroups.map((tg) => {
      // 下拉菜单配置
      const dropdownMenu = {
        items: [
          {
            key: "1",
            label: (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  showModal("edit", tg);
                }}
              >
                <EditOutlined />
                编辑清单
              </span>
            ),
          },
          {
            key: "2",
            label: (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteListGroup(tg.id, tg.title);
                }}
                style={{ color: "#ff4d4f" }}
              >
                删除清单
              </span>
            ),
          },
        ],
      };
      return {
        key: tg.id,
        icon: tg.emoji ? (
          <span style={{ fontSize: "16px" }}>{tg.emoji}</span>
        ) : (
          <AppstoreOutlined />
        ),
        label: (
          <Row justify={"space-between"} align={"middle"}>
            <span>{tg.title}</span>
            <Col>
              {tg.color && (
                <Button
                  style={{
                    width: "10px",
                    minWidth: "5px",
                    height: "10px",
                    backgroundColor: tg.color || "transparent",
                    border: tg.color ? "none" : "1px solid #d9d9d9",
                  }}
                  size={"small"}
                  shape="circle"
                ></Button>
              )}
              <Dropdown menu={dropdownMenu}>
                <EllipsisOutlined
                  className="opacityHover0-1"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </Col>
          </Row>
        ),
      };
    });
  };
  //递归创建层次标签数组
  function renderTagsList(parentId: string | null): MenuProps["items"] {
    const result: MenuProps["items"] = [];

    const tags: Tag[] = todoTags.filter((tg) => tg.parentId === parentId);
    if (tags.length === 0) {
      return undefined;
    }
    tags.forEach((tag) => {
      const dropdownMenu = {
        items: [
          {
            key: "1",
            label: (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  showTagModal("edit", {
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                    parentId: tag.parentId,
                  });
                }}
              >
                <EditOutlined />
                编辑标签
              </span>
            ),
          },
          {
            key: "2",
            label: (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTag(tag.id, tag.name);
                }}
                style={{ color: "#ff4d4f" }}
              >
                删除标签
              </span>
            ),
          },
        ],
      };
      //菜单Tag列表推入（push）
      result.push({
        key: tag.id,
        icon: <TagOutlined />,
        label: (
          <Row justify={"space-between"} align={"middle"}>
            <span>{tag.name}</span>
            <Col>
              {tag.color && (
                <Button
                  style={{
                    width: "10px",
                    minWidth: "5px",
                    height: "10px",
                    backgroundColor: tag.color || "transparent",
                    border: tag.color ? "none" : "1px solid #d9d9d9",
                  }}
                  size={"small"}
                  shape="circle"
                ></Button>
              )}
              <Dropdown menu={dropdownMenu}>
                <EllipsisOutlined
                  className="opacityHover0-1"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </Col>
          </Row>
        ),

        onTitleClick: () => {
          onActiveGroupChange(tag.id);
        },
        children: renderTagsList(tag.id),
      });
    });
    return result;
  }

  // 菜单项配置
  const menuItem: MenuProps["items"] = [
    {
      key: "aa",
      icon: <AppstoreOutlined />,
      label: "今天",
    },
    {
      key: "bb",
      icon: <AppstoreOutlined />,
      label: "最近七天",
    },
    { type: "divider" },
    {
      key: "grp2",
      label: (
        <Row justify={"space-between"} className="text-secondary fs-6">
          清单
          <PlusOutlined
            className={"opacityHover3-1"}
            onClick={(e) => {
              e.stopPropagation();
              showModal("add");
            }}
          />
        </Row>
      ),
      children: renderTodoListGroups(),
    },
    {
      key: "grp3",
      icon: <TagOutlined />,
      label: (
        <Row justify={"space-between"} className="text-secondary fs-6">
          标签
          <PlusOutlined
            className={"opacityHover3-1"}
            onClick={(e) => {
              e.stopPropagation();
              showTagModal("add");
            }}
          />
        </Row>
      ),

      children: renderTagsList(null),
    },
    { type: "divider", style: { margin: "2rem 0" } },
    {
      key: "3-1",
      icon: <AppstoreOutlined />,
      label: "已完成",
    },
    {
      key: "3-2",
      icon: <AppstoreOutlined />,
      label: "回收站",
    },
  ];

  return {
    menuItem,
    groupModal: (
      <Modal
        title={mode === "add" ? "添加清单" : "编辑清单"}
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={400}
      >
        <div className="mb-3">
          <label htmlFor="groupName" className="form-label">
            清单名称
          </label>
          <Row>
            <Col span={4}>
              <Select
                value={selectedEmoji || undefined}
                style={{ width: 60 }}
                onChange={(value) => setSelectedEmoji(value)}
                placeholder="选择图标"
                options={[
                  { value: "😊", label: "😊" },
                  { value: "😎", label: "😎" },
                  { value: "❤️", label: "❤️" },
                  { value: "🔥", label: "🔥" },
                  { value: "📝", label: "📝" },
                  { value: "🎯", label: "🎯" },
                  { value: "🌟", label: "🌟" },
                  { value: "📅", label: "📅" },
                  { value: "💡", label: "💡" },
                  { value: "💪", label: "💪" },
                ]}
                showSearch
              />
            </Col>
            <Col span={20}>
              <input
                type="text"
                className="form-control w-100"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="请输入清单名称"
                autoFocus
              />
            </Col>
          </Row>
        </div>
        {selectedEmoji && (
          <div className="mb-3">
            <span className="text-secondary">已选择：</span>
            <span style={{ fontSize: "24px" }}>{selectedEmoji}</span>
          </div>
        )}
        <div className="mb-3">
          <label htmlFor="groupColor" className="form-label">
            清单颜色
          </label>
          <Select
            value={selectedColor}
            style={{ width: "100%" }}
            onChange={(value) => setSelectedColor(value)}
            placeholder="选择颜色"
            options={Object.entries(ListColors).map(([key, color]) => ({
              value: color,
              label: (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: color,
                      borderRadius: "50%",
                      border: "1px solid #d9d9d9",
                    }}
                  />
                  <span>
                    {ListColorNames[color as keyof typeof ListColorNames] ||
                      key}
                  </span>
                </div>
              ),
            }))}
          />
        </div>
        {mode === "add" && (
          <p className="text-secondary">
            添加后可以在侧边栏看到并切换到新的清单。
          </p>
        )}
      </Modal>
    ),
    tagModal,
  };
}
