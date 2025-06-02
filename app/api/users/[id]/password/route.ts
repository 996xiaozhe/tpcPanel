import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 验证 token
    const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };

    // 检查当前用户是否为管理员
    const adminResult = await pool.query(
      'SELECT role FROM system_users WHERE id = $1',
      [decoded.userId]
    );

    if (adminResult.rows.length === 0 || adminResult.rows[0].role !== 'admin') {
      return NextResponse.json(
        { error: '无权限执行此操作' },
        { status: 403 }
      );
    }

    // 获取请求数据
    const { newPassword } = await request.json();
    const { id } = await params;
    const userId = parseInt(id);

    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度不能少于6个字符' },
        { status: 400 }
      );
    }

    // 检查目标用户是否存在
    const userResult = await pool.query(
      'SELECT id FROM system_users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.query(
      'UPDATE system_users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    return NextResponse.json({
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json(
      { error: '修改密码失败' },
      { status: 500 }
    );
  }
} 