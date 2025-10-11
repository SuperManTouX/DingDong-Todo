import React, { useState, useCallback, useMemo } from "react";
import {
  createEditor,
  Descendant,
  BaseEditor,
  Element as SlateElement,
} from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import { useThemeStore } from "@/store/themeStore";

// 定义自定义Editor类型
type CustomEditor = BaseEditor & ReactEditor;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

type FormatType = "bold" | "italic" | "underline" | "code";

interface CustomElement {
  type?: "paragraph" | "heading-one" | "heading-two" | "code-block";
  children: CustomText[];
}

interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
}

interface RichNoteContent {
  text: string; // 纯文本内容
  formattedContent: Descendant[]; // 包含格式信息的完整内容
  html?: string; // 可选的HTML表示
}

// 简单文本的JSON结构
interface SimpleTextContent {
  type: "simple_text";
  content: string;
}

type ReactEditor = BaseEditor & {
  selection: any;
};

// 初始值
const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
];

interface RichNoteProps {
  value: string;
  onChange: (value: string) => void; // 现在统一返回字符串(JSON格式)
  placeholder?: string;
  includeFormatting?: boolean; // 控制是否回传格式信息
}

const RichNote: React.FC<RichNoteProps> = ({
  value,
  onChange,
  placeholder = "开始编写...",
  includeFormatting = true,
}) => {
  const { currentTheme } = useThemeStore();

  // 初始化编辑器
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  // 转换文本为Slate文档结构
  const parsedValue = useMemo(() => {
    if (!value) return initialValue;
    try {
      // 首先检查是否已经是JSON格式
      // 简单判断：如果以{或[开头，且以}或]结尾，尝试解析为JSON
      const trimmedValue = value.trim();
      let parsed;
      
      // 只在可能是JSON格式时才尝试解析
      if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) || 
          (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))) {
        try {
          parsed = JSON.parse(value);
        } catch (jsonError) {
          // 不是有效的JSON，作为纯文本处理
          console.warn("输入不是有效的JSON，将作为纯文本处理");
          return [{ type: "paragraph", children: [{ text: value }] }];
        }
        
        // 检查是否是带有格式的内容
        if (parsed.formattedContent) {
          return parsed.formattedContent;
        }

        // 检查是否是简单文本的JSON结构
        if (parsed.type === "simple_text" && typeof parsed.content === "string") {
          return [{ type: "paragraph", children: [{ text: parsed.content }] }];
        }

        // 如果解析结果是字符串，使用该字符串
        if (typeof parsed === "string") {
          return [{ type: "paragraph", children: [{ text: parsed }] }];
        }

        // 其他JSON结构可能是直接的formattedContent
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      
      // 默认回退到纯文本处理
      return [{ type: "paragraph", children: [{ text: value }] }];
    } catch (error) {
      console.warn("解析文本失败，将作为纯文本处理:", error);
      // 如果发生任何错误，始终作为纯文本处理
      return [{ type: "paragraph", children: [{ text: value }] }];
    }
  }, [value]);

  // 将Slate文档转换为HTML
  const serializeToHtml = (nodes: Descendant[]): string => {
    return nodes
      .map((node) => {
        if (SlateElement.isElement(node) && "children" in node) {
          const children = node.children
            .map((child) => {
              if (typeof child === "object" && "text" in child) {
                let text = child.text;
                if (child.bold) text = `<strong>${text}</strong>`;
                if (child.italic) text = `<em>${text}</em>`;
                if (child.underline) text = `<u>${text}</u>`;
                if (child.code) text = `<code>${text}</code>`;
                return text;
              }
              return "";
            })
            .join("");

          switch (node.type) {
            case "heading-one":
              return `<h1>${children}</h1>`;
            case "heading-two":
              return `<h2>${children}</h2>`;
            case "code-block":
              return `<pre><code>${children}</code></pre>`;
            case "paragraph":
            default:
              return `<p>${children}</p>`;
          }
        }
        return "";
      })
      .join("");
  };

  // 处理编辑器内容变化
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      try {
        // 将Slate文档结构转换为纯文本
        const text = newValue
          .map((node) => {
            if (SlateElement.isElement(node) && "children" in node) {
              return node.children
                .map((child) => {
                  if (typeof child === "object" && "text" in child) {
                    return child.text;
                  }
                  return "";
                })
                .join("");
            }
            return "";
          })
          .join("\n");

        if (includeFormatting) {
          // 回传包含格式信息的完整数据，转换为JSON字符串
          const content: RichNoteContent = {
            text,
            formattedContent: newValue,
            html: serializeToHtml(newValue),
          };
          onChange(JSON.stringify(content));
        } else {
          // 将纯文本也转换为JSON格式
          const simpleContent: SimpleTextContent = {
            type: "simple_text",
            content: text,
          };
          onChange(JSON.stringify(simpleContent));
        }
      } catch (error) {
        console.error("处理编辑器内容变化失败:", error);
        // 出错时回退到简单文本字符串
        onChange("");
      }
    },
    [onChange, includeFormatting],
  );

  // 处理格式化
  const toggleFormat = useCallback(
    (format: FormatType) => {
      if (!editor.selection) return;

      const isActive = isFormatActive(editor, format);

      editor.addMark(format, !isActive);
    },
    [editor],
  );

  // 检查格式是否激活
  const isFormatActive = (editor: CustomEditor, format: FormatType) => {
    const marks = editor.getMarks();
    return marks ? marks[format] === true : false;
  };

  return (
    <div
      className={"bgColor-transparent"}
      style={{
        color: currentTheme.textColor,
        borderRadius: "6px",
        border: "1px solid #d9d9d9",
        overflow: "hidden",
      }}
    >
      {/* 工具栏 */}
      <div
        style={{
          padding: "8px",
          borderBottom: "1px solid #d9d9d9",
          display: "flex",
          gap: "8px",
        }}
      >
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            toggleFormat("bold");
          }}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isFormatActive(editor, "bold") ? "bold" : "normal",
            color: currentTheme.textColor,
          }}
        >
          B
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            toggleFormat("italic");
          }}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontStyle: isFormatActive(editor, "italic") ? "italic" : "normal",
            color: currentTheme.textColor,
          }}
        >
          I
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            toggleFormat("underline");
          }}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: "transparent",
            cursor: "pointer",
            textDecoration: isFormatActive(editor, "underline")
              ? "underline"
              : "none",
            color: currentTheme.textColor,
          }}
        >
          U
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            toggleFormat("code");
          }}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontFamily: isFormatActive(editor, "code")
              ? "monospace"
              : "inherit",
            color: currentTheme.textColor,
          }}
        >
          Code
        </button>
      </div>

      {/* 编辑器 */}
      <Slate editor={editor} initialValue={parsedValue} onChange={handleChange}>
        <Editable
          placeholder={placeholder}
          renderLeaf={({ attributes, children, leaf }) => {
            let leafChildren = children;

            if (leaf.bold) {
              leafChildren = <strong>{leafChildren}</strong>;
            }

            if (leaf.italic) {
              leafChildren = <em>{leafChildren}</em>;
            }

            if (leaf.underline) {
              leafChildren = <u>{leafChildren}</u>;
            }

            if (leaf.code) {
              leafChildren = <code>{leafChildren}</code>;
            }

            return <span {...attributes}>{leafChildren}</span>;
          }}
          style={{
            minHeight: "300px",
            padding: "12px",
            outline: "none",
            color: currentTheme.textColor,
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        />
      </Slate>
    </div>
  );
};

export default RichNote;
