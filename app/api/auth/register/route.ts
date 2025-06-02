import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

export async function POST(request: Request) {
  try {
    const { username, password, role } = await request.json();

    // 检查用户名是否已存在
    const existingUser = await pool.query(
      'SELECT * FROM system_users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const result = await pool.query(
      `INSERT INTO system_users (username, password, role, status, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING id, username, role, status`,
      [username, hashedPassword, role, 'pending']
    );

    const newUser = result.rows[0];

    return NextResponse.json({
      message: '注册成功，请等待管理员审核',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
} 