import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') || '10'

  try {
    const query = `
      SELECT DISTINCT c_name
      FROM tpc.customer
      ORDER BY c_name
      LIMIT $1
    `

    const result = await pool.query(query, [limit])
    
    return NextResponse.json({
      success: true,
      data: result.rows.map(row => row.c_name)
    })
  } catch (error) {
    console.error('数据库查询错误:', error)
    return NextResponse.json(
      { error: '获取客户列表失败，请稍后重试' },
      { status: 500 }
    )
  }
}
