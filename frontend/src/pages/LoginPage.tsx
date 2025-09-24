import React, { useState } from "react";
import { Form, Input, Button, Card, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import { useTodoStore } from "../store/todoStore";
import { message } from "@/utils/antdStatic";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    try {
      setLoading(true);
      await login(values.username, values.password);
      message.success("登录成功");

      navigate("/");
    } catch (error) {
      message.error("登录失败：" + (error as Error).message);
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
          Todo应用登录
        </Title>
        <Form form={form} name="login" onFinish={handleLogin}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
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
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: "center" }}>
            <a href="/register">没有账号？立即注册</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
