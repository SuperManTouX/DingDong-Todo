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
  Dropdown,
  Menu,
  Row,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import {
  uploadAvatar,
  updateUserProfile,
  deleteUserAvatar,
} from "@/services/userService";
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
  const { user, updateUserInfo, avatarHistory } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [form] = Form.useForm();
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  ); // 保存选择的文件对象

  // 主题选项
  const themeOptions = [
    { value: "light", label: "浅色主题" },
    { value: "dark", label: "深色主题" },
    { value: "green", label: "绿色主题" },
    { value: "red", label: "红色主题" },
    { value: "yellow", label: "黄色主题" },
  ];

  // 自定义上传请求 - 仅在本地生成预览，不立即上传
  const customRequest: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
  }) => {
    try {
      // 保存选择的文件对象
      setSelectedAvatarFile(file);

      // 生成本地预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempAvatar(e.target?.result as string);
        onSuccess?.();
        message.success("头像预览生成成功！");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("生成头像预览失败:", error);
      message.error("生成头像预览失败，请重试");
    }
  };

  // 上传配置
  const uploadProps: UploadProps = {
    name: "avatar",
    listType: "picture-card",
    className: "avatar-uploader",
    showUploadList: false,
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
        nickname: user.nickname || "",
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
    // 重置临时状态
    setTempAvatar(null);
    setSelectedAvatarFile(null);
  };

  // 处理编辑个人信息提交
  const handleEditSubmit = async (values: any) => {
    try {
      setLoading(true);
      let avatarUrl = user?.avatar;

      // 如果有选择新的头像文件，先上传头像
      if (selectedAvatarFile) {
        setAvatarUploading(true);
        const uploadResult = await uploadAvatar(selectedAvatarFile);
        if (uploadResult.success) {
          avatarUrl = uploadResult.avatarUrl;
        } else {
          throw new Error("头像上传失败");
        }
      } else if (tempAvatar) {
        // 如果有临时头像URL（可能是选择了历史头像或已上传但未保存的情况）
        avatarUrl = tempAvatar;
      }

      // 调用后端API更新用户信息
      await updateUserProfile({
        email: values.email,
        nickname: values.nickname,
        bio: values.bio,
        avatar: avatarUrl,
      });

      message.success("个人信息更新成功！");
      setEditModalOpen(false);
      // 重置临时状态
      setTempAvatar(null);
      setSelectedAvatarFile(null);
    } catch (error) {
      console.error("更新个人信息失败:", error);
      message.error("更新失败，请重试");
    } finally {
      setLoading(false);
      setAvatarUploading(false);
    }
  };

  // 用户名现在设为不可编辑，不再需要校验规则

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
            {user?.nickname && (
              <div style={{ marginBottom: "8px" }}>
                <Text strong>昵称：</Text>
                <Text>{user.nickname}</Text>
              </div>
            )}
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
            <Row justify={"center"}>
              <Avatar
                size={120}
                src={tempAvatar || user?.avatar}
                icon={<UserOutlined />}
                style={{ marginBottom: "16px" }}
              />
              <Upload {...uploadProps}>
                <div style={{ textAlign: "center" }}>
                  {tempAvatar || user?.avatar ? null : (
                    <UploadOutlined style={{ fontSize: 24, color: "#999" }} />
                  )}
                  <div style={{ marginTop: 8 }}>点击更换头像</div>
                </div>
              </Upload>
            </Row>
            <Text
              type="secondary"
              style={{ display: "block", marginTop: "8px" }}
            >
              支持JPG、PNG格式，文件大小不超过{MAX_UPLOAD_SIZE / 1024 / 1024}MB
            </Text>

            {/* 历史头像显示区域 */}
            {avatarHistory && avatarHistory.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  历史头像 (右键可删除)
                </Text>
                <div
                  style={{
                    display: "flex",
                    overflowX: "auto",
                    padding: "8px 0",
                    gap: "12px",
                    justifyContent: "flex-start",
                    maxWidth: "100%",
                  }}
                >
                  {avatarHistory.map((avatarInfo, index) => {
                    // 创建右键菜单
                    const menuItems = [
                      {
                        key: "1",
                        label: (
                          <span
                            onClick={() => {
                              setTempAvatar(avatarInfo.url);
                              setSelectedAvatarFile(null);
                              message.success("已选择历史头像");
                            }}
                          >
                            使用此头像
                          </span>
                        ),
                      },
                      {
                        key: "2",
                        label: (
                          <span
                            onClick={async () => {
                              try {
                                await deleteUserAvatar(avatarInfo);
                                // 删除后如果当前选中的是被删除的头像，清除选中状态
                                if (tempAvatar === avatarInfo.url) {
                                  setTempAvatar(user?.avatar || "");
                                  setSelectedAvatarFile(null);
                                }
                                message.success("头像删除成功");
                              } catch (error) {
                                console.error("删除头像失败:", error);
                                message.error("头像删除失败，请重试");
                              }
                            }}
                          >
                            <DeleteOutlined className="mr-1" /> 删除头像
                          </span>
                        ),
                        danger: true,
                      },
                    ];

                    return (
                      <Dropdown
                        key={index}
                        menu={{ items: menuItems }}
                        trigger={["contextMenu"]}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            position: "relative",
                            padding: "2px",
                            cursor: "pointer",
                            borderRadius: "50%",
                            border:
                              tempAvatar === avatarInfo.url
                                ? "2px solid #1890ff"
                                : "none",
                          }}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <Avatar
                            size={64}
                            src={avatarInfo.url}
                            icon={<UserOutlined />}
                            style={{
                              border: "1px solid #d9d9d9",
                              transition: "all 0.3s",
                            }}
                            onClick={() => {
                              setTempAvatar(avatarInfo.url);
                              setSelectedAvatarFile(null);
                              message.success("已选择历史头像");
                            }}
                          />
                          {tempAvatar === avatarInfo.url && (
                            <div
                              style={{
                                position: "absolute",
                                top: "-8px",
                                right: "-8px",
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                backgroundColor: "#1890ff",
                              }}
                            />
                          )}
                        </div>
                      </Dropdown>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 用户名显示（不可编辑） */}
          <Form.Item name="username" label="用户名">
            <Input placeholder="请输入用户名" disabled />
          </Form.Item>

          {/* 昵称输入 */}
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ max: 50, message: "昵称不能超过50个字符" }]}
          >
            <Input placeholder="请输入昵称（选填）" />
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
