import React, { useState } from "react";
import {
  Card,
  Divider,
  Switch,
  Select,
  Input,
  Button,
  Typography,
  Avatar,
  Upload,
  Modal,
  message,
} from "antd";
import { UploadOutlined, UserOutlined, EyeOutlined } from "@ant-design/icons";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { uploadAvatar } from "@/services/userService";
import { MAX_UPLOAD_SIZE, SUPPORTED_IMAGE_TYPES } from "@/constants/config";
import { getUserAvatarUrl } from "@/utils/avatarUtils";
import type { UploadProps } from "antd";

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 设置页面组件
 * 提供应用的各项设置功能，包括头像上传
 */
const SettingsPage: React.FC = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const { user, updateUserInfo } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  // 主题选项
  const themeOptions = [
    { value: "light", label: "浅色主题" },
    { value: "dark", label: "深色主题" },
    { value: "green", label: "绿色主题" },
    { value: "red", label: "红色主题" },
  ];

  // 处理头像上传
  const handleUploadChange: UploadProps["onChange"] = ({ file, fileList }) => {
    if (file.status === "done") {
      message.success(`${file.name} 上传成功`);
    } else if (file.status === "error") {
      message.error(`${file.name} 上传失败`);
    }
  };

  // 自定义上传请求 - 使用统一的uploadAvatar函数
  const customRequest: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
    onError,
  }) => {
    try {
      setLoading(true);
      // 使用统一的上传函数处理整个流程
      const result = await uploadAvatar(file);

      if (result.success) {
        // 更新本地用户信息
        if (updateUserInfo) {
          updateUserInfo({ ...user, avatar: result.avatarUrl });
        }

        onSuccess?.();
        message.success("头像上传成功！");
      } else {
        throw new Error("头像上传失败");
      }
    } catch (error) {
      console.error("头像上传失败:", error);
      onError?.(error);
      message.error("头像上传失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理头像预览
  const handlePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  // 获取base64编码
  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // 上传配置
  const uploadProps: UploadProps = {
    name: "avatar",
    listType: "picture-card",
    className: "avatar-uploader",
    showUploadList: false,
    customRequest,
    onChange: handleUploadChange,
    beforeUpload: (file) => {
      const isSupportedType = SUPPORTED_IMAGE_TYPES.includes(file.type);
      if (!isSupportedType) {
        message.error(
          `只支持 ${SUPPORTED_IMAGE_TYPES.map((type) => type.split("/")[1].toUpperCase()).join("/")} 格式!`,
        );
      }
      const isWithinSizeLimit = file.size <= MAX_UPLOAD_SIZE;
      if (!isWithinSizeLimit) {
        message.error(`图片大小不能超过 ${MAX_UPLOAD_SIZE / 1024 / 1024}MB!`);
      }
      return isSupportedType && isWithinSizeLimit;
    },
  };
  console.log(user);
  return (
    <div className={"w-100"} style={{ padding: "24px" }}>
      <Title level={2}>设置</Title>

      <Card
        title="账户信息"
        style={{
          marginBottom: "16px",
          maxWidth: "800px",
          margin: "0 auto 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <Avatar
              size={120}
              src={user?.avatar}
              icon={<UserOutlined />}
              style={{ cursor: "pointer" }}
            />
            <Upload {...uploadProps}>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "#1890ff",
                  borderRadius: "50%",
                  padding: "4px",
                  cursor: "pointer",
                }}
              >
                <UploadOutlined style={{ color: "white", fontSize: "16px" }} />
              </div>
            </Upload>
            {user?.avatar && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  backgroundColor: "#666",
                  borderRadius: "50%",
                  padding: "4px",
                  cursor: "pointer",
                }}
                onClick={() => handlePreview({ preview: user.avatar })}
              >
                <EyeOutlined style={{ color: "white", fontSize: "16px" }} />
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <Title level={4}>{user?.username || "用户"}</Title>
          <Paragraph>{user?.email || "example@example.com"}</Paragraph>
          <Button type="primary" style={{ marginTop: "8px" }} loading={loading}>
            修改个人资料
          </Button>
        </div>
      </Card>

      <Card
        title="主题设置"
        style={{
          marginBottom: "16px",
          maxWidth: "800px",
          margin: "0 auto 16px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <span style={{ marginRight: "16px" }}>选择主题：</span>
          <Select
            value={currentTheme}
            onChange={(value) => setTheme(value)}
            style={{ width: 120 }}
          >
            {themeOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
        <Divider />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>自动切换主题</span>
          <Switch />
        </div>
      </Card>

      <Card
        title="通知设置"
        style={{
          marginBottom: "16px",
          maxWidth: "800px",
          margin: "0 auto 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <span>启用桌面通知</span>
          <Switch />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>每日提醒</span>
          <Switch />
        </div>
      </Card>

      <Card title="反馈" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <TextArea rows={4} placeholder="请输入您的建议或问题..." />
        <Button type="primary" style={{ marginTop: "16px" }}>
          提交反馈
        </Button>
      </Card>

      {/* 头像预览弹窗 */}
      <Modal
        open={previewOpen}
        title="头像预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="头像预览" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default SettingsPage;
