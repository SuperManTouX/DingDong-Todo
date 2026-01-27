import { useState } from "react";
import { Modal, Input, Select } from "antd";
import { ListColorNames, ListColors } from "@/constants";
import { message } from "@/utils/antdStatic";
import { MESSAGES } from "@/constants/messages";
import { useTodoStore } from "@/store/todoStore";

/**
 * 标签管理组件
 * 负责标签的添加、编辑等功能
 */
export default function TagManager() {
  const { dispatchTag, todoTags } = useTodoStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(ListColors.none);
  const [tagId, setTagId] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
   * 获取所有顶级标签（parentId为null的标签）
   */
  const getTopLevelTags = () => {
    return todoTags.filter(
      (tag) => tag.parentId === null && (!mode || tag.id !== tagId),
    );
  };

  /**
   * 处理确认按钮
   */
  const handleOk = async () => {
    if (tagName.trim()) {
      setIsLoading(true);
      try {
        if (mode === "add") {
          // 添加新标签（使用await等待异步操作完成）
          dispatchTag({
            type: "addTag",
            payload: {
              name: tagName.trim(),
              color: selectedColor,
              parentId,
            },
          } as any);

          // 注意：成功消息已经在tagSlice.ts中处理
        } else if (mode === "edit") {
          // 编辑现有标签（使用await等待异步操作完成）
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

          // 注意：成功消息已经在tagSlice.ts中处理
        }
        setIsModalOpen(false);
      } catch (error) {
        // 错误处理由tagSlice.ts中的message.error处理
        console.error("标签操作失败:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      message.warning(MESSAGES.WARNING.EMPTY_TAG_NAME);
    }
  };

  /**
   * 处理取消按钮
   */
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // 获取顶级标签列表用于选择器
  const topLevelTags = getTopLevelTags();

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
        confirmLoading={isLoading}
      >
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
        <div className="mb-3">
          <label htmlFor="parentTag" className="form-label">
            父级标签
          </label>
          <Select
            id="parentTag"
            value={parentId}
            style={{ width: "100%" }}
            onChange={(value) => setParentId(value)}
            placeholder="选择父级标签（可选）"
            options={[
              {
                value: null,
                label: "无父级标签",
              },
              ...topLevelTags.map((tag) => ({
                value: tag.id,
                label: (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {tag.color && (
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          backgroundColor: tag.color,
                          borderRadius: "50%",
                        }}
                      />
                    )}
                    <span>{tag.name}</span>
                  </div>
                ),
              })),
            ]}
          />
        </div>
        {mode === "add" && (
          <p className="text-secondary">添加后可以在侧边栏看到新的标签。</p>
        )}
      </Modal>
    ),
  };
}
