import React from "react";
import { TreeSelect, Tag } from "antd";
import type { TreeSelectProps } from "antd/es/tree-select";
import type { Tag as TagT } from "@/types";
import { message } from "@/utils/antdStatic";
import { MESSAGES } from "@/constants/messages";

interface TagTreeSelectProps {
  todoTags: TagT[];
  todoTagsValue?: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

export default function TagTreeSelect({
  todoTags,
  todoTagsValue = [],
  onTagsChange,
  className = "",
}: TagTreeSelectProps) {
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
  const handleTagsChange = (
    keys: { label: React.ReactNode; value: string }[],
  ) => {
    const tagsArray: string[] = [];
    keys.map((item) => tagsArray.push(item.value));

    // 调用父组件传入的回调函数
    onTagsChange(tagsArray);
    message.info(MESSAGES.INFO.TAGS_UPDATED);
  };

  // 构建标签树形数据
  const treeData = buildTreeData(todoTags);

  return (
    <div style={{ width: 300, padding: "8px 0" }} className={className}>
      <TreeSelect
        mode="multiple"
        treeData={treeData}
        // @ts-ignore
        value={(todoTagsValue || []).filter(
          (tagId) => typeof tagId === "string",
        )}
        onChange={handleTagsChange}
        onClick={(e) => e.stopPropagation()}
        treeCheckable={true}
        treeCheckStrictly={true} // 点击父标签不会自动选择子标签
        placeholder="选择标签"
        style={{ width: "100%" }}
        maxTagCount="responsive"
        allowClear={true}
      />
    </div>
  );
}
