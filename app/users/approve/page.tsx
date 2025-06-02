'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Modal } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import MainLayout from '@/app/components/Layout';

interface PendingUser {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  status: string;
}

export default function UserApprovePage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);

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
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: { [key: string]: { text: string; color: string } } = {
          pending: { text: '待审核', color: 'orange' },
          approved: { text: '已通过', color: 'green' },
          rejected: { text: '已拒绝', color: 'red' },
        };
        return (
          <span style={{ color: statusMap[status]?.color }}>
            {statusMap[status]?.text}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PendingUser) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/pending');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        message.error('获取待审批用户列表失败');
      }
    } catch (error) {
      message.error('获取待审批用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (user: PendingUser) => {
    try {
      const response = await fetch(`/api/users/${user.id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        message.success('审批通过成功');
        fetchPendingUsers();
      } else {
        message.error('审批通过失败');
      }
    } catch (error) {
      message.error('审批通过失败');
    }
  };

  const handleReject = async (user: PendingUser) => {
    Modal.confirm({
      title: '确认拒绝',
      content: `确定要拒绝用户 ${user.username} 的注册申请吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/users/${user.id}/reject`, {
            method: 'POST',
          });

          if (response.ok) {
            message.success('已拒绝该用户的注册申请');
            fetchPendingUsers();
          } else {
            message.error('操作失败');
          }
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  return (
    <MainLayout>
      <div className="p-6">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
        />
      </div>
    </MainLayout>
  );
} 