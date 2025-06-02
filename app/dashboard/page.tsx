'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Users, Database, LayoutDashboard, Settings, ArrowLeft, Key } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DashboardPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    // 获取用户信息
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        router.push('/login');
      }
    };

    fetchUserInfo();
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    
    // 验证新密码
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密码长度不能少于6个字符');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsChangePasswordOpen(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        alert('密码修改成功');
      } else {
        setPasswordError(data.error || '修改密码失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      setPasswordError('修改密码失败，请稍后重试');
    }
  };

  if (!userInfo) {
    return <div>加载中...</div>;
  }

  const adminModules = [
    {
      title: "用户管理",
      description: "管理系统用户账号和权限",
      icon: <Users className="h-8 w-8" />,
      href: "/user-management",
      color: "bg-blue-500",
    },
    {
      title: "数据库配置",
      description: "配置数据库连接参数",
      icon: <Database className="h-8 w-8" />,
      href: "/database-config",
      color: "bg-green-500",
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回主页
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">仪表板</h1>
            <p className="text-xl text-gray-600">
              欢迎回来，{userInfo.username}
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            退出登录
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center text-white mb-4">
                <LayoutDashboard className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl">用户信息</CardTitle>
              <CardDescription className="text-gray-600">
                当前用户角色：{userInfo.role === 'admin' ? '管理员' : '普通用户'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    修改密码
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>修改密码</DialogTitle>
                    <DialogDescription>
                      请输入当前密码和新密码
                    </DialogDescription>
                  </DialogHeader>
                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="currentPassword">当前密码</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value
                        })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">新密码</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value
                        })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">确认新密码</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleChangePassword}>
                      确认修改
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {userInfo.role === 'admin' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">管理员功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminModules.map((module, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div
                      className={`w-16 h-16 ${module.color} rounded-lg flex items-center justify-center text-white mb-4`}
                    >
                      {module.icon}
                    </div>
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                    <CardDescription className="text-gray-600">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full"
                      onClick={() => router.push(module.href)}
                    >
                      进入模块
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">系统状态</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">数据库连接</h3>
              <p className="text-sm text-gray-600">正常运行中</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">用户管理</h3>
              <p className="text-sm text-gray-600">系统正常运行</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">系统设置</h3>
              <p className="text-sm text-gray-600">配置正常</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <LayoutDashboard className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900">系统监控</h3>
              <p className="text-sm text-gray-600">运行正常</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 