'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const values = {
      username: formData.get('username'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      role: formData.get('role'),
    };

    try {
      if (isLogin) {
        console.log('开始登录请求...');
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        
        console.log('收到响应:', response.status);
        const data = await response.json();
        console.log('响应数据:', data);
        
        if (response.ok) {
          console.log('登录成功，准备跳转...');
          // 存储token
          document.cookie = `token=${data.token}; path=/`;
          // 重定向到首页
          router.push('/');
        } else {
          let errorMsg = '';
          switch (response.status) {
            case 401:
              errorMsg = '用户名或密码错误，请检查后重试';
              break;
            case 403:
              errorMsg = '账号未激活或已被禁用，请联系管理员';
              break;
            default:
              errorMsg = data.error || '登录失败，请稍后重试';
          }
          setErrorMessage(errorMsg);
          console.error('登录失败:', response.status, data);
        }
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setIsLogin(true);
          setErrorMessage('注册成功，请等待管理员审核');
        } else {
          let errorMsg = '';
          switch (response.status) {
            case 400:
              errorMsg = data.error || '注册信息无效，请检查后重试';
              break;
            case 409:
              errorMsg = '用户名已存在，请更换用户名';
              break;
            default:
              errorMsg = data.error || '注册失败，请稍后重试';
          }
          setErrorMessage(errorMsg);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      setErrorMessage('操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="container max-w-md mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center text-white">
                <User className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              {isLogin ? '用户登录' : '用户注册'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin ? '欢迎回来，请登录您的账号' : '创建新账号，开始使用系统'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="请输入用户名"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="请输入密码"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="请再次输入密码"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">用户类型</Label>
                    <select
                      id="role"
                      name="role"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      required
                    >
                      <option value="user">普通用户</option>
                    </select>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-600"
                disabled={loading}
              >
                {loading ? '处理中...' : isLogin ? '登录' : '注册'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrorMessage('');
                  }}
                >
                  {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 