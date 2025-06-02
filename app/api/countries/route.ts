import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
})

export async function GET() {
  try {
    const query = `
      SELECT DISTINCT n_name
      FROM tpc.nation
      ORDER BY n_name
    `

    const result = await pool.query(query)
    
    return NextResponse.json({
      success: true,
      data: result.rows.map(row => row.n_name)
    })
  } catch (error) {
    console.error('数据库查询错误:', error)
    return NextResponse.json(
      { error: '获取国家列表失败，请稍后重试' },
      { status: 500 }
    )
  }
}
