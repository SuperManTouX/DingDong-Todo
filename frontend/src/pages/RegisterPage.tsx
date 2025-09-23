import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useTodoStore } from '../store/todoStore';

const { Title } = Typography;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const { setUserId } = useTodoStore();
  const [form] = Form.useForm();

  const handleRegister = async (values: { username: string; email: string; password: string }) => {
    try {
      setLoading(true);
      const user = await register(values.username, values.email, values.password);
      setUserId(user.id);
      message.success('注册成功，请登录');
      form.resetFields();
    } catch (error) {
      message.error('注册失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card style={{ width: 350 }}>
        <Title level={4} style={{ textAlign: 'center' }}>创建账号</Title>
        <Form
          form={form}
          name="register"
          onFinish={handleRegister}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度至少为6位' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-100" loading={loading}>
              注册
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <a href="/login">已有账号？立即登录</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;