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
  Form,
  Space,
} from "antd";
import { UploadOutlined, UserOutlined, EditOutlined } from "@ant-design/icons";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { uploadAvatar, updateUserProfile } from "@/services/userService";
import { MAX_UPLOAD_SIZE, SUPPORTED_IMAGE_TYPES } from "@/constants/config";
import type { UploadProps } from "antd";
import type { RuleObject } from "antd/es/form";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 设置页面组件
 * 提供应用的各项设置功能，包括头像上传和个人信息修改
 */
const SettingsPage: React.FC = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const { user, updateUserInfo } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [form] = Form.useForm();
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);

  // 主题选项
  const themeOptions = [
    { value: "light", label: "浅色主题" },
    { value: "dark", label: "深色主题" },
    { value: "green", label: "绿色主题" },
    { value: "red", label: "红色主题" },
  ];

  // 自定义上传请求 - 使用统一的uploadAvatar函数
  const customRequest: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
    onError,
  }) => {
    try {
      setAvatarUploading(true);
      // 使用统一的上传函数处理整个流程
      const result = await uploadAvatar(file);

      if (result.success) {
        // 更新临时头像，等待用户保存个人信息
        setTempAvatar(result.avatarUrl);

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
      setAvatarUploading(false);
    }
  };

  // 上传配置
  const uploadProps: UploadProps = {
    name: "avatar",
    listType: "picture",
    showUploadList: true,
    customRequest,
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

  // 处理编辑个人信息模态框打开
  const handleEditProfile = () => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        bio: user.bio || "",
      });
    }
    // 重置临时头像
    setTempAvatar(null);
    setEditModalOpen(true);
  };

  // 处理编辑个人信息模态框关闭
  const handleModalCancel = () => {
    setEditModalOpen(false);
    form.resetFields();
    // 重置临时头像
    setTempAvatar(null);
  };

  // 处理编辑个人信息提交
  const handleEditSubmit = async (values: any) => {
    try {
      setLoading(true);
      // 调用API更新用户信息
      console.log("更新用户信息:", values);

      // 调用后端API更新用户信息，包含可能更新的头像
      await updateUserProfile({
        username: values.username,
        email: values.email,
        bio: values.bio,
        avatar: tempAvatar || user?.avatar,
      });

      message.success("个人信息更新成功！");
      setEditModalOpen(false);
      // 重置临时头像
      setTempAvatar(null);
    } catch (error) {
      console.error("更新个人信息失败:", error);
      message.error("更新失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 自定义表单校验规则
  const usernameValidator = (_: RuleObject, value: string) => {
    if (!value || value.trim().length < 2) {
      return Promise.reject(new Error("用户名至少需要2个字符"));
    }
    return Promise.resolve();
  };

  return (
    <div className={"w-100"} style={{ padding: "24px" }}>
      <Title level={2}>设置</Title>

      {/* 账户信息卡片 */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <UserOutlined />
            <span>账户信息</span>
          </div>
        }
        style={{ marginBottom: "24px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <Avatar
            size={100}
            src={user?.avatar}
            icon={<UserOutlined />}
            style={{ marginRight: "24px" }}
          />
          <div>
            <div style={{ marginBottom: "8px" }}>
              <Text strong>用户名：</Text>
              <Text>{user?.username || "用户"}</Text>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <Text strong>邮箱：</Text>
              <Text>{user?.email || "example@example.com"}</Text>
            </div>
            {user?.bio && (
              <div>
                <Text strong>个人简介：</Text>
                <Text>{user.bio}</Text>
              </div>
            )}
          </div>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEditProfile}
        >
          修改个人信息
        </Button>
      </Card>

      {/* 主题设置 */}
      <Card title="主题设置" style={{ marginBottom: "16px" }}>
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

      {/* 通知设置 */}
      <Card title="通知设置" style={{ marginBottom: "16px" }}>
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

      {/* 反馈 */}
      <Card title="反馈">
        <TextArea rows={4} placeholder="请输入您的建议或问题..." />
        <Button type="primary" style={{ marginTop: "16px" }}>
          提交反馈
        </Button>
      </Card>

      {/* 修改个人信息弹窗 - 包含头像上传 */}
      <Modal
        title="修改个人信息"
        open={editModalOpen}
        onCancel={handleModalCancel}
        footer={null}
        width={600}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ maxWidth: "500px", margin: "0 auto" }}
        >
          {/* 头像上传区域 */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Avatar
              size={120}
              src={tempAvatar || user?.avatar}
              icon={<UserOutlined />}
              style={{ marginBottom: "16px" }}
            />
            <Upload {...uploadProps}>
              <Button
                icon={<UploadOutlined />}
                loading={avatarUploading}
                disabled={loading}
              >
                上传新头像
              </Button>
            </Upload>
            <Text
              type="secondary"
              style={{ display: "block", marginTop: "8px" }}
            >
              支持JPG、PNG格式，文件大小不超过{MAX_UPLOAD_SIZE / 1024 / 1024}MB
            </Text>
          </div>

          {/* 用户名输入 */}
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, validator: usernameValidator }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          {/* 邮箱输入 */}
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          {/* 个人简介 */}
          <Form.Item
            name="bio"
            label="个人简介"
            rules={[{ max: 200, message: "个人简介不能超过200个字符" }]}
          >
            <TextArea rows={4} placeholder="介绍一下自己吧..." />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={handleModalCancel}
                loading={loading || avatarUploading}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || avatarUploading}
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
