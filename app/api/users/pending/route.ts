import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, username, role, status, created_at
       FROM system_users
       WHERE status = 'pending'
       ORDER BY created_at DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('获取待审批用户列表失败:', error);
    return NextResponse.json(
      { error: '获取待审批用户列表失败' },
      { status: 500 }
    );
  }
} 