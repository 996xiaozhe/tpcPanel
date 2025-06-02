'use client';

import { useState } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import {
  UserOutlined,
  DatabaseOutlined,
  SettingOutlined,
  SearchOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        { key: '/system/database', label: '数据库配置' },
        { key: '/system/parameters', label: '系统参数' },
      ],
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: '用户管理',
      children: [
        { key: '/users/list', label: '用户列表' },
        { key: '/users/approve', label: '用户审批' },
      ],
    },
    {
      key: 'data',
      icon: <DatabaseOutlined />,
      label: '数据管理',
      children: [
        { key: '/data/import', label: '数据导入' },
        { key: '/data/export', label: '数据导出' },
      ],
    },
    {
      key: 'query',
      icon: <SearchOutlined />,
      label: '业务查询',
      children: [
        { key: '/query/customer', label: '客户查询' },
        { key: '/query/order', label: '订单查询' },
      ],
    },
    {
      key: 'analysis',
      icon: <BarChartOutlined />,
      label: '业务分析',
      children: [
        { key: '/analysis/performance', label: '性能分析' },
        { key: '/analysis/statistics', label: '统计分析' },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="h-8 m-4 bg-white/10" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
} 