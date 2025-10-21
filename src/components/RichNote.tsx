import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  createEditor,
  Descendant,
  BaseEditor,
  Element as SlateElement,
  Transforms,
  Node as SlateNode,
} from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { debounce } from "lodash";
import { UploadOutlined } from "@ant-design/icons";
import { Upload, message } from "antd";
import type { RcFile, UploadProps } from "antd";
import api from "@/services/api";

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
  type?: "paragraph" | "heading-one" | "heading-two" | "code-block" | "image";
  children: CustomText[];
  url?: string; // 图片URL
  alt?: string; // 图片替代文本
}

// 定义图片元素类型
type ImageElement = {
  type: "image";
  url: string;
  alt?: string;
  children: [{ text: "" }];
};

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
  onImageUpload?: (file: File) => Promise<string>; // 图片上传回调函数，如果不提供则使用默认实现
}

const RichNote: React.FC<RichNoteProps> = ({
  value,
  onChange,
  placeholder = "开始编写...",
  includeFormatting = true,
  onImageUpload,
}) => {
  const { currentTheme } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          // 处理图片元素
          if (node.type === "image" && "url" in node) {
            return `<img src="${node.url}" alt="${node.alt || '图片'}" style="max-width: 100%; height: auto;" />`;
          }
          
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

  // 创建防抖版本的onChange函数
  const debouncedOnChange = useMemo(
    () => debounce((value: string) => {
      onChange(value);
    }, 300), // 300毫秒防抖延迟
    [onChange]
  );

  // 存储上一次的图片URL列表
  const previousImagesRef = useRef<Set<string>>(new Set());

  // 从URL中提取对象键
  const extractObjectKeyFromUrl = (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      // 提取路径部分（去掉开头的'/'）
      return parsedUrl.pathname.substring(1);
    } catch (error) {
      console.error('URL解析错误:', error);
      return url; // 失败时返回原始URL
    }
  };

  // 生成唯一文件名
  const generateUniqueFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileExtension = originalName.split('.').pop() || '';
    return `${timestamp}_${randomStr}.${fileExtension}`;
  };

  // 获取阿里云OSS临时访问凭证
  const getTaskAttachmentPresignedUrl = async (
    fileName: string,
    fileType: string,
    username: string
  ): Promise<{
    credentials: {
      AccessKeyId: string;
      AccessKeySecret: string;
      SecurityToken: string;
      Expiration: string;
    };
    fileUrl: string;
    objectKey: string;
    bucketName: string;
    region: string;
  }> => {
    try {
      console.log("获取阿里云OSS临时访问凭证 - 开始");
      
      // 生成正确格式的文件名，包含task-attachments路径，并确保用户名格式为user-001格式
      const timestamp = Date.now();
      const extension = fileName.split('.').pop() || 'jpg';
      // 确保用户名格式为user-001格式（添加前缀和补零）
      let formattedUsername = username;
      if (!username.startsWith('user-')) {
        // 如果用户名不是user-开头，尝试转换为user-001格式
        const match = username.match(/\d+/);
        if (match) {
          const userId = parseInt(match[0]);
          formattedUsername = `user-${userId.toString().padStart(3, '0')}`;
        }
      }
      const formattedFileName = `task-attachments/${formattedUsername}/${timestamp}.${extension}`;
      console.log(`使用格式化后的用户名: ${formattedUsername}`);
      
      // 调用API获取凭证
      const response = await api.post("/users/avatar/presigned-url", {
        fileName: formattedFileName,
        fileType
      });

      // 验证响应数据
      if (!response || !response.credentials) {
        throw new Error("获取OSS临时访问凭证失败：响应数据格式错误");
      }

      console.log("成功获取阿里云OSS临时访问凭证");
      
      // 强制使用正确的路径格式，而不依赖API返回的路径
      const bucketName = response.bucketName || "todo-avatar";
      const region = response.region || "oss-cn-beijing";
      const objectKey = formattedFileName;
      const fileUrl = `https://${bucketName}.${region}.aliyuncs.com/${objectKey}`;
      console.log(`最终上传路径: ${fileUrl}`);
      
      console.log(`设置上传路径: ${fileUrl}`);
      console.log(`设置对象键: ${objectKey}`);

      return {
        credentials: response.credentials,
        fileUrl: fileUrl,
        objectKey: objectKey,
        bucketName: bucketName,
        region: region,
      };
    } catch (error) {
      console.error("获取阿里云OSS临时访问凭证失败:", error);
      message.error("获取上传凭证失败，请稍后重试");
      throw error;
    }
  };

  // 使用OSS临时凭证上传文件到阿里云OSS
  const uploadFileToCloud = async (
    file: File,
    credentials: {
      AccessKeyId: string;
      AccessKeySecret: string;
      SecurityToken: string;
    },
    bucketName: string,
    region: string,
    objectKey: string,
    fileType: string
  ): Promise<void> => {
    try {
      console.log("直接上传文件到阿里云OSS - 开始");
      
      // 构建OSS上传URL，添加安全检查
      const safeBucketName = bucketName || "dingdongtodo";
      const safeRegion = region || "oss-cn-beijing";
      const ossUploadUrl = `https://${safeBucketName}.${safeRegion}.aliyuncs.com`;
      
      console.log(`构建的OSS上传URL: ${ossUploadUrl}`);
      
      // 生成policy
      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + 3600); // 1小时过期
      
      const policy = {
        expiration: expirationDate.toISOString(),
        conditions: [
          ["content-length-range", 0, 1024 * 1024 * 10], // 10MB限制
        ],
      };
      
      const policyBase64 = btoa(JSON.stringify(policy));
      
      // 生成HMAC-SHA1签名
      const encoder = new TextEncoder();
      const keyData = encoder.encode(credentials.AccessKeySecret);
      const policyData = encoder.encode(policyBase64);
      
      // 导入密钥
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
      );
      
      // 生成签名
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, policyData);
      
      // 将ArrayBuffer转换为Base64字符串
      const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
      
      // 准备表单数据
      const formData = new FormData();
      formData.append("key", objectKey);
      formData.append("OSSAccessKeyId", credentials.AccessKeyId);
      formData.append("policy", policyBase64);
      formData.append("signature", signature);
      formData.append("x-oss-security-token", credentials.SecurityToken); // 必须添加安全令牌
      formData.append("Content-Type", fileType);
      formData.append("success_action_status", "200"); // 确保返回200状态码
      formData.append("file", file);
      
      // 直接上传到OSS
      const response = await fetch(ossUploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          // 不要设置Content-Type，FormData会自动设置
        },
      });
      
      if (!response.ok) {
        console.error(`[阿里云OSS直接上传] 失败: HTTP状态码 ${response.status}`);
        const errorText = await response.text();
        console.error(`错误响应内容: ${errorText}`);
        throw new Error(`阿里云OSS上传失败: 状态码 ${response.status}`);
      }
      
      console.log(`文件 ${file.name} 上传成功到 ${objectKey}`);
    } catch (error) {
      console.error("上传文件到阿里云OSS失败:", error);
      message.error("上传文件失败，请稍后重试");
      throw error;
    }
  };

  // 默认的图片上传处理函数
  const handleImageUpload = useCallback(
    async (file: RcFile): Promise<string> => {
      try {
        // 检查是否提供了自定义上传函数
        if (onImageUpload) {
          return await onImageUpload(file);
        }

        // 获取当前用户信息
        const { user } = useAuthStore.getState();
        if (!user || !user.username) {
          throw new Error("用户未登录，无法上传图片");
        }

        message.loading("准备上传...");
        
        // Step 1: 获取阿里云OSS临时访问凭证
        // 直接使用原始文件名，在getTaskAttachmentPresignedUrl内部会生成唯一文件名
        const ossCredentialsData = await getTaskAttachmentPresignedUrl(
          file.name,
          file.type,
          user.username
        );

        message.loading("上传中...");
        
        // Step 2: 直接上传文件到阿里云OSS
        await uploadFileToCloud(
          file,
          ossCredentialsData.credentials,
          ossCredentialsData.bucketName,
          ossCredentialsData.region,
          ossCredentialsData.objectKey,
          file.type
        );

        message.success("图片上传成功");
        
        // 返回上传后的文件URL
        return ossCredentialsData.fileUrl;
      } catch (error) {
        console.error("图片上传失败:", error);
        message.error("图片上传失败，请稍后重试");
        throw error;
      }
    },
    [onImageUpload]
  );

  // 插入图片到编辑器
  const insertImage = useCallback(
    (url: string) => {
      if (!editor.selection) {
        // 如果没有选区，在文档末尾添加
        Transforms.insertNodes(editor, {
          type: "image",
          url,
          children: [{ text: "" }],
        });
      } else {
        // 在当前选区插入图片
        Transforms.insertNodes(editor, {
          type: "image",
          url,
          children: [{ text: "" }],
        });
        // 移动光标到图片后面
        Transforms.move(editor);
      }
    },
    [editor]
  );

  // 上传前的校验
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
    if (!isJpgOrPng) {
      message.error('只支持JPG/PNG/GIF格式的图片!');
      return Upload.LIST_IGNORE;
    }
    const isLessThan2M = file.size / 1024 / 1024 < 2;
    if (!isLessThan2M) {
      message.error('图片大小必须小于2MB!');
      return Upload.LIST_IGNORE;
    }
    return false; // 手动处理上传
  };

  // 处理点击上传按钮
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    try {
      const url = await handleImageUpload(file);
      insertImage(url);
    } catch (error) {
      message.error('图片上传失败');
      console.error('图片上传失败:', error);
    }
    // 清空input，允许重复上传同一个文件
    e.target.value = '';
  };

  // 从文档中提取所有图片URL
  const extractImageUrls = (nodes: Descendant[]): Set<string> => {
    const urls = new Set<string>();
    
    const extractFromNode = (node: Descendant | any) => {
      if (SlateElement.isElement(node)) {
        // 如果是图片元素
        if (node.type === 'image' && node.url) {
          urls.add(node.url);
        }
        // 递归处理子节点
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(extractFromNode);
        }
      }
    };
    
    nodes.forEach(extractFromNode);
    return urls;
  };

  // 删除图片从OSS - 改进的版本
  const deleteImageFromOss = async (imageUrl: string) => {
    console.log('尝试从OSS删除图片:', imageUrl);
    
    try {
      // 从URL中提取objectKey - 更健壮的方式
      let objectKey = '';
      
      // 尝试不同格式的URL解析
      if (imageUrl.includes('task-attachments/')) {
        // 如果URL直接包含task-attachments路径
        objectKey = imageUrl.split('task-attachments/')[1];
        // 确保得到完整的路径
        if (objectKey) {
          objectKey = 'task-attachments/' + objectKey;
        }
      } else {
        // 尝试使用URL构造函数
        try {
          const url = new URL(imageUrl);
          objectKey = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (e) {
          console.error('URL解析失败，尝试直接使用路径:', e);
          objectKey = imageUrl;
        }
      }
      
      console.log('提取的objectKey:', objectKey);
      
      // 验证目录是否为task-attachments
      if (!objectKey.includes('task-attachments/')) {
        console.log('图片不在task-attachments目录下，跳过删除:', objectKey);
        return;
      }
      
      // 提取真正的objectKey（从task-attachments开始）
      const finalObjectKey = objectKey.substring(objectKey.indexOf('task-attachments/'));
      console.log('最终使用的objectKey:', finalObjectKey);
      
      console.log('调用API删除图片');
      const response = await api.delete('/file/attachments', {
        data: { objectKey: finalObjectKey, imageUrl }
      });
      console.log('成功从OSS删除图片:', imageUrl, '响应:', response.data);
    } catch (error) {
      console.error('删除OSS图片失败:', error.response ? error.response.data : error);
    }
  };

  // 处理编辑器内容变化
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      try {
        // 提取当前文档中的所有图片URL
        const currentImages = extractImageUrls(newValue);
        console.log('当前文档中的图片URL:', Array.from(currentImages));
        console.log('之前文档中的图片URL:', Array.from(previousImagesRef.current));
        
        // 检测被删除的图片
        const deletedImages = new Set<string>();
        previousImagesRef.current.forEach(url => {
          if (!currentImages.has(url)) {
            deletedImages.add(url);
          }
        });
        
        console.log('检测到被删除的图片:', Array.from(deletedImages));
        
        // 从OSS删除被移除的图片
        deletedImages.forEach(url => {
          console.log(`处理被删除的图片: ${url}`);
          // 只删除task-attachments目录下的图片，避免删除其他来源的图片
          if (url.includes('task-attachments/')) {
            console.log(`确认删除task-attachments目录下的图片: ${url}`);
            deleteImageFromOss(url);
          } else {
            console.log(`跳过删除非task-attachments目录的图片: ${url}`);
          }
        });
        
        // 更新图片URL引用
        previousImagesRef.current = currentImages;
        console.log('图片URL引用已更新');
        
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
          debouncedOnChange(JSON.stringify(content));
        } else {
          // 将纯文本也转换为JSON格式
          const simpleContent: SimpleTextContent = {
            type: "simple_text",
            content: text,
          };
          debouncedOnChange(JSON.stringify(simpleContent));
        }
      } catch (error) {
        console.error("处理编辑器内容变化失败:", error);
        // 出错时回退到简单文本字符串
        debouncedOnChange("");
      }
    },
    [debouncedOnChange, includeFormatting],
  );

  // 组件挂载时初始化图片引用
  useEffect(() => {
    const initialImages = extractImageUrls(parsedValue);
    previousImagesRef.current = initialImages;
  }, [parsedValue]);

  // 添加额外的处理，当组件卸载时清理未使用的图片
  useEffect(() => {
    return () => {
      console.log('RichNote组件卸载，检查是否有未使用的图片');
      // 这里可以添加额外的清理逻辑
    };
  }, []);

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
          <button
            onClick={(e) => {
              e.preventDefault();
              handleUploadClick();
            }}
            style={{
              padding: "4px 8px",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: currentTheme.textColor,
            }}
            title="插入图片"
          >
            <UploadOutlined />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg, image/png, image/gif"
            onChange={handleFileSelect}
          />
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
          renderElement={({ attributes, children, element }) => {
            // 渲染图片元素
            if (element.type === "image" && "url" in element) {
              return (
                <div {...attributes}>
                  <img 
                    src={element.url} 
                    alt={element.alt || "图片"} 
                    style={{ 
                      maxWidth: "100%", 
                      height: "auto", 
                      marginVertical: "8px",
                      borderRadius: "4px",
                      cursor: 'pointer',
                    }} 
                    title="按Delete键删除图片"
                  />
                </div>
              );
            }
            
            // 渲染其他类型的元素
            switch (element.type) {
              case "heading-one":
                return <h1 {...attributes}>{children}</h1>;
              case "heading-two":
                return <h2 {...attributes}>{children}</h2>;
              case "code-block":
                return <pre {...attributes}>{children}</pre>;
              case "paragraph":
              default:
                return <p {...attributes}>{children}</p>;
            }
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
