import { Menu } from "antd";
import type { MenuProps } from "antd";
import { AppstoreOutlined, PieChartOutlined, SettingOutlined } from "@ant-design/icons";


/**
 * 侧边菜单组件
 * 使用antd的Menu组件实现
 */
export default function SideMenu() {
  // 菜单项配置
  const items: MenuProps['items'] = [
    {
      key: '1',
      icon: <PieChartOutlined />,
      label: '任务概览',
    },
    {
      key: '2',
      icon: <AppstoreOutlined />,
      label: '待办任务',
      children: [
        {
          key: '2-1',
          label: '全部任务',
        },
        {
          key: '2-2',
          label: '今日任务',
        },
        {
          key: '2-3',
          label: '已完成',
        },
        {
          key: '2-4',
          label: '已逾期',
        },
      ],
    },
    {
      key: '3',
      icon: <SettingOutlined />,
      label: '设置',
      children: [
        {
          key: '3-1',
          label: '个人设置',
        },
        {
          key: '3-2',
          label: '系统设置',
        },
      ],
    },
  ];

  // 菜单项点击处理函数
  const handleClick: MenuProps['onClick'] = (e) => {
    console.log('点击菜单项:', e.key);
    // 这里可以添加菜单点击后的逻辑
  };

  return (
    <Menu
      onClick={handleClick}
      style={{ width: '100%', height: '100%' }}
      defaultSelectedKeys={['2']}
      defaultOpenKeys={['2']}
      mode="inline"
      items={items}
    />
  );
}