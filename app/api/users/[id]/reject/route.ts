import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await pool.query(
      `UPDATE system_users
       SET status = 'rejected'
       WHERE id = $1 AND status = 'pending'
       RETURNING id, username, role, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在或状态不是待审批' },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({
      message: '已拒绝该用户的注册申请',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('拒绝用户失败:', error);
    return NextResponse.json(
      { error: '拒绝用户失败' },
      { status: 500 }
    );
  }
} 