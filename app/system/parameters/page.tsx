'use client';

import { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Card, message, Space, Switch } from 'antd';
import MainLayout from '@/app/components/Layout';

interface SystemParameters {
  maxConnections: number;
  idleTimeout: number;
  statementTimeout: number;
  enableLogging: boolean;
  logLevel: string;
  cacheSize: number;
  maxQueryTime: number;
}

export default function SystemParametersPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchParameters = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system/parameters');
      if (response.ok) {
        const data = await response.json();
        form.setFieldsValue(data);
      } else {
        message.error('获取系统参数失败');
      }
    } catch (error) {
      message.error('获取系统参数失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  const handleSubmit = async (values: SystemParameters) => {
    setSaving(true);
    try {
      const response = await fetch('/api/system/parameters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('保存参数成功');
      } else {
        message.error('保存参数失败');
      }
    } catch (error) {
      message.error('保存参数失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <Card title="系统参数配置" loading={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="maxConnections"
              label="最大连接数"
              rules={[{ required: true, message: '请输入最大连接数' }]}
            >
              <InputNumber min={1} max={1000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="idleTimeout"
              label="空闲超时时间（秒）"
              rules={[{ required: true, message: '请输入空闲超时时间' }]}
            >
              <InputNumber min={1} max={3600} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="statementTimeout"
              label="语句超时时间（秒）"
              rules={[{ required: true, message: '请输入语句超时时间' }]}
            >
              <InputNumber min={1} max={3600} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="enableLogging"
              label="启用日志"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="logLevel"
              label="日志级别"
              rules={[{ required: true, message: '请选择日志级别' }]}
            >
              <select className="w-full p-2 border rounded">
                <option value="debug">调试</option>
                <option value="info">信息</option>
                <option value="warning">警告</option>
                <option value="error">错误</option>
              </select>
            </Form.Item>

            <Form.Item
              name="cacheSize"
              label="缓存大小（MB）"
              rules={[{ required: true, message: '请输入缓存大小' }]}
            >
              <InputNumber min={1} max={1024} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="maxQueryTime"
              label="最大查询时间（秒）"
              rules={[{ required: true, message: '请输入最大查询时间' }]}
            >
              <InputNumber min={1} max={3600} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  保存参数
                </Button>
                <Button onClick={() => form.resetFields()}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
} 