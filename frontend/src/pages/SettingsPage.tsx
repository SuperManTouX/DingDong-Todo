import React from 'react';
import { Card, Divider, Switch, Select, Input, Button, Typography } from 'antd';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 设置页面组件
 * 提供应用的各项设置功能
 */
const SettingsPage: React.FC = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const { user } = useAuthStore();

  // 主题选项
  const themeOptions = [
    { value: 'light', label: '浅色主题' },
    { value: 'dark', label: '深色主题' },
    { value: 'green', label: '绿色主题' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>设置</Title>
      
      <Card title="账户信息" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <Title level={4}>{user?.username || '用户'}</Title>
            <Paragraph>{user?.email || 'example@example.com'}</Paragraph>
          </div>
        </div>
        <Button type="primary" style={{ marginTop: '8px' }}>修改个人资料</Button>
      </Card>

      <Card title="主题设置" style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ marginRight: '16px' }}>选择主题：</span>
          <Select
            value={currentTheme}
            onChange={(value) => setTheme(value)}
            style={{ width: 120 }}
          >
            {themeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>自动切换主题</span>
          <Switch />
        </div>
      </Card>

      <Card title="通知设置" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span>启用桌面通知</span>
          <Switch />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>每日提醒</span>
          <Switch />
        </div>
      </Card>

      <Card title="反馈">
        <TextArea rows={4} placeholder="请输入您的建议或问题..." />
        <Button type="primary" style={{ marginTop: '16px' }}>提交反馈</Button>
      </Card>
    </div>
  );
};

export default SettingsPage;