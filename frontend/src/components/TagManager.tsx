import { useState } from "react";
import { Modal, Input, Select, message } from "antd";
import { ListColorNames, ListColors } from "@/constants";
import { MESSAGES } from "@/constants/messages";
import { useTodoStore } from "@/store/todoStore";

/**
 * 标签管理组件
 * 负责标签的添加、编辑等功能
 */
export default function TagManager() {
  // 使用 Ant Design 官方的 message.useMessage() hook
  const [messageApi, contextHolder] = message.useMessage();

  const { dispatchTag } = useTodoStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(ListColors.none);
  const [tagId, setTagId] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);

  /**
   * 显示模态框
   * @param type 模式：添加或编辑
   * @param tagData 标签数据（编辑模式下）
   */
  const showModal = (
    type: "add" | "edit" = "add",
    tagData?: {
      id: string;
      name: string;
      color?: string;
      parentId?: string | null;
    },
  ) => {
    setMode(type);
    if (type === "add") {
      // 添加模式：重置状态
      setTagName("");
      setSelectedColor(ListColors.none);
      setTagId("");
      setParentId(null);
    } else if (type === "edit" && tagData) {
      // 编辑模式：设置现有数据
      setTagName(tagData.name);
      setSelectedColor(tagData.color || ListColors.none);
      setTagId(tagData.id);
      setParentId(tagData.parentId || null);
    }
    setIsModalOpen(true);
  };

  /**
   * 处理确认按钮
   */
  const handleOk = () => {
    if (tagName.trim()) {
      if (mode === "add") {
        // 添加新标签
        dispatchTag({
          type: "addTag",
          payload: {
            name: tagName.trim(),
            color: selectedColor,
            parentId,
          },
        } as any);
        messageApi.success(MESSAGES.SUCCESS.TAG_ADDED);
      } else if (mode === "edit") {
        // 编辑现有标签
        dispatchTag({
          type: "updateTag",
          payload: {
            id: tagId,
            updates: {
              name: tagName.trim(),
              color: selectedColor,
              parentId,
            },
          },
        } as any);
        messageApi.success(MESSAGES.SUCCESS.TAG_UPDATED);
      }
      setIsModalOpen(false);
    } else {
      messageApi.warning(MESSAGES.WARNING.EMPTY_TAG_NAME);
    }
  };

  /**
   * 处理取消按钮
   */
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return {
    showModal,
    tagModal: (
      <Modal
        title={mode === "add" ? "添加标签" : "编辑标签"}
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={400}
      >
        {contextHolder}
        <div className="mb-3">
          <label htmlFor="tagName" className="form-label">
            标签名称
          </label>
          <Input
            id="tagName"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="请输入标签名称"
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label htmlFor="tagColor" className="form-label">
            标签颜色
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
          <p className="text-secondary">添加后可以在侧边栏看到新的标签。</p>
        )}
      </Modal>
    ),
  };
}
