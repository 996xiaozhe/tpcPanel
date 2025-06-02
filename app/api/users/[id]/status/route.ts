import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const { id } = await params;
    const userId = parseInt(id);

    // 验证状态值
    if (!['active', 'pending', 'disabled'].includes(status)) {
      return NextResponse.json(
        { error: '无效的状态值' },
        { status: 400 }
      );
    }

    // 更新用户状态
    const result = await pool.query(
      `UPDATE system_users 
       SET status = $1
       WHERE id = $2
       RETURNING id, username, role, status, created_at`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    return NextResponse.json(
      { error: '更新用户状态失败' },
      { status: 500 }
    );
  }
} 