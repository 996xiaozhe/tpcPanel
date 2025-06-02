import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
})

// 验证搜索词
function validateSearchTerm(term: string | null): { isValid: boolean; error?: string } {
  if (!term) {
    return { isValid: false, error: "缺少搜索条件" }
  }

  if (term.length < 2) {
    return { isValid: false, error: "搜索词至少需要2个字符" }
  }

  if (term.length > 50) {
    return { isValid: false, error: "搜索词不能超过50个字符" }
  }

  // 检查是否包含SQL注入风险的特殊字符
  const sqlInjectionPattern = /[;'"\\]/g
  if (sqlInjectionPattern.test(term)) {
    return { isValid: false, error: "搜索词包含无效字符" }
  }

  return { isValid: true }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const term = searchParams.get('term')

  if (!term) {
    return NextResponse.json({ error: '搜索词不能为空' }, { status: 400 })
  }

  try {
    const validation = validateSearchTerm(term)

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const query = `
      SELECT 
        c.c_custkey,
        c.c_name,
        c.c_address,
        c.c_phone,
        c.c_acctbal,
        c.c_mktsegment,
        c.c_comment,
        n.n_name
      FROM tpc.customer c
      LEFT JOIN tpc.nation n ON c.c_nationkey = n.n_nationkey
      WHERE 
        c.c_name ILIKE $1 OR 
        n.n_name ILIKE $1
      ORDER BY c.c_custkey
      LIMIT 100
    `

    const result = await pool.query(query, [`%${term}%`])
    
    return NextResponse.json({
      success: true,
      rows: result.rows
    })
  } catch (error) {
    console.error('数据库查询错误:', error)
    return NextResponse.json(
      { error: '查询失败，请稍后重试' },
      { status: 500 }
    )
  }
}
