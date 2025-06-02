import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// 不需要验证的路由
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是公开路由
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // 获取 token
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // 如果是 API 请求，返回 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    // 如果是页面请求，重定向到登录页
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 验证 token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    // token 无效，清除 cookie 并重定向到登录页
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

// 配置需要进行中间件检查的路由
export const config = {
  matcher: [
    /*
     * 匹配所有路由除了：
     * 1. /api/auth/* (登录和注册接口)
     * 2. /login (登录页面)
     * 3. /_next/* (Next.js 内部路由)
     * 4. /favicon.ico, /sitemap.xml (静态文件)
     */
    '/((?!api/auth|login|_next|favicon.ico|sitemap.xml).*)',
  ],
}; 