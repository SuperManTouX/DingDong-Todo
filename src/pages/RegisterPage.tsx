import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message, Space } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import { useTodoStore } from "../store/todoStore";
import { sendVerificationCode } from "../services/authService";
import { useNavigate } from "react-router-dom"; // 添加useNavigate导入

const { Title } = Typography;
const { Search } = Input;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { register } = useAuthStore();
  const { setUserId } = useTodoStore();
  const navigate = useNavigate(); // 使用useNavigate钩子
  const [form] = Form.useForm();

  // 处理发送验证码
  const handleSendCode = async () => {
    try {
      // 验证邮箱格式
      const emailValue = form.getFieldValue("email");
      if (!emailValue) {
        message.error("请先输入邮箱地址");
        return;
      }

      // 发送验证码
      setSendingCode(true);
      await sendVerificationCode({ email: emailValue });
      message.success("验证码已发送，请查收邮箱");

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      message.error("发送验证码失败：" + (error as Error).message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async (values: {
    username: string;
    email: string;
    password: string;
    code: string;
  }) => {
    try {
      setLoading(true); // 恢复加载状态设置
      const user = await register(values);
      setUserId(user.id); // 恢复设置用户ID
      message.success("注册成功"); // 恢复成功提示

      // 添加显式导航到首页
      navigate("/", { replace: true });
    } catch (error) {
      // 移除重复的错误消息显示，因为authService中已经处理了
      // 但保留错误捕获以避免未捕获的Promise错误
      console.log('注册错误已在authService中处理:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
      }}
    >
      <Card style={{ width: 350 }}>
        <Title level={4} style={{ textAlign: "center" }}>
          创建账号
        </Title>
        <Form form={form} name="register" onFinish={handleRegister}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="code"
            rules={[{ required: true, message: "请输入验证码" }]}
          >
            <Search
              prefix={<MailOutlined />}
              placeholder="验证码"
              enterButton={
                countdown > 0 ? `${countdown}秒后重试` : "获取验证码"
              }
              onSearch={handleSendCode}
              disabled={countdown > 0 || sendingCode}
              loading={sendingCode}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码长度至少为6位" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-100"
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            <a href="/login">已有账号？立即登录</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
