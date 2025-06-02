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

export async function POST(request: Request) {
  try {
    // 获取当前用户信息
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

    // 获取请求数据
    const { currentPassword, newPassword } = await request.json();

    // 获取用户当前密码
    const result = await pool.query(
      'SELECT password FROM system_users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isValid) {
      return NextResponse.json(
        { error: '当前密码错误' },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.query(
      'UPDATE system_users SET password = $1 WHERE id = $2',
      [hashedPassword, decoded.userId]
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