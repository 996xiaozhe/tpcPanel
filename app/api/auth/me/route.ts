import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  try {
    // 获取 token
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

    // 获取用户信息
    const result = await pool.query(
      'SELECT id, username, role, status FROM system_users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: '账号未激活或已被禁用' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
} 