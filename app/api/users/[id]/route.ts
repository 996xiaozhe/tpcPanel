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

export async function DELETE(
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

    // 获取用户ID
    const { id } = await params;
    const userId = parseInt(id);

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

    // 不允许删除自己
    if (userId === decoded.userId) {
      return NextResponse.json(
        { error: '不能删除当前登录的用户' },
        { status: 400 }
      );
    }

    // 删除用户
    await pool.query(
      'DELETE FROM system_users WHERE id = $1',
      [userId]
    );

    return NextResponse.json({
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    );
  }
} 