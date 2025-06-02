import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 创建响应对象
    const response = NextResponse.json({
      message: '退出登录成功',
    });

    // 清除 cookie
    response.cookies.set({
      name: 'token',
      value: '',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('退出登录失败:', error);
    return NextResponse.json(
      { error: '退出登录失败' },
      { status: 500 }
    );
  }
} 