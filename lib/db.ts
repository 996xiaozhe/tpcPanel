import { neon } from "@neondatabase/serverless"
import { Pool } from "pg"
import fs from "fs/promises"
import path from "path"

// 数据库配置文件路径
const CONFIG_FILE = path.join(process.cwd(), "config", "database.json")

// 读取数据库配置
async function getDbConfig() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, "utf-8")
    return JSON.parse(configData)
  } catch {
    // 如果配置文件不存在，使用环境变量
    return {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "tpc_db",
      username: process.env.DB_USER || "tpc_user",
      password: process.env.DB_PASSWORD || "tpc_password"
    }
  }
}

// 创建数据库连接
let sql: any

async function initDb() {
  const config = await getDbConfig()
  const isNeon = process.env.DB_TYPE === "neon"

  if (isNeon) {
    // Neon 数据库连接
    sql = neon(process.env.DATABASE_URL!)
  } else {
    // 普通 PostgreSQL 连接
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      // 设置默认搜索路径
      options: `-c search_path=tpc,public`
    })
    
    // 包装 pool 以匹配 neon 的接口
    sql = {
      query: async (text: string, params: any[]) => {
        const result = await pool.query(text, params)
        return {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields
        }
      },
      // 为了支持 tagged template literals
      [Symbol.for("tag")]: async (strings: TemplateStringsArray, ...values: any[]) => {
        const query = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? `$${i + 1}` : ""), "")
        const result = await pool.query(query, values)
        return {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields
        }
      }
    }
  }
}

// 初始化数据库连接
initDb().catch(console.error)

export { sql }

// 执行查询并测量时间
export async function executeQueryWithTiming(query: string, params: any[] = []) {
  const startTime = Date.now()
  try {
    // 统一使用 sql.query 方法
    const result = await sql.query(query, params)
    const endTime = Date.now()

    // 确保返回正确的数据结构
    console.log("查询执行结果:", {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields
    })

    return {
      data: {
        rows: result.rows || [],
        rowCount: result.rowCount,
        fields: result.fields
      },
      executionTime: endTime - startTime,
      success: true,
    }
  } catch (error) {
    const endTime = Date.now()
    console.error("查询执行错误:", error)
    return {
      error: error instanceof Error ? error.message : String(error),
      executionTime: endTime - startTime,
      success: false,
      data: {
        rows: [],
        rowCount: 0,
        fields: []
      }
    }
  }
}

// 专门用于批量插入的函数
export async function executeBatchInsert(table: string, fields: string[], values: any[][]) {
  try {
    // 构建VALUES子句
    const valuesClause = values
      .map((row, rowIndex) => {
        const placeholders = fields.map((_, colIndex) => `$${rowIndex * fields.length + colIndex + 1}`).join(", ")
        return `(${placeholders})`
      })
      .join(", ")

    // 展平所有值
    const flatValues = values.flat()

    // 构建完整的查询
    const query = `INSERT INTO ${table} (${fields.join(", ")}) VALUES ${valuesClause} ON CONFLICT DO NOTHING`

    // 使用sql.query执行
    const result = await sql.query(query, flatValues)
    return { success: true, result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// 专门用于单行插入的函数
export async function executeSingleInsert(table: string, fields: string[], values: any[]) {
  try {
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ")
    const query = `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`

    const result = await sql.query(query, values)
    return { success: true, result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
