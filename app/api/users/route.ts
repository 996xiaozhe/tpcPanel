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

// 获取用户列表
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, username, role, status, created_at FROM system_users ORDER BY id'
    );

    return NextResponse.json({
      users: result.rows,
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// 添加新用户
export async function POST(request: Request) {
  try {
    const { username, password, role } = await request.json();

    // 检查用户名是否已存在
    const existingUser = await pool.query(
      'SELECT id FROM system_users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 409 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const result = await pool.query(
      `INSERT INTO system_users (username, password, role, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, username, role, status, created_at`,
      [username, hashedPassword, role]
    );

    return NextResponse.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error('添加用户失败:', error);
    return NextResponse.json(
      { error: '添加用户失败' },
      { status: 500 }
    );
  }
}

// 更新用户信息
export async function PUT(request: Request) {
  try {
    const { id, username, role, status } = await request.json();

    const result = await pool.query(
      `UPDATE system_users
       SET username = $1, role = $2, status = $3
       WHERE id = $4
       RETURNING id, username, role, status`,
      [username, role, status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({
      message: '更新用户成功',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json(
      { error: '更新用户失败' },
      { status: 500 }
    );
  }
}

// 删除用户
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    const result = await pool.query(
      'DELETE FROM system_users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '删除用户成功',
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    );
  }
} 