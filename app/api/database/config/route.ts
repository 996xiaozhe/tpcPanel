import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { Pool } from "pg"
import jwt from "jsonwebtoken"
import fs from "fs/promises"
import path from "path"

// 数据库配置文件路径
const CONFIG_FILE = path.join(process.cwd(), "config", "database.json")

// 确保配置目录存在
async function ensureConfigDir() {
  const configDir = path.join(process.cwd(), "config")
  try {
    await fs.access(configDir)
  } catch {
    await fs.mkdir(configDir)
  }
}

// 读取数据库配置
async function readConfig() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, "utf-8")
    return JSON.parse(configData)
  } catch {
    // 如果配置文件不存在，返回默认配置
    return {
      host: "localhost",
      port: 5432,
      database: "tpc_db",
      username: "tpc_user",
      password: "tpc_password"
    }
  }
}

// 保存数据库配置
async function saveConfig(config: any) {
  await ensureConfigDir()
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
}

// 验证管理员权限
async function validateAdmin() {
  const token = cookies().get("token")?.value
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

// 获取数据库配置
export async function GET() {
  try {
    // 验证管理员权限
    const isAdmin = await validateAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const config = await readConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error("获取数据库配置失败:", error)
    return NextResponse.json({ error: "获取配置失败" }, { status: 500 })
  }
}

// 保存数据库配置
export async function POST(request: Request) {
  try {
    // 验证管理员权限
    const isAdmin = await validateAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "无权限修改" }, { status: 403 })
    }

    const config = await request.json()

    // 验证配置参数
    if (!config.host || !config.port || !config.database || !config.username || !config.password) {
      return NextResponse.json({ error: "配置参数不完整" }, { status: 400 })
    }

    // 保存配置
    await saveConfig(config)

    return NextResponse.json({ message: "配置已保存" })
  } catch (error) {
    console.error("保存数据库配置失败:", error)
    return NextResponse.json({ error: "保存配置失败" }, { status: 500 })
  }
} 