import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // 执行一个简单的查询来测试连接
    const result = await sql`SELECT 1 as test`
    
    return NextResponse.json({
      success: true,
      message: "数据库连接成功",
      data: result
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "数据库连接失败",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 