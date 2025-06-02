'use client';

import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Space } from 'antd';
import MainLayout from '@/app/components/Layout';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  connectionTimeout: number;
  bufferSize: number;
}

export default function DatabaseConfigPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system/database-config');
      if (response.ok) {
        const data = await response.json();
        form.setFieldsValue(data);
      } else {
        message.error('获取数据库配置失败');
      }
    } catch (error) {
      message.error('获取数据库配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (values: DatabaseConfig) => {
    setSaving(true);
    try {
      const response = await fetch('/api/system/database-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('保存配置成功');
      } else {
        message.error('保存配置失败');
      }
    } catch (error) {
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      const response = await fetch('/api/system/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('数据库连接测试成功');
      } else {
        message.error('数据库连接测试失败');
      }
    } catch (error) {
      message.error('请先填写完整的配置信息');
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <Card title="数据库配置" loading={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="host"
              label="主机地址"
              rules={[{ required: true, message: '请输入主机地址' }]}
            >
              <Input placeholder="localhost" />
            </Form.Item>

            <Form.Item
              name="port"
              label="端口"
              rules={[{ required: true, message: '请输入端口号' }]}
            >
              <InputNumber min={1} max={65535} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="database"
              label="数据库名"
              rules={[{ required: true, message: '请输入数据库名' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              name="connectionTimeout"
              label="连接超时时间（秒）"
              rules={[{ required: true, message: '请输入连接超时时间' }]}
            >
              <InputNumber min={1} max={300} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="bufferSize"
              label="缓冲区大小（MB）"
              rules={[{ required: true, message: '请输入缓冲区大小' }]}
            >
              <InputNumber min={1} max={1024} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  保存配置
                </Button>
                <Button onClick={handleTestConnection}>
                  测试连接
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
} 