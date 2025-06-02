import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { Pool } from "pg"
import jwt from "jsonwebtoken"

// 验证管理员权限
async function validateAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  if (!token) {
    return false
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    return decoded.role === "admin"
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    // 验证管理员权限
    const isAdmin = await validateAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "无权限操作" }, { status: 403 })
    }

    const config = await request.json()

    // 验证配置参数
    if (!config.host || !config.port || !config.database || !config.username || !config.password) {
      return NextResponse.json({ error: "配置参数不完整" }, { status: 400 })
    }

    // 创建数据库连接池
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
    })

    try {
      // 测试连接
      const client = await pool.connect()
      await client.query("SELECT 1")
      client.release()
      await pool.end()

      return NextResponse.json({ message: "数据库连接成功" })
    } catch (error) {
      return NextResponse.json(
        { error: `数据库连接失败: ${error instanceof Error ? error.message : String(error)}` },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("测试数据库连接失败:", error)
    return NextResponse.json({ error: "测试连接失败" }, { status: 500 })
  }
} 