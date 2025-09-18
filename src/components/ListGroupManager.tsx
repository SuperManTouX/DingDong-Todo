import React, { useState } from "react";
import { Row, Modal, Col, Select, message, type MenuProps } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EllipsisOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { Dropdown } from "antd";
import type { TodoListData, TodoActionExtended } from "@/types";
import { ListColors, ListColorNames } from "@/constants";

interface ListGroupManagerProps {
  todoListGroups: TodoListData[];
  dispatch: React.Dispatch<TodoActionExtended>;
  onActiveGroupChange: (groupId: string) => void;
}

/**
 * 清单组管理组件
 * 负责清单组的添加、编辑、删除等功能
 */
export default function ListGroupManager({
  todoListGroups,
  dispatch,
  onActiveGroupChange,
}: ListGroupManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(""); // 存储选中的emoji
  const [selectedColor, setSelectedColor] = useState(ListColors.default); // 存储选中的颜色

  // 编辑清单相关状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState("");
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingEmoji, setEditingEmoji] = useState(""); // 存储编辑中的emoji
  const [editingColor, setEditingColor] = useState(ListColors.default); // 存储编辑中的颜色

  // 处理emoji选择
  const handleChange = (value: string) => {
    setSelectedEmoji(value);
  };

  const showModal = () => {
    setNewGroupName(""); // 重置输入框
    setSelectedEmoji(""); // 重置选中的emoji
    setSelectedColor(ListColors.default); // 重置选中的颜色
    setIsModalOpen(true);
  };

  const handleOk = () => {
    if (newGroupName.trim()) {
      // 执行添加新列表组的操作
      dispatch({
        type: "addListGroup",
        title: newGroupName.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
      });
      message.success("清单添加成功");
    } else {
      message.warning("清单名称不能为空");
      return; // 阻止关闭模态框
    }
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const showEditModal = (
    groupId: string,
    title: string,
    emoji: string,
    color?: string,
  ) => {
    setEditingGroupId(groupId);
    setEditingGroupName(title);
    setEditingEmoji(emoji);
    setEditingColor(color || ListColors.default);
    setIsEditModalOpen(true);
  };

  const handleEditOk = () => {
    if (editingGroupName.trim()) {
      // 执行编辑清单的操作
      dispatch({
        type: "updateListGroup",
        groupId: editingGroupId,
        title: editingGroupName.trim(),
        emoji: editingEmoji,
        color: editingColor,
      });
      message.success("清单更新成功");
      setIsEditModalOpen(false);
    } else {
      message.warning("清单名称不能为空");
      return; // 阻止关闭模态框
    }
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
  };

  const handleDeleteListGroup = (groupId: string, groupTitle: string) => {
    Modal.confirm({
      title: "确认删除清单",
      content: `确定要删除清单 "${groupTitle}" 吗？此操作无法撤销。`,
      okText: "确认删除",
      okType: "danger",
      cancelText: "取消",
      onOk() {
        dispatch({
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
                  showEditModal(tg.id, tg.title, tg.emoji || "", tg.color);
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
          <span
            style={{ fontSize: "16px", color: tg.color || ListColors.default }}
          >
            {tg.emoji}
          </span>
        ) : (
          <AppstoreOutlined style={{ color: tg.color || ListColors.default }} />
        ),
        label: (
          <Row justify={"space-between"}>
            <span style={{ color: tg.color || ListColors.default }}>
              {tg.title}
            </span>
            <Dropdown menu={dropdownMenu}>
              <EllipsisOutlined
                className="opacityHover0-1"
                style={{ cursor: "pointer" }}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </Row>
        ),
      };
    });
  };

  // 菜单项配置
  const menuItem: MenuProps["items"] = [
    {
      key: "1",
      icon: <AppstoreOutlined />,
      label: "今天",
    },
    {
      key: "2",
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
              showModal();
            }}
          />
        </Row>
      ),
      children: renderTodoListGroups(),
    },
    {
      key: "grp3",
      label: "标签",
      children: [
        {
          key: "3",
          icon: <AppstoreOutlined />,
          label: "设置",
        },
      ],
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
    addModal: (
      <Modal
        title="添加清单"
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
                onChange={handleChange}
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
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
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
        <p className="text-secondary">
          添加后可以在侧边栏看到并切换到新的清单。
        </p>
      </Modal>
    ),
    editModal: (
      <Modal
        title="编辑清单"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isEditModalOpen}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        width={400}
      >
        <div className="mb-3">
          <label htmlFor="editGroupName" className="form-label">
            清单名称
          </label>
          <Row>
            <Col span={4}>
              <Select
                value={editingEmoji || undefined}
                style={{ width: 60 }}
                onChange={(value) => setEditingEmoji(value)}
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
                id="editGroupName"
                value={editingGroupName}
                onChange={(e) => setEditingGroupName(e.target.value)}
                placeholder="请输入清单名称"
                autoFocus
              />
            </Col>
          </Row>
        </div>

        {editingEmoji && (
          <div className="mb-3">
            <span className="text-secondary">已选择：</span>
            <span style={{ fontSize: "24px" }}>{editingEmoji}</span>
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="editGroupColor" className="form-label">
            清单颜色
          </label>
          <Select
            value={editingColor}
            style={{ width: "100%" }}
            onChange={(value) => setEditingColor(value)}
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
      </Modal>
    ),
  };
}
