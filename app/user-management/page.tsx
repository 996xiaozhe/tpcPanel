'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Key, Trash2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
  });
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setIsAddUserOpen(false);
        setNewUser({ username: '', password: '', role: 'user' });
        fetchUsers();
      }
    } catch (error) {
      console.error('添加用户失败:', error);
    }
  };

  const handleUpdateStatus = async (userId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        setNewPassword('');
        setErrorMessage('');
        alert('密码修改成功');
      } else {
        const data = await response.json();
        setErrorMessage(data.error || '修改密码失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      setErrorMessage('修改密码失败，请稍后重试');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    if (!confirm(`确定要删除用户 ${selectedUser.username} 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsUserDetailOpen(false);
        fetchUsers();
      } else {
        const data = await response.json();
        setErrorMessage(data.error || '删除用户失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      setErrorMessage('删除用户失败，请稍后重试');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
          <Link href="/dashboard">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">用户管理</h1>
            <p className="text-xl text-gray-600">
              管理系统用户账号和权限
            </p>
          </div>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加用户
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新用户</DialogTitle>
                <DialogDescription>
                  创建新的系统用户账号
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    用户名
                  </Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    密码
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    角色
                  </Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">普通用户</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAddUser}>
                  添加
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-500" />
                <CardTitle>用户列表</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="搜索用户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
            <CardDescription>
              管理系统中的所有用户账号
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      没有找到用户
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.status}
                          onValueChange={(value) => handleUpdateStatus(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">激活</SelectItem>
                            <SelectItem value="pending">待审核</SelectItem>
                            <SelectItem value="disabled">禁用</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsUserDetailOpen(true);
                            setErrorMessage('');
                            setNewPassword('');
                          }}
                        >
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>用户详情</DialogTitle>
              <DialogDescription>
                管理用户 {selectedUser?.username} 的账号信息
              </DialogDescription>
            </DialogHeader>
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>用户ID</Label>
                <Input value={selectedUser?.id} disabled />
              </div>
              <div className="grid gap-2">
                <Label>用户名</Label>
                <Input value={selectedUser?.username} disabled />
              </div>
              <div className="grid gap-2">
                <Label>角色</Label>
                <Input value={selectedUser?.role === 'admin' ? '管理员' : '普通用户'} disabled />
              </div>
              <div className="grid gap-2">
                <Label>状态</Label>
                <Input value={selectedUser?.status} disabled />
              </div>
              <div className="grid gap-2">
                <Label>创建时间</Label>
                <Input value={new Date(selectedUser?.created_at || '').toLocaleString()} disabled />
              </div>
              <div className="grid gap-2">
                <Label>新密码</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码"
                  />
                  <Button onClick={handleChangePassword}>
                    <Key className="h-4 w-4 mr-2" />
                    修改密码
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDeleteUser}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除用户
              </Button>
              <Button variant="outline" onClick={() => setIsUserDetailOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 