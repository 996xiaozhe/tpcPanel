'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import MainLayout from '@/app/components/Layout';

const { Option } = Select;

interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => role === 'admin' ? '系统管理员' : '普通用户',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: { [key: string]: { text: string; color: string } } = {
          active: { text: '已激活', color: 'green' },
          pending: { text: '待审核', color: 'orange' },
          disabled: { text: '已禁用', color: 'red' },
        };
        return (
          <span style={{ color: statusMap[status]?.color }}>
            {statusMap[status]?.text}
          </span>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        message.error('获取用户列表失败');
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleDelete = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        message.success('删除用户成功');
        fetchUsers();
      } else {
        message.error('删除用户失败');
      }
    } catch (error) {
      message.error('删除用户失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingUser
        ? `/api/users/${editingUser.id}`
        : '/api/users';
      
      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(editingUser ? '更新用户成功' : '创建用户成功');
        setModalVisible(false);
        fetchUsers();
      } else {
        message.error(editingUser ? '更新用户失败' : '创建用户失败');
      }
    } catch (error) {
      message.error(editingUser ? '更新用户失败' : '创建用户失败');
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加用户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
        />

        <Modal
          title={editingUser ? '编辑用户' : '添加用户'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input />
            </Form.Item>

            {!editingUser && (
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password />
              </Form.Item>
            )}

            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select>
                <Option value="admin">系统管理员</Option>
                <Option value="user">普通用户</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Option value="active">已激活</Option>
                <Option value="pending">待审核</Option>
                <Option value="disabled">已禁用</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingUser ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
} 