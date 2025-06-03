# globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

```

# api/customers/names/route.ts

```typescript
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

```

# api/customers/search/route.ts

```typescript
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

```

# api/customers/filter/route.ts

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { executeQueryWithTiming } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const customerName = request.nextUrl.searchParams.get("name")
    const countryName = request.nextUrl.searchParams.get("country")

    if (!customerName && !countryName) {
      return NextResponse.json({ error: "缺少筛选条件" }, { status: 400 })
    }

    let query = `
      SELECT c.*, n.n_name
      FROM tpc.customer c
      LEFT JOIN tpc.nation n ON c.c_nationkey = n.n_nationkey
      WHERE 1=1
    `

    const params: string[] = []

    if (customerName) {
      params.push(customerName)
      query += ` AND c.c_name = $${params.length}`
    }

    if (countryName) {
      params.push(countryName)
      query += ` AND n.n_name = $${params.length}`
    }

    query += ` ORDER BY c.c_custkey LIMIT 100`

    const result = await executeQueryWithTiming(query, params)

    if (result.success) {
      return NextResponse.json(result.data)
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: `查询出错: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

```

# api/import-data/route.ts

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// 数据清洗规则
const dataValidationRules = {
  orders: {
    fields: [
      "o_orderkey",
      "o_custkey",
      "o_orderstatus",
      "o_totalprice",
      "o_orderdate",
      "o_orderpriority",
      "o_clerk",
      "o_shippriority",
      "o_comment",
    ],
    validations: {
      o_orderkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "订单ID必须为正整数"
        return null
      },
      o_custkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "客户ID必须为正整数"
        return null
      },
      o_totalprice: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num <= 0) return "订单总价必须为正数"
        return null
      },
      o_orderdate: (value: string) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(value)) return "订单日期格式无效，应为YYYY-MM-DD"
        return null
      },
    },
  },
  partsupp: {
    fields: ["ps_partkey", "ps_suppkey", "ps_availqty", "ps_supplycost", "ps_comment"],
    validations: {
      ps_partkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "零件ID必须为正整数"
        return null
      },
      ps_suppkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "供应商ID必须为正整数"
        return null
      },
      ps_availqty: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num < 0) return "零件供应数量必须为非负整数"
        return null
      },
      ps_supplycost: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num <= 0) return "供应成本必须为正数"
        return null
      },
    },
  },
  lineitem: {
    fields: [
      "l_orderkey",
      "l_partkey",
      "l_suppkey",
      "l_linenumber",
      "l_quantity",
      "l_extendedprice",
      "l_discount",
      "l_tax",
      "l_returnflag",
      "l_linestatus",
      "l_shipdate",
      "l_commitdate",
      "l_receiptdate",
      "l_shipinstruct",
      "l_shipmode",
      "l_comment",
    ],
    validations: {
      l_orderkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "订单ID必须为正整数"
        return null
      },
      l_quantity: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num <= 0) return "数量必须为正数"
        return null
      },
      l_discount: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num < 0 || num > 1) return "折扣必须在0到1之间"
        return null
      },
      l_tax: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num < 0) return "税率必须为非负数"
        return null
      },
    },
  },
  customer: {
    fields: ["c_custkey", "c_name", "c_address", "c_nationkey", "c_phone", "c_acctbal", "c_mktsegment", "c_comment"],
    validations: {
      c_custkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "客户ID必须为正整数"
        return null
      },
      c_acctbal: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num)) return "账户余额必须为数值"
        return null
      },
    },
  },
  part: {
    fields: [
      "p_partkey",
      "p_name",
      "p_mfgr",
      "p_brand",
      "p_type",
      "p_size",
      "p_container",
      "p_retailprice",
      "p_comment",
    ],
    validations: {
      p_partkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "零件ID必须为正整数"
        return null
      },
      p_size: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "尺寸必须为正整数"
        return null
      },
      p_retailprice: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num <= 0) return "零售价必须为正数"
        return null
      },
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const table = formData.get("table") as string
    const delimiter = (formData.get("delimiter") as string) || "|"

    if (!file || !table) {
      return NextResponse.json({ error: "缺少文件或表名" }, { status: 400 })
    }

    // 检查表是否受支持
    if (!dataValidationRules[table as keyof typeof dataValidationRules]) {
      return NextResponse.json({ error: "不支持的表名" }, { status: 400 })
    }

    // 读取文件内容
    const fileContent = await file.text()
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "")

    const { fields, validations } = dataValidationRules[table as keyof typeof dataValidationRules]

    // 导入日志
    const importLog = {
      totalRows: lines.length,
      importedRows: 0,
      failedRows: 0,
      errors: [] as Array<{ line: number; reason: string; data: string }>,
      success: true,
    }

    // 批量处理，每批100行
    const batchSize = 100
    const batches = Math.ceil(lines.length / batchSize)

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const batchStart = batchIndex * batchSize
      const batchEnd = Math.min((batchIndex + 1) * batchSize, lines.length)
      const batch = lines.slice(batchStart, batchEnd)

      const validRows = []

      // 验证每一行数据
      for (let i = 0; i < batch.length; i++) {
        const lineNumber = batchStart + i + 1
        const line = batch[i].trim()
        if (!line) continue

        const values = line.split(delimiter)

        // 检查字段数量
        if (values.length !== fields.length) {
          importLog.errors.push({
            line: lineNumber,
            reason: `字段数量不匹配，期望 ${fields.length} 个字段，实际 ${values.length} 个字段`,
            data: line,
          })
          importLog.failedRows++
          continue
        }

        // 验证每个字段
        let isValid = true
        for (let j = 0; j < fields.length; j++) {
          const field = fields[j]
          const value = values[j]

          // 检查空值
          if (!value && value !== "0") {
            importLog.errors.push({
              line: lineNumber,
              reason: `字段 ${field} 不能为空`,
              data: line,
            })
            isValid = false
            break
          }

          // 应用验证规则
          const validationFn = validations[field as keyof typeof validations]
          if (validationFn) {
            const error = validationFn(value)
            if (error) {
              importLog.errors.push({
                line: lineNumber,
                reason: `字段 ${field} 验证失败: ${error}`,
                data: line,
              })
              isValid = false
              break
            }
          }
        }

        if (isValid) {
          validRows.push(values)
        } else {
          importLog.failedRows++
        }
      }

      // 如果有有效行，插入数据库
      if (validRows.length > 0) {
        try {
          // 构建插入语句
          const placeholders = validRows
            .map(
              (_, rowIndex) =>
                `(${fields.map((_, colIndex) => `$${rowIndex * fields.length + colIndex + 1}`).join(", ")})`,
            )
            .join(", ")

          const query = `
            INSERT INTO ${table} (${fields.join(", ")})
            VALUES ${placeholders}
          `

          // 展平所有值为一维数组
          const flatValues = validRows.flat()

          // 执行插入
          await sql(query, flatValues)

          importLog.importedRows += validRows.length
        } catch (error) {
          console.error("数据库插入错误:", error)

          // 将整批标记为失败
          importLog.failedRows += validRows.length
          validRows.forEach((row, i) => {
            importLog.errors.push({
              line: batchStart + i + 1,
              reason: `数据库插入错误: ${error instanceof Error ? error.message : String(error)}`,
              data: row.join(delimiter),
            })
          })
        }
      }
    }

    importLog.success = importLog.importedRows > 0

    return NextResponse.json(importLog)
  } catch (error) {
    console.error("导入处理错误:", error)
    return NextResponse.json(
      {
        error: `导入处理错误: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

```

# api/tpc-h-concurrent/route.ts

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { executeQueryWithTiming } from "@/lib/db"

// 简化的TPC-H查询用于并发测试
const concurrentQueries = {
  Q1: `
    SELECT 
      l_returnflag,
      l_linestatus,
      COUNT(*) as count_order,
      SUM(l_quantity) as sum_qty,
      AVG(l_extendedprice) as avg_price
    FROM tpc.lineitem
    WHERE l_shipdate <= DATE '1998-12-01' - INTERVAL '90 days'
    GROUP BY l_returnflag, l_linestatus
    ORDER BY l_returnflag, l_linestatus
    LIMIT 10
  `,
  Q3: `
    SELECT 
      l_orderkey,
      SUM(l_extendedprice * (1 - l_discount)) as revenue,
      o_orderdate
    FROM tpc.customer c, tpc.orders o, tpc.lineitem l
    WHERE c_mktsegment = 'BUILDING'
      AND c.c_custkey = o.o_custkey
      AND l.l_orderkey = o.o_orderkey
      AND o_orderdate < DATE '1995-03-15'
      AND l_shipdate > DATE '1995-03-15'
    GROUP BY l_orderkey, o_orderdate
    ORDER BY revenue DESC
    LIMIT 5
  `,
  Q5: `
    SELECT 
      n.n_name,
      SUM(l_extendedprice * (1 - l_discount)) as revenue
    FROM tpc.customer c, tpc.orders o, tpc.lineitem l, tpc.supplier s, tpc.nation n, tpc.region r
    WHERE c.c_custkey = o.o_custkey
      AND l.l_orderkey = o.o_orderkey
      AND l.l_suppkey = s.s_suppkey
      AND c.c_nationkey = s.s_nationkey
      AND s.s_nationkey = n.n_nationkey
      AND n.n_regionkey = r.r_regionkey
      AND r.r_name = 'ASIA'
      AND o_orderdate >= DATE '1994-01-01'
      AND o_orderdate < DATE '1995-01-01'
    GROUP BY n.n_name
    ORDER BY revenue DESC
    LIMIT 5
  `,
}

export async function POST(request: NextRequest) {
  try {
    const { queryType, clientId } = await request.json()

    if (!queryType || !concurrentQueries[queryType as keyof typeof concurrentQueries]) {
      return NextResponse.json({ error: "无效的查询类型" }, { status: 400 })
    }

    const sql = concurrentQueries[queryType as keyof typeof concurrentQueries]
    const result = await executeQueryWithTiming(sql)

    if (result.success) {
      return NextResponse.json({
        clientId,
        queryType,
        data: result.data,
        executionTime: result.executionTime,
        rowCount: result.data.length,
        success: true,
      })
    } else {
      return NextResponse.json({
        clientId,
        queryType,
        error: result.error,
        executionTime: result.executionTime,
        success: false,
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: `并发查询执行错误: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
      },
      { status: 500 },
    )
  }
}

```

# api/database/test-connection/route.ts

```typescript
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
```

# api/database/config/route.ts

```typescript
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
```

# api/test-connection/route.ts

```typescript
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
```

# api/auth/logout/route.ts

```typescript
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 创建响应对象
    const response = NextResponse.json({
      message: '退出登录成功',
    });

    // 清除 cookie
    response.cookies.set({
      name: 'token',
      value: '',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('退出登录失败:', error);
    return NextResponse.json(
      { error: '退出登录失败' },
      { status: 500 }
    );
  }
} 
```

# api/auth/register/route.ts

```typescript
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
```

# api/auth/me/route.ts

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  try {
    // 获取 token
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 验证 token
    const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };

    // 获取用户信息
    const result = await pool.query(
      'SELECT id, username, role, status FROM system_users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: '账号未激活或已被禁用' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
} 
```

# api/auth/change-password/route.ts

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    // 获取当前用户信息
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 验证 token
    const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };

    // 获取请求数据
    const { currentPassword, newPassword } = await request.json();

    // 获取用户当前密码
    const result = await pool.query(
      'SELECT password FROM system_users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isValid) {
      return NextResponse.json(
        { error: '当前密码错误' },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.query(
      'UPDATE system_users SET password = $1 WHERE id = $2',
      [hashedPassword, decoded.userId]
    );

    return NextResponse.json({
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json(
      { error: '修改密码失败' },
      { status: 500 }
    );
  }
} 
```

# api/auth/login/route.ts

```typescript
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 从数据库查询用户
    const result = await pool.query(
      'SELECT * FROM system_users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: '账号未激活或已被禁用' },
        { status: 403 }
      );
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 创建响应对象
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    // 设置 cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 小时
    });

    return response;
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
} 
```

# api/tpc-h-query/route.ts

```typescript
import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { queryType } = await request.json()
    
    let result
    switch (queryType) {
      case 'Q1':
        result = await sql`
          SELECT 
            l_returnflag,
            l_linestatus,
            SUM(l_quantity) as sum_qty,
            SUM(l_extendedprice) as sum_base_price,
            SUM(l_extendedprice * (1 - l_discount)) as sum_disc_price,
            SUM(l_extendedprice * (1 - l_discount) * (1 + l_tax)) as sum_charge,
            AVG(l_quantity) as avg_qty,
            AVG(l_extendedprice) as avg_price,
            AVG(l_discount) as avg_disc,
            COUNT(*) as count_order
          FROM tpc.lineitem
          WHERE l_shipdate <= DATE '1998-12-01' - INTERVAL '90' DAY
          GROUP BY l_returnflag, l_linestatus
          ORDER BY l_returnflag, l_linestatus
        `
        break
        
      case 'Q3':
        result = await sql`
          SELECT 
            l_orderkey,
            SUM(l_extendedprice * (1 - l_discount)) as revenue,
            o_orderdate,
            o_shippriority
          FROM tpc.customer, tpc.orders, tpc.lineitem
          WHERE c_mktsegment = 'BUILDING'
            AND c_custkey = o_custkey
            AND l_orderkey = o_orderkey
            AND o_orderdate < DATE '1995-03-15'
            AND l_shipdate > DATE '1995-03-15'
          GROUP BY l_orderkey, o_orderdate, o_shippriority
          ORDER BY revenue DESC, o_orderdate
          LIMIT 10
        `
        break
        
      case 'Q5':
        result = await sql`
          SELECT 
            n_name,
            SUM(l_extendedprice * (1 - l_discount)) as revenue
          FROM tpc.customer, tpc.orders, tpc.lineitem, tpc.supplier, tpc.nation, tpc.region
          WHERE c_custkey = o_custkey
            AND l_orderkey = o_orderkey
            AND l_suppkey = s_suppkey
            AND c_nationkey = s_nationkey
            AND s_nationkey = n_nationkey
            AND n_regionkey = r_regionkey
            AND r_name = 'ASIA'
            AND o_orderdate >= DATE '1994-01-01'
            AND o_orderdate < DATE '1994-01-01' + INTERVAL '1' YEAR
          GROUP BY n_name
          ORDER BY revenue DESC
        `
        break
        
      default:
        return NextResponse.json({ error: 'Invalid query type' }, { status: 400 })
    }
    
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error executing TPC-H query:', error)
    return NextResponse.json({ error: 'Failed to execute query' }, { status: 500 })
  }
} 
```

# api/tpc-h-queries/route.ts

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// TPC-H 标准查询定义
const tpcHQueries = {
  Q1: {
    name: "定价汇总报表查询",
    description: "按退货标志、线路状态分组的定价汇总报表",
    sql: `
      SELECT 
        l_returnflag,
        l_linestatus,
        SUM(l_quantity) as sum_qty,
        SUM(l_extendedprice) as sum_base_price,
        SUM(l_extendedprice * (1 - l_discount)) as sum_disc_price,
        SUM(l_extendedprice * (1 - l_discount) * (1 + l_tax)) as sum_charge,
        AVG(l_quantity) as avg_qty,
        AVG(l_extendedprice) as avg_price,
        AVG(l_discount) as avg_disc,
        COUNT(*) as count_order
      FROM tpc.lineitem
      WHERE l_shipdate <= DATE '1998-12-01' - INTERVAL '90 days'
      GROUP BY l_returnflag, l_linestatus
      ORDER BY l_returnflag, l_linestatus
    `,
  },
  Q3: {
    name: "运输优先级查询",
    description: "获取指定市场细分的客户在指定日期之前的订单收入",
    sql: `
      SELECT 
        l_orderkey,
        SUM(l_extendedprice * (1 - l_discount)) as revenue,
        o_orderdate,
        o_shippriority
      FROM tpc.customer c, tpc.orders o, tpc.lineitem l
      WHERE c.c_mktsegment = 'BUILDING'
        AND c.c_custkey = o.o_custkey
        AND l.l_orderkey = o.o_orderkey
        AND o.o_orderdate < DATE '1995-03-15'
        AND l.l_shipdate > DATE '1995-03-15'
      GROUP BY l.l_orderkey, o.o_orderdate, o.o_shippriority
      ORDER BY revenue DESC, o.o_orderdate
      LIMIT 10
    `,
  },
  Q5: {
    name: "本地供应商销量查询",
    description: "列出指定地区在指定年份的收入",
    sql: `
      SELECT 
        n.n_name,
        SUM(l.l_extendedprice * (1 - l.l_discount)) as revenue
      FROM tpc.customer c, tpc.orders o, tpc.lineitem l, tpc.supplier s, tpc.nation n, tpc.region r
      WHERE c.c_custkey = o.o_custkey
        AND l.l_orderkey = o.o_orderkey
        AND l.l_suppkey = s.s_suppkey
        AND c.c_nationkey = s.s_nationkey
        AND s.s_nationkey = n.n_nationkey
        AND n.n_regionkey = r.r_regionkey
        AND r.r_name = 'ASIA'
        AND o.o_orderdate >= DATE '1994-01-01'
        AND o.o_orderdate < DATE '1995-01-01'
      GROUP BY n.n_name
      ORDER BY revenue DESC
    `,
  },
  Q7: {
    name: "销量查询",
    description: "两个国家之间的贸易量",
    sql: `
      SELECT 
        supp_nation,
        cust_nation,
        l_year,
        SUM(volume) as revenue
      FROM (
        SELECT 
          n1.n_name as supp_nation,
          n2.n_name as cust_nation,
          EXTRACT(year FROM l.l_shipdate) as l_year,
          l.l_extendedprice * (1 - l.l_discount) as volume
        FROM tpc.supplier s, tpc.lineitem l, tpc.orders o, tpc.customer c, tpc.nation n1, tpc.nation n2
        WHERE s.s_suppkey = l.l_suppkey
          AND o.o_orderkey = l.l_orderkey
          AND c.c_custkey = o.o_custkey
          AND s.s_nationkey = n1.n_nationkey
          AND c.c_nationkey = n2.n_nationkey
          AND ((n1.n_name = 'FRANCE' AND n2.n_name = 'GERMANY')
               OR (n1.n_name = 'GERMANY' AND n2.n_name = 'FRANCE'))
          AND l.l_shipdate BETWEEN DATE '1995-01-01' AND DATE '1996-12-31'
      ) as shipping
      GROUP BY supp_nation, cust_nation, l_year
      ORDER BY supp_nation, cust_nation, l_year
    `,
  },
  Q10: {
    name: "退货客户查询",
    description: "分析退货客户的损失",
    sql: `
      SELECT 
        c.c_custkey,
        c.c_name,
        SUM(l.l_extendedprice * (1 - l.l_discount)) as revenue,
        c.c_acctbal,
        n.n_name,
        c.c_address,
        c.c_phone,
        c.c_comment
      FROM tpc.customer c, tpc.orders o, tpc.lineitem l, tpc.nation n
      WHERE c.c_custkey = o.o_custkey
        AND l.l_orderkey = o.o_orderkey
        AND o.o_orderdate >= DATE '1993-10-01'
        AND o.o_orderdate < DATE '1994-01-01'
        AND l.l_returnflag = 'R'
        AND c.c_nationkey = n.n_nationkey
      GROUP BY c.c_custkey, c.c_name, c.c_acctbal, c.c_phone, n.n_name, c.c_address, c.c_comment
      ORDER BY revenue DESC
      LIMIT 20
    `,
  },
}

export async function POST(request: NextRequest) {
  try {
    const { queryId, parameters } = await request.json()

    if (!queryId || !tpcHQueries[queryId as keyof typeof tpcHQueries]) {
      return NextResponse.json({ error: "无效的查询ID" }, { status: 400 })
    }

    const query = tpcHQueries[queryId as keyof typeof tpcHQueries]
    let sqlQuery = query.sql

    // 根据参数替换查询中的值
    if (parameters) {
      if (parameters.region && queryId === "Q5") {
        sqlQuery = sqlQuery.replace("'ASIA'", `'${parameters.region}'`)
      }
      if (parameters.segment && queryId === "Q3") {
        sqlQuery = sqlQuery.replace("'BUILDING'", `'${parameters.segment}'`)
      }
      if (parameters.nation1 && parameters.nation2 && queryId === "Q7") {
        sqlQuery = sqlQuery.replace("'FRANCE'", `'${parameters.nation1}'`)
        sqlQuery = sqlQuery.replace("'GERMANY'", `'${parameters.nation2}'`)
      }
    }

    const startTime = Date.now()
    const result = await sql.query(sqlQuery, [])
    const executionTime = Date.now() - startTime

    // 添加日志
    console.log('SQL查询结果:', {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields
    })

    // 确保返回的数据格式正确
    const rows = result.rows || []
    
    const response = {
      data: rows,
      executionTime,
      queryInfo: {
        name: query.name,
        description: query.description,
        sql: sqlQuery,
      },
    }

    console.log('API响应:', response)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("TPC-H查询执行错误:", error)
    return NextResponse.json(
      {
        error: `查询执行错误: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

```

# api/users/route.ts

```typescript
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
```

# api/users/[id]/route.ts

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 验证 token
    const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };

    // 检查当前用户是否为管理员
    const adminResult = await pool.query(
      'SELECT role FROM system_users WHERE id = $1',
      [decoded.userId]
    );

    if (adminResult.rows.length === 0 || adminResult.rows[0].role !== 'admin') {
      return NextResponse.json(
        { error: '无权限执行此操作' },
        { status: 403 }
      );
    }

    // 获取用户ID
    const { id } = await params;
    const userId = parseInt(id);

    // 检查目标用户是否存在
    const userResult = await pool.query(
      'SELECT id FROM system_users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 不允许删除自己
    if (userId === decoded.userId) {
      return NextResponse.json(
        { error: '不能删除当前登录的用户' },
        { status: 400 }
      );
    }

    // 删除用户
    await pool.query(
      'DELETE FROM system_users WHERE id = $1',
      [userId]
    );

    return NextResponse.json({
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    );
  }
} 
```

# api/users/[id]/password/route.ts

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 验证 token
    const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };

    // 检查当前用户是否为管理员
    const adminResult = await pool.query(
      'SELECT role FROM system_users WHERE id = $1',
      [decoded.userId]
    );

    if (adminResult.rows.length === 0 || adminResult.rows[0].role !== 'admin') {
      return NextResponse.json(
        { error: '无权限执行此操作' },
        { status: 403 }
      );
    }

    // 获取请求数据
    const { newPassword } = await request.json();
    const { id } = await params;
    const userId = parseInt(id);

    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度不能少于6个字符' },
        { status: 400 }
      );
    }

    // 检查目标用户是否存在
    const userResult = await pool.query(
      'SELECT id FROM system_users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.query(
      'UPDATE system_users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    return NextResponse.json({
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json(
      { error: '修改密码失败' },
      { status: 500 }
    );
  }
} 
```

# api/users/[id]/reject/route.ts

```typescript
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await pool.query(
      `UPDATE system_users
       SET status = 'rejected'
       WHERE id = $1 AND status = 'pending'
       RETURNING id, username, role, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在或状态不是待审批' },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({
      message: '已拒绝该用户的注册申请',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('拒绝用户失败:', error);
    return NextResponse.json(
      { error: '拒绝用户失败' },
      { status: 500 }
    );
  }
} 
```

# api/users/[id]/status/route.ts

```typescript
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'tpc_user',
  host: 'localhost',
  database: 'tpc_db',
  password: 'tpc_password',
  port: 5432,
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const { id } = await params;
    const userId = parseInt(id);

    // 验证状态值
    if (!['active', 'pending', 'disabled'].includes(status)) {
      return NextResponse.json(
        { error: '无效的状态值' },
        { status: 400 }
      );
    }

    // 更新用户状态
    const result = await pool.query(
      `UPDATE system_users 
       SET status = $1
       WHERE id = $2
       RETURNING id, username, role, status, created_at`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    return NextResponse.json(
      { error: '更新用户状态失败' },
      { status: 500 }
    );
  }
} 
```

# api/users/[id]/approve/route.ts

```typescript
 
```

# api/users/pending/route.ts

```typescript
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
```

# api/tpc-c-query/route.ts

```typescript
import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { queryType, customerId } = await request.json()
    
    let result
    switch (queryType) {
      case 'NEW_ORDER':
        // 检查客户信息
        const customer = await sql`
          SELECT c_custkey, c_name, c_acctbal 
          FROM tpc.customer 
          WHERE c_custkey = ${Number.parseInt(customerId)}
        `
        
        if (customer.length === 0) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }
        
        // 创建新订单
        const order = await sql`
          INSERT INTO tpc.orders (
            o_custkey, o_orderstatus, o_totalprice, o_orderdate
          ) VALUES (
            ${Number.parseInt(customerId)},
            'O',
            0,
            CURRENT_DATE
          )
          RETURNING o_orderkey
        `
        
        result = {
          customer: customer[0],
          order: order[0]
        }
        break
        
      case 'PAYMENT':
        // 更新客户余额
        result = await sql`
          UPDATE tpc.customer
          SET c_acctbal = c_acctbal - 100
          WHERE c_custkey = ${Number.parseInt(customerId)}
          RETURNING c_custkey, c_name, c_acctbal
        `
        break
        
      case 'ORDER_STATUS':
        // 查询客户最新订单
        result = await sql`
          SELECT o_orderkey, o_orderdate, o_orderstatus, o_totalprice
          FROM tpc.orders 
          WHERE o_custkey = ${Number.parseInt(customerId)}
          ORDER BY o_orderdate DESC 
          LIMIT 1
        `
        break
        
      case 'DELIVERY':
        // 更新订单状态
        result = await sql`
          UPDATE tpc.orders
          SET o_orderstatus = 'F'
          WHERE o_orderkey IN (
            SELECT o_orderkey
            FROM tpc.orders
            WHERE o_orderstatus = 'O'
            ORDER BY o_orderdate ASC
            LIMIT 1
          )
          RETURNING o_orderkey, o_orderstatus
        `
        break
        
      case 'STOCK_LEVEL':
        // 检查库存水平
        result = await sql`
          SELECT COUNT(*) as low_stock_count
          FROM tpc.stock
          WHERE s_quantity < 10
        `
        break
        
      default:
        return NextResponse.json({ error: 'Invalid query type' }, { status: 400 })
    }
    
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error executing TPC-C query:', error)
    return NextResponse.json({ error: 'Failed to execute query' }, { status: 500 })
  }
} 
```

# api/tpc-c-concurrent/route.ts

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// 简化的TPC-C事务用于并发测试
async function executeSimpleTransaction(transactionType: string, clientId: number) {
  const startTime = Date.now()

  try {
    let result

    switch (transactionType) {
      case "NEW_ORDER":
        // 简化的新订单事务 - 只查询客户信息
        result = await sql`
          SELECT c_custkey, c_name, c_acctbal 
          FROM tpc.customer 
          WHERE c_custkey = ${Math.floor(Math.random() * 1000) + 1}
          LIMIT 1
        `
        break

      case "PAYMENT":
        // 简化的付款事务 - 查询客户余额
        result = await sql`
          SELECT c_custkey, c_name, c_acctbal 
          FROM tpc.customer 
          WHERE c_acctbal > ${Math.random() * 1000}
          LIMIT 1
        `
        break

      case "ORDER_STATUS":
        // 订单状态查询
        result = await sql`
          SELECT o.o_orderkey, o.o_orderdate, o.o_orderstatus, c.c_name
          FROM tpc.orders o
          JOIN tpc.customer c ON o.o_custkey = c.c_custkey
          WHERE o.o_custkey = ${Math.floor(Math.random() * 1000) + 1}
          ORDER BY o.o_orderdate DESC
          LIMIT 3
        `
        break

      case "DELIVERY":
        // 发货事务 - 查询待发货订单
        result = await sql`
          SELECT o_orderkey, o_orderdate, o_orderstatus
          FROM tpc.orders 
          WHERE o_orderstatus = 'O'
          LIMIT 5
        `
        break

      case "STOCK_LEVEL":
        // 库存水平查询
        result = await sql`
          SELECT p.p_partkey, p.p_name, ps.ps_availqty
          FROM tpc.part p
          JOIN tpc.partsupp ps ON p.p_partkey = ps.ps_partkey
          WHERE ps.ps_availqty < ${Math.floor(Math.random() * 100) + 50}
          LIMIT 10
        `
        break

      default:
        throw new Error("不支持的事务类型")
    }

    const executionTime = Date.now() - startTime

    // 模拟事务成功/失败（95%成功率）
    const success = Math.random() > 0.05

    return {
      clientId,
      transactionType,
      success,
      executionTime,
      rowCount: result.length,
      operations: Math.floor(Math.random() * 5) + 1,
      data: success ? result.slice(0, 3) : null, // 只返回前3条记录
    }
  } catch (error) {
    return {
      clientId,
      transactionType,
      success: false,
      executionTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      operations: 0,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transactionType, clientId } = await request.json()

    if (!transactionType) {
      return NextResponse.json({ error: "缺少事务类型" }, { status: 400 })
    }

    const result = await executeSimpleTransaction(transactionType, clientId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: `并发事务执行错误: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
      },
      { status: 500 },
    )
  }
}

```

# api/countries/route.ts

```typescript
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

```

# api/order-part-queries/route.ts

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { executeQueryWithTiming } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const queryType = request.nextUrl.searchParams.get("type")
    const searchTerm = request.nextUrl.searchParams.get("search") || ""
    const statusFilter = request.nextUrl.searchParams.get("status") || ""

    let query = ""
    const params: any[] = []

    if (queryType === "order") {
      query = `
        SELECT 
          o.o_orderkey as id,
          o.o_custkey as customer_id,
          c.c_name as customer_name,
          o.o_orderdate as order_date,
          o.o_orderstatus as status,
          o.o_totalprice as total_price,
          o.o_orderpriority as priority,
          o.o_comment
        FROM tpc.orders o
        LEFT JOIN tpc.customer c ON o.o_custkey = c.c_custkey
        WHERE 1=1
      `

      if (searchTerm) {
        query += ` AND (c.c_name ILIKE $${params.length + 1} OR o.o_orderkey::text ILIKE $${params.length + 1})`
        params.push(`%${searchTerm}%`)
      }

      if (statusFilter && statusFilter !== "all") {
        query += ` AND o.o_orderstatus = $${params.length + 1}`
        params.push(statusFilter)
      }

      query += ` ORDER BY o.o_orderkey DESC LIMIT 100`
    } else if (queryType === "part") {
      query = `
        SELECT 
          p.p_partkey as id,
          p.p_name as name,
          p.p_brand as brand,
          p.p_type as type,
          p.p_size as size,
          p.p_container as container,
          p.p_retailprice as retail_price,
          p.p_mfgr as manufacturer
        FROM tpc.part p
        WHERE 1=1
      `

      if (searchTerm) {
        query += ` AND (p.p_name ILIKE $${params.length + 1} OR p.p_brand ILIKE $${params.length + 1})`
        params.push(`%${searchTerm}%`)
      }

      if (statusFilter && statusFilter !== "all") {
        query += ` AND p.p_type ILIKE $${params.length + 1}`
        params.push(`%${statusFilter}%`)
      }

      query += ` ORDER BY p.p_partkey LIMIT 100`
    } else {
      return NextResponse.json({ error: "无效的查询类型" }, { status: 400 })
    }

    console.log("执行查询:", query, "参数:", params)

    const result = await executeQueryWithTiming(query, params)

    if (result.success) {
      const rows = result.data.rows || []
      console.log("查询结果:", {
        rowCount: rows.length,
        firstRow: rows[0],
        executionTime: result.executionTime
      })

      return NextResponse.json({
        data: rows,
        executionTime: result.executionTime,
        success: true
      })
    } else {
      console.error("查询失败:", result.error)
      return NextResponse.json({ 
        error: result.error,
        success: false,
        data: []
      }, { status: 500 })
    }
  } catch (error) {
    console.error("查询异常:", error)
    return NextResponse.json(
      {
        error: `查询出错: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

```

# api/data/export/route.ts

```typescript
import { NextResponse } from "next/server"
import { executeQueryWithTiming } from "@/lib/db"

interface Field {
  name: string
  dataTypeID: number
  dataTypeSize: number
  dataTypeModifier: number
  format: string
}

interface TableRow {
  [key: string]: any
}

export async function POST(request: Request) {
  try {
    const { table, format } = await request.json()

    if (!table || !format) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      )
    }

    // 获取表数据
    const result = await executeQueryWithTiming(`SELECT * FROM ${table.toLowerCase()}`)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    if (result.data.rows.length === 0) {
      return NextResponse.json(
        { error: "表不存在或为空" },
        { status: 404 }
      )
    }

    // 获取列名
    const columns = result.data.fields.map((field: Field) => field.name)

    // 生成文件内容
    let content = ""
    if (format === "csv") {
      // CSV格式
      const header = columns.join(",")
      const rows = result.data.rows.map((row: TableRow) => 
        columns.map((col: string) => {
          const value = row[col]
          if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(",")
      )
      content = [header, ...rows].join("\n")
    } else if (format === "txt") {
      // TXT格式
      const header = columns.join("\t")
      const rows = result.data.rows.map((row: TableRow) => 
        columns.map((col: string) => row[col]).join("\t")
      )
      content = [header, ...rows].join("\n")
    } else {
      return NextResponse.json(
        { error: "不支持的导出格式" },
        { status: 400 }
      )
    }

    // 返回文件
    return new NextResponse(content, {
      headers: {
        "Content-Type": format === "csv" ? "text/csv" : "text/plain",
        "Content-Disposition": `attachment; filename="${table}.${format}"`,
      },
    })
  } catch (error) {
    console.error("导出失败:", error)
    return NextResponse.json(
      { error: "导出失败" },
      { status: 500 }
    )
  }
} 
```

# api/import-data-stream/route.ts

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { executeBatchInsert, executeSingleInsert } from "@/lib/db"

// 完整的TPC-H 8张表数据清洗规则
const dataValidationRules = {
  orders: {
    fields: [
      "o_orderkey",
      "o_custkey",
      "o_orderstatus",
      "o_totalprice",
      "o_orderdate",
      "o_orderpriority",
      "o_clerk",
      "o_shippriority",
      "o_comment",
    ],
    validations: {
      o_orderkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "订单ID必须为正整数"
        return null
      },
      o_custkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "客户ID必须为正整数"
        return null
      },
      o_totalprice: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num <= 0) return "订单总价必须为正数"
        return null
      },
      o_orderdate: (value: string) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(value)) return "订单日期格式无效，应为YYYY-MM-DD"
        return null
      },
    },
  },
  partsupp: {
    fields: ["ps_partkey", "ps_suppkey", "ps_availqty", "ps_supplycost", "ps_comment"],
    validations: {
      ps_partkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "零件ID必须为正整数"
        return null
      },
      ps_suppkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "供应商ID必须为正整数"
        return null
      },
      ps_availqty: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num < 0) return "零件供应数量必须为非负整数"
        return null
      },
      ps_supplycost: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num <= 0) return "供应成本必须为正数"
        return null
      },
    },
  },
  lineitem: {
    fields: [
      "l_orderkey",
      "l_partkey",
      "l_suppkey",
      "l_linenumber",
      "l_quantity",
      "l_extendedprice",
      "l_discount",
      "l_tax",
      "l_returnflag",
      "l_linestatus",
      "l_shipdate",
      "l_commitdate",
      "l_receiptdate",
      "l_shipinstruct",
      "l_shipmode",
      "l_comment",
    ],
    validations: {
      l_orderkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "订单ID必须为正整数"
        return null
      },
      l_partkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "零件ID必须为正整数"
        return null
      },
      l_suppkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "供应商ID必须为正整数"
        return null
      },
      l_linenumber: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "行号必须为正整数"
        return null
      },
      l_quantity: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num <= 0) return "数量必须为正数"
        return null
      },
      l_extendedprice: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num <= 0) return "扩展价格必须为正数"
        return null
      },
      l_discount: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num < 0 || num > 1) return "折扣必须在0到1之间"
        return null
      },
      l_tax: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num < 0) return "税率必须为非负数"
        return null
      },
      l_shipdate: (value: string) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(value)) return "发货日期格式无效，应为YYYY-MM-DD"
        return null
      },
      l_commitdate: (value: string) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(value)) return "承诺日期格式无效，应为YYYY-MM-DD"
        return null
      },
      l_receiptdate: (value: string) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(value)) return "收货日期格式无效，应为YYYY-MM-DD"
        return null
      },
    },
  },
  customer: {
    fields: ["c_custkey", "c_name", "c_address", "c_nationkey", "c_phone", "c_acctbal", "c_mktsegment", "c_comment"],
    validations: {
      c_custkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "客户ID必须为正整数"
        return null
      },
      c_nationkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num < 0) return "国家ID必须为非负整数"
        return null
      },
      c_acctbal: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num)) return "账户余额必须为数值"
        return null
      },
      c_phone: (value: string) => {
        if (value.length < 10) return "电话号码长度不足"
        return null
      },
    },
  },
  part: {
    fields: [
      "p_partkey",
      "p_name",
      "p_mfgr",
      "p_brand",
      "p_type",
      "p_size",
      "p_container",
      "p_retailprice",
      "p_comment",
    ],
    validations: {
      p_partkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "零件ID必须为正整数"
        return null
      },
      p_size: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "尺寸必须为正整数"
        return null
      },
      p_retailprice: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num) || num <= 0) return "零售价必须为正数"
        return null
      },
    },
  },
  supplier: {
    fields: ["s_suppkey", "s_name", "s_address", "s_nationkey", "s_phone", "s_acctbal", "s_comment"],
    validations: {
      s_suppkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num <= 0) return "供应商ID必须为正整数"
        return null
      },
      s_nationkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num < 0) return "国家ID必须为非负整数"
        return null
      },
      s_acctbal: (value: string) => {
        const num = Number.parseFloat(value)
        if (isNaN(num)) return "账户余额必须为数值"
        return null
      },
      s_phone: (value: string) => {
        if (value.length < 10) return "电话号码长度不足"
        return null
      },
    },
  },
  nation: {
    fields: ["n_nationkey", "n_name", "n_regionkey", "n_comment"],
    validations: {
      n_nationkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num < 0) return "国家ID必须为非负整数"
        return null
      },
      n_regionkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num < 0) return "地区ID必须为非负整数"
        return null
      },
      n_name: (value: string) => {
        if (!value || value.trim().length === 0) return "国家名称不能为空"
        if (value.length > 25) return "国家名称长度不能超过25个字符"
        return null
      },
    },
  },
  region: {
    fields: ["r_regionkey", "r_name", "r_comment"],
    validations: {
      r_regionkey: (value: string) => {
        const num = Number.parseInt(value)
        if (isNaN(num) || num < 0) return "地区ID必须为非负整数"
        return null
      },
      r_name: (value: string) => {
        if (!value || value.trim().length === 0) return "地区名称不能为空"
        if (value.length > 25) return "地区名称长度不能超过25个字符"
        return null
      },
    },
  },
}

// 流式处理函数（保持不变，但现在支持所有8张表）
async function processFileStream(
  fileStream: ReadableStream<Uint8Array>,
  table: string,
  delimiter: string,
  onProgress: (progress: { processed: number; imported: number; failed: number; errors: any[] }) => void,
) {
  const decoder = new TextDecoder()
  const reader = fileStream.getReader()

  let buffer = ""
  let lineNumber = 0
  let processedRows = 0
  let importedRows = 0
  let failedRows = 0
  const errors: any[] = []

  const { fields, validations } = dataValidationRules[table as keyof typeof dataValidationRules]
  const batchSize = 1000 // 每批处理1000行
  let batch: string[][] = []

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // 处理最后的缓冲区内容
        if (buffer.trim()) {
          const lines = buffer.split("\n").filter((line) => line.trim())
          for (const line of lines) {
            await processLine(line)
          }
        }

        // 处理最后一批
        if (batch.length > 0) {
          await processBatch()
        }
        break
      }

      // 将新数据添加到缓冲区
      buffer += decoder.decode(value, { stream: true })

      // 处理完整的行
      const lines = buffer.split("\n")
      buffer = lines.pop() || "" // 保留最后一个不完整的行

      for (const line of lines) {
        if (line.trim()) {
          await processLine(line.trim())
        }
      }
    }
  } catch (error) {
    console.error("流处理错误:", error)
    throw error
  }

  async function processLine(line: string) {
    lineNumber++
    processedRows++

    const values = line.split(delimiter)

    // 验证字段数量
    if (values.length !== fields.length) {
      errors.push({
        line: lineNumber,
        reason: `字段数量不匹配，期望 ${fields.length} 个字段，实际 ${values.length} 个字段`,
        data: line.substring(0, 100) + (line.length > 100 ? "..." : ""),
      })
      failedRows++
      return
    }

    // 验证每个字段
    let isValid = true
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      const value = values[i]

      // 检查空值（除了comment字段可以为空）
      if (!value && value !== "0" && !field.includes("comment")) {
        errors.push({
          line: lineNumber,
          reason: `字段 ${field} 不能为空`,
          data: line.substring(0, 100) + (line.length > 100 ? "..." : ""),
        })
        isValid = false
        failedRows++
        break
      }

      // 应用验证规则
      const validationFn = validations[field as keyof typeof validations]
      if (validationFn) {
        const error = validationFn(value)
        if (error) {
          errors.push({
            line: lineNumber,
            reason: `字段 ${field} 验证失败: ${error}`,
            data: line.substring(0, 100) + (line.length > 100 ? "..." : ""),
          })
          isValid = false
          failedRows++
          break
        }
      }
    }

    if (isValid) {
      batch.push(values)

      // 当批次达到指定大小时，处理批次
      if (batch.length >= batchSize) {
        await processBatch()
      }
    }

    // 每处理1000行报告一次进度
    if (processedRows % 1000 === 0) {
      onProgress({
        processed: processedRows,
        imported: importedRows,
        failed: failedRows,
        errors: errors.slice(-10), // 只保留最近的10个错误
      })
    }
  }

  async function processBatch() {
    if (batch.length === 0) return

    try {
      // 使用新的批量插入函数
      const result = await executeBatchInsert(table, fields, batch)

      if (result.success) {
        importedRows += batch.length
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("批量插入错误:", error)

      // 如果批量插入失败，尝试逐行插入以识别具体问题
      for (let i = 0; i < batch.length; i++) {
        try {
          const result = await executeSingleInsert(table, fields, batch[i])
          if (result.success) {
            importedRows++
          } else {
            throw new Error(result.error)
          }
        } catch (singleError) {
          errors.push({
            line: lineNumber - batch.length + i + 1,
            reason: `数据库插入错误: ${singleError instanceof Error ? singleError.message : String(singleError)}`,
            data: batch[i].join(delimiter).substring(0, 100),
          })
          failedRows++
        }
      }
    }

    batch = [] // 清空批次
  }

  return {
    totalRows: processedRows,
    importedRows,
    failedRows,
    errors,
    success: importedRows > 0,
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const table = formData.get("table") as string
    const delimiter = (formData.get("delimiter") as string) || "|"

    if (!file || !table) {
      return NextResponse.json({ error: "缺少文件或表名" }, { status: 400 })
    }

    // 检查文件大小（限制为2GB）
    if (file.size > 2 * 1024 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小超过2GB限制" }, { status: 400 })
    }

    // 检查表是否受支持
    if (!dataValidationRules[table as keyof typeof dataValidationRules]) {
      return NextResponse.json({ error: "不支持的表名" }, { status: 400 })
    }

    // 创建响应流
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let lastProgress = { processed: 0, imported: 0, failed: 0, errors: [] }

          const result = await processFileStream(file.stream(), table, delimiter, (progress) => {
            lastProgress = progress
            // 发送进度更新
            const progressData = JSON.stringify({ type: "progress", data: progress }) + "\n"
            controller.enqueue(encoder.encode(progressData))
          })

          // 发送最终结果
          const finalData = JSON.stringify({ type: "complete", data: result }) + "\n"
          controller.enqueue(encoder.encode(finalData))
        } catch (error) {
          const errorData =
            JSON.stringify({
              type: "error",
              data: { error: error instanceof Error ? error.message : String(error) },
            }) + "\n"
          controller.enqueue(encoder.encode(errorData))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("导入处理错误:", error)
    return NextResponse.json(
      {
        error: `导入处理错误: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

```

# api/tpc-c-transactions/route.ts

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// TPC-C 事务处理函数
async function executeNewOrderTransaction(customerId: string, warehouseId: string, amount: string) {
  const startTime = Date.now()
  const steps = []

  try {
    // 步骤1: 检查客户信息
    const step1Start = Date.now()
    const customerCheck = await sql`
      SELECT c_id, c_first, c_last, c_credit, c_discount
      FROM tpcc_customer 
      WHERE c_w_id = ${Number.parseInt(warehouseId.replace('WH-', ''))} 
      AND c_id = ${Number.parseInt(customerId)}
    `
    steps.push({
      step: 1,
      operation: "检查客户信息",
      time: Date.now() - step1Start,
      status: customerCheck.length > 0 ? "SUCCESS" : "FAILED",
    })

    if (customerCheck.length === 0) {
      throw new Error("客户不存在")
    }

    // 步骤2: 获取地区信息
    const step2Start = Date.now()
    const districtCheck = await sql`
      SELECT d_id, d_tax, d_next_o_id
      FROM tpcc_district 
      WHERE d_w_id = ${Number.parseInt(warehouseId.replace('WH-', ''))}
      LIMIT 1
    `
    steps.push({
      step: 2,
      operation: "获取地区信息",
      time: Date.now() - step2Start,
      status: districtCheck.length > 0 ? "SUCCESS" : "FAILED",
    })

    if (districtCheck.length === 0) {
      throw new Error("地区不存在")
    }

    // 步骤3: 创建订单
    const step3Start = Date.now()
    const orderId = districtCheck[0].d_next_o_id
    const districtId = districtCheck[0].d_id

    // 更新地区订单ID
    await sql`
      UPDATE tpcc_district 
      SET d_next_o_id = d_next_o_id + 1 
      WHERE d_w_id = ${Number.parseInt(warehouseId.replace('WH-', ''))} 
      AND d_id = ${districtId}
    `

    // 插入订单
    await sql`
      INSERT INTO tpcc_orders (
        o_id, o_d_id, o_w_id, o_c_id, o_entry_d, o_ol_cnt, o_all_local
      ) VALUES (
        ${orderId}, 
        ${districtId}, 
        ${Number.parseInt(warehouseId.replace('WH-', ''))}, 
        ${Number.parseInt(customerId)}, 
        NOW(), 
        1, 
        1
      )
    `

    steps.push({
      step: 3,
      operation: "创建订单记录",
      time: Date.now() - step3Start,
      status: "SUCCESS",
    })

    // 步骤4: 创建订单项
    const step4Start = Date.now()
    const itemId = Math.floor(Math.random() * 100000) + 1
    const quantity = Math.floor(Math.random() * 10) + 1

    // 获取商品信息
    const itemInfo = await sql`
      SELECT i_price, i_name 
      FROM tpcc_item 
      WHERE i_id = ${itemId}
    `

    if (itemInfo.length === 0) {
      throw new Error("商品不存在")
    }

    // 更新库存
    await sql`
      UPDATE tpcc_stock 
      SET s_quantity = s_quantity - ${quantity},
          s_ytd = s_ytd + ${quantity},
          s_order_cnt = s_order_cnt + 1
      WHERE s_w_id = ${Number.parseInt(warehouseId.replace('WH-', ''))} 
      AND s_i_id = ${itemId}
    `

    // 插入订单项
    await sql`
      INSERT INTO tpcc_order_line (
        ol_o_id, ol_d_id, ol_w_id, ol_number, ol_i_id, 
        ol_supply_w_id, ol_quantity, ol_amount, ol_dist_info
      ) VALUES (
        ${orderId}, 
        ${districtId}, 
        ${Number.parseInt(warehouseId.replace('WH-', ''))}, 
        1, 
        ${itemId}, 
        ${Number.parseInt(warehouseId.replace('WH-', ''))}, 
        ${quantity}, 
        ${itemInfo[0].i_price * quantity}, 
        'DIST-INFO'
      )
    `

    steps.push({
      step: 4,
      operation: "创建订单项",
      time: Date.now() - step4Start,
      status: "SUCCESS",
    })

    return {
      success: true,
      orderId: `ORD-${orderId}`,
      customerId,
      customerName: `${customerCheck[0].c_first} ${customerCheck[0].c_last}`,
      warehouseId,
      totalAmount: itemInfo[0].i_price * quantity,
      itemCount: 1,
      steps,
      totalTime: Date.now() - startTime,
    }
  } catch (error) {
    console.error("新订单事务执行失败:", error)
    throw error
  }
}

async function executePaymentTransaction(customerId: string, warehouseId: string, amount: string) {
  const startTime = Date.now()
  const steps = []

  try {
    // 步骤1: 验证客户
    const step1Start = Date.now()
    const customer = await sql`
      SELECT c_custkey, c_name, c_acctbal 
      FROM tpc.customer 
      WHERE c_custkey = ${Number.parseInt(customerId)}
    `
    steps.push({
      step: 1,
      operation: "验证客户信息",
      time: Date.now() - step1Start,
      status: customer.length > 0 ? "SUCCESS" : "FAILED",
    })

    if (customer.length === 0) {
      throw new Error("客户不存在")
    }

    // 步骤2: 检查账户余额
    const step2Start = Date.now()
    const paymentAmount = Number.parseFloat(amount)
    const currentBalance = Number.parseFloat(customer[0].c_acctbal)

    steps.push({
      step: 2,
      operation: "检查账户余额",
      time: Date.now() - step2Start,
      status: currentBalance >= paymentAmount ? "SUCCESS" : "WARNING",
    })

    // 步骤3: 处理付款
    const step3Start = Date.now()
    // 这里应该更新客户余额，但为了演示我们只是模拟
    steps.push({
      step: 3,
      operation: "处理付款",
      time: Date.now() - step3Start,
      status: "SUCCESS",
    })

    // 步骤4: 记录交易历史
    const step4Start = Date.now()
    steps.push({
      step: 4,
      operation: "记录交易历史",
      time: Date.now() - step4Start,
      status: "SUCCESS",
    })

    return {
      success: true,
      customerId,
      customerName: customer[0].c_name,
      paymentAmount,
      warehouseId,
      districtId: "DIST-10",
      newBalance: currentBalance - paymentAmount,
      steps,
      totalTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      steps,
      totalTime: Date.now() - startTime,
    }
  }
}

async function executeOrderStatusQuery(customerId: string) {
  const startTime = Date.now()
  const steps = []

  try {
    // 步骤1: 查询客户信息
    const step1Start = Date.now()
    const customer = await sql`
      SELECT c_custkey, c_name 
      FROM tpc.customer 
      WHERE c_custkey = ${Number.parseInt(customerId)}
    `
    steps.push({
      step: 1,
      operation: "查询客户信息",
      time: Date.now() - step1Start,
      status: customer.length > 0 ? "SUCCESS" : "FAILED",
    })

    if (customer.length === 0) {
      throw new Error("客户不存在")
    }

    // 步骤2: 查询最新订单
    const step2Start = Date.now()
    const orders = await sql`
      SELECT o_orderkey, o_orderdate, o_orderstatus, o_totalprice
      FROM tpc.orders 
      WHERE o_custkey = ${Number.parseInt(customerId)}
      ORDER BY o_orderdate DESC 
      LIMIT 5
    `
    steps.push({
      step: 2,
      operation: "查询订单信息",
      time: Date.now() - step2Start,
      status: "SUCCESS",
    })

    // 步骤3: 查询订单明细
    const step3Start = Date.now()
    let orderDetails = []
    if (orders.length > 0) {
      orderDetails = await sql`
        SELECT l_orderkey, l_partkey, l_quantity, l_extendedprice
        FROM tpc.lineitem 
        WHERE l_orderkey = ${orders[0].o_orderkey}
        LIMIT 10
      `
    }
    steps.push({
      step: 3,
      operation: "查询订单明细",
      time: Date.now() - step3Start,
      status: "SUCCESS",
    })

    return {
      success: true,
      customerId,
      customerName: customer[0].c_name,
      orders: orders.slice(0, 3),
      orderDetails: orderDetails.slice(0, 5),
      steps,
      totalTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      steps,
      totalTime: Date.now() - startTime,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transactionType, customerId, warehouseId, amount } = await request.json()

    if (!transactionType) {
      return NextResponse.json({ error: "缺少事务类型" }, { status: 400 })
    }

    let result
    switch (transactionType) {
      case "NEW_ORDER":
        result = await executeNewOrderTransaction(customerId, warehouseId, amount)
        break
      case "PAYMENT":
        result = await executePaymentTransaction(customerId, warehouseId, amount)
        break
      case "ORDER_STATUS":
        result = await executeOrderStatusQuery(customerId)
        break
      default:
        return NextResponse.json({ error: "不支持的事务类型" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: `事务执行错误: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

```

# requirements.txt

```plaintext
fastapi==0.104.1
uvicorn==0.24.0
asyncpg==0.29.0
python-dotenv==1.0.0 
```

# __init__.py

```python
"""
TPC-Bench 包
包含 TPC-H 和 TPC-C 基准测试的实现
""" 
```

# main.py

```python
import os
import asyncio
import asyncpg
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from datetime import datetime
from tpcc.api import router as tpcc_router

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 TPC-C 路由
app.include_router(tpcc_router, prefix="/api/tpcc", tags=["TPC-C"])

# 读取数据库配置
def get_db_config():
    try:
        with open("config/database.json", "r") as f:
            config = json.load(f)
            return f"postgresql://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
    except:
        # 如果配置文件不存在，使用默认配置
        return "postgresql://tpc_user:tpc_password@localhost:5432/tpc_db"

# 数据库配置
DB_URL = get_db_config()

# TPC-H 查询模板
TPC_H_QUERIES = {
    "Q1": {
        "name": "定价汇总报表查询",
        "description": "按退货标志、线路状态分组的定价汇总报表",
        "complexity": "中等",
        "estimatedTime": "2-5s",
        "parameters": [],
        "sql": """
        SELECT 
            l_returnflag,
            l_linestatus,
            SUM(l_quantity) as sum_qty,
            SUM(l_extendedprice) as sum_base_price,
            SUM(l_extendedprice * (1 - l_discount)) as sum_disc_price,
            SUM(l_extendedprice * (1 - l_discount) * (1 + l_tax)) as sum_charge,
            AVG(l_quantity) as avg_qty,
            AVG(l_extendedprice) as avg_price,
            AVG(l_discount) as avg_disc,
            COUNT(*) as count_order
        FROM tpc.lineitem
        WHERE l_shipdate <= DATE '1998-12-01' - INTERVAL '90 days'
        GROUP BY l_returnflag, l_linestatus
        ORDER BY l_returnflag, l_linestatus
        """
    },
    "Q3": {
        "name": "运输优先级查询",
        "description": "获取指定市场细分的客户在指定日期之前的订单收入",
        "complexity": "高",
        "estimatedTime": "3-8s",
        "parameters": [
            {
                "name": "segment",
                "label": "市场细分",
                "type": "select",
                "options": ["BUILDING", "AUTOMOBILE", "MACHINERY", "HOUSEHOLD", "FURNITURE"],
                "default": "BUILDING"
            }
        ],
        "sql": """
        SELECT 
            l_orderkey,
            SUM(l_extendedprice * (1 - l_discount)) as revenue,
            o_orderdate,
            o_shippriority
        FROM tpc.customer c, tpc.orders o, tpc.lineitem l
        WHERE c.c_mktsegment = $1
            AND c.c_custkey = o.o_custkey
            AND l.l_orderkey = o.o_orderkey
            AND o.o_orderdate < $2
            AND l.l_shipdate > $2
        GROUP BY l.l_orderkey, o.o_orderdate, o.o_shippriority
        ORDER BY revenue DESC, o.o_orderdate
        LIMIT 10
        """
    },
    "Q5": {
        "name": "本地供应商销量查询",
        "description": "列出指定地区在指定年份的收入",
        "complexity": "高",
        "estimatedTime": "4-10s",
        "parameters": [
            {
                "name": "region",
                "label": "地区",
                "type": "select",
                "options": ["ASIA", "AMERICA", "EUROPE", "MIDDLE EAST", "AFRICA"],
                "default": "ASIA"
            }
        ],
        "sql": """
        SELECT 
            n.n_name,
            SUM(l.l_extendedprice * (1 - l.l_discount)) as revenue
        FROM tpc.customer c, tpc.orders o, tpc.lineitem l, tpc.supplier s, tpc.nation n, tpc.region r
        WHERE c.c_custkey = o.o_custkey
            AND l.l_orderkey = o.o_orderkey
            AND l.l_suppkey = s.s_suppkey
            AND c.c_nationkey = s.s_nationkey
            AND s.s_nationkey = n.n_nationkey
            AND n.n_regionkey = r.r_regionkey
            AND r.r_name = $1
            AND o.o_orderdate >= $2
            AND o.o_orderdate < $3
        GROUP BY n.n_name
        ORDER BY revenue DESC
        """
    },
    "Q7": {
        "name": "销量查询",
        "description": "两个国家之间的贸易量",
        "complexity": "高",
        "estimatedTime": "5-12s",
        "parameters": [
            {
                "name": "nation1",
                "label": "国家1",
                "type": "input",
                "default": "FRANCE"
            },
            {
                "name": "nation2",
                "label": "国家2",
                "type": "input",
                "default": "GERMANY"
            }
        ],
        "sql": """
        SELECT 
            supp_nation,
            cust_nation,
            l_year,
            SUM(volume) as revenue
        FROM (
            SELECT 
                n1.n_name as supp_nation,
                n2.n_name as cust_nation,
                EXTRACT(YEAR FROM l.l_shipdate) as l_year,
                l.l_extendedprice * (1 - l.l_discount) as volume
            FROM tpc.supplier s, tpc.lineitem l, tpc.orders o, tpc.customer c, tpc.nation n1, tpc.nation n2
            WHERE s.s_suppkey = l.l_suppkey
                AND o.o_orderkey = l.l_orderkey
                AND c.c_custkey = o.o_custkey
                AND s.s_nationkey = n1.n_nationkey
                AND c.c_nationkey = n2.n_nationkey
                AND n1.n_name = $1
                AND n2.n_name = $2
                AND l.l_shipdate BETWEEN DATE '1995-01-01' AND DATE '1996-12-31'
        ) shipping
        GROUP BY supp_nation, cust_nation, l_year
        ORDER BY supp_nation, cust_nation, l_year
        """
    },
    "Q10": {
        "name": "退货客户查询",
        "description": "分析退货客户的损失",
        "complexity": "中等",
        "estimatedTime": "2-6s",
        "parameters": [],
        "sql": """
        SELECT 
            c.c_custkey,
            c.c_name,
            SUM(l.l_extendedprice * (1 - l.l_discount)) as revenue,
            c.c_acctbal,
            n.n_name,
            c.c_address,
            c.c_phone,
            c.c_comment
        FROM tpc.customer c, tpc.orders o, tpc.lineitem l, tpc.nation n
        WHERE c.c_custkey = o.o_custkey
            AND l.l_orderkey = o.o_orderkey
            AND o.o_orderdate >= DATE '1993-10-01'
            AND o.o_orderdate < DATE '1993-10-01' + INTERVAL '3 months'
            AND l.l_returnflag = 'R'
            AND c.c_nationkey = n.n_nationkey
        GROUP BY c.c_custkey, c.c_name, c.c_acctbal, c.c_phone, n.n_name, c.c_address, c.c_comment
        ORDER BY revenue DESC
        LIMIT 20
        """
    }
}

# 查询参数默认值
DEFAULT_PARAMS = {
    "Q3": ["BUILDING", "1995-03-15"],
    "Q5": ["ASIA", "1994-01-01", "1995-01-01"],
    "Q7": ["FRANCE", "GERMANY"]
}

async def run_query(pool, query_id: str, params: Optional[List] = None) -> Dict:
    """执行单个查询并返回结果"""
    try:
        query_info = TPC_H_QUERIES[query_id]
        sql = query_info["sql"]
        query_params = params or DEFAULT_PARAMS.get(query_id, [])

        async with pool.acquire() as conn:
            start = asyncio.get_event_loop().time()
            rows = await conn.fetch(sql, *query_params)
            elapsed = (asyncio.get_event_loop().time() - start) * 1000

            return {
                "queryId": query_id,
                "name": query_info["name"],
                "success": True,
                "rowCount": len(rows),
                "executionTime": elapsed,
                "timestamp": datetime.now().isoformat(),
                "data": [dict(row) for row in rows],
                "queryInfo": {
                    "name": query_info["name"],
                    "description": query_info["description"],
                    "complexity": query_info["complexity"],
                    "estimatedTime": query_info["estimatedTime"],
                    "sql": sql
                }
            }
    except Exception as e:
        return {
            "queryId": query_id,
            "name": TPC_H_QUERIES[query_id]["name"],
            "success": False,
            "error": str(e),
            "rowCount": 0,
            "executionTime": 0,
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/tpch/query")
async def execute_query(request: Request):
    """执行单个TPC-H查询"""
    try:
        body = await request.json()
        query_id = body.get("queryId")
        parameters = body.get("parameters", {})

        if not query_id or query_id not in TPC_H_QUERIES:
            return {
                "success": False,
                "error": "Invalid query ID"
            }

        # 创建连接池
        pool = await asyncpg.create_pool(
            dsn=DB_URL,
            min_size=1,
            max_size=1
        )

        # 准备查询参数
        query_params = []
        if query_id in DEFAULT_PARAMS:
            query_params = DEFAULT_PARAMS[query_id]
            # 替换默认参数
            for i, param in enumerate(TPC_H_QUERIES[query_id].get("parameters", [])):
                if param["name"] in parameters:
                    query_params[i] = parameters[param["name"]]

        # 执行查询
        result = await run_query(pool, query_id, query_params)
        await pool.close()

        return result

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/tpch/concurrent")
async def tpch_concurrent(request: Request):
    """并发执行TPC-H查询"""
    try:
        body = await request.json()
        query_ids: List[str] = body.get("queryIds", ["Q1"])
        concurrency: int = body.get("concurrency", 1)
        duration: int = body.get("duration", 60)  # 测试持续时间（秒）
        params: Dict = body.get("params", {})  # 查询参数

        # 创建连接池
        pool = await asyncpg.create_pool(
            dsn=DB_URL,
            min_size=1,
            max_size=concurrency
        )

        # 执行并发查询
        start_time = asyncio.get_event_loop().time()
        end_time = start_time + duration
        results = []
        
        while asyncio.get_event_loop().time() < end_time:
            tasks = []
            for i in range(concurrency):
                qid = query_ids[i % len(query_ids)]
                query_params = params.get(qid, DEFAULT_PARAMS.get(qid, []))
                tasks.append(run_query(pool, qid, query_params))
            
            batch_results = await asyncio.gather(*tasks)
            results.extend(batch_results)
            
            # 短暂休眠以避免过度消耗资源
            await asyncio.sleep(0.1)

        await pool.close()

        # 计算统计信息
        successful_queries = [r for r in results if r["success"]]
        failed_queries = [r for r in results if not r["success"]]
        
        total_time = asyncio.get_event_loop().time() - start_time
        avg_response_time = sum(r["executionTime"] for r in successful_queries) / len(successful_queries) if successful_queries else 0
        throughput = len(successful_queries) / total_time if total_time > 0 else 0
        error_rate = len(failed_queries) / len(results) * 100 if results else 0

        return {
            "success": True,
            "summary": {
                "totalQueries": len(results),
                "successfulQueries": len(successful_queries),
                "failedQueries": len(failed_queries),
                "avgResponseTime": avg_response_time,
                "throughput": throughput,
                "errorRate": error_rate,
                "duration": total_time
            },
            "results": results
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/tpch/queries")
async def get_queries():
    """获取可用的TPC-H查询列表"""
    return {
        "queries": {
            qid: {
                "name": info["name"],
                "description": info["description"],
                "complexity": info["complexity"],
                "estimatedTime": info["estimatedTime"],
                "parameters": info.get("parameters", [])
            }
            for qid, info in TPC_H_QUERIES.items()
        }
    }

@app.get("/")
async def root():
    return {"message": "TPC API Server"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
```

# start.sh

```shell
#!/bin/bash

# 安装依赖
pip install -r requirements.txt
 
# 启动 FastAPI 服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 
```

# tpcc/transactions.py

```python
import asyncio
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import asyncpg
import traceback

class TPCCTransaction:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def new_order(
        self,
        w_id: int,
        d_id: int,
        c_id: int,
        items: List[Dict],
        o_id: int  # 添加订单ID参数
    ):
        """新订单事务"""
        try:
            async with self.pool.acquire() as conn:
                # 检查客户是否存在
                customer = await conn.fetchrow("""
                    SELECT c_id, c_first, c_middle, c_last, c_balance
                    FROM tpcc_customer
                    WHERE c_w_id = $1 AND c_d_id = $2 AND c_id = $3
                """, w_id, d_id, c_id)

                if not customer:
                    raise ValueError(f"客户不存在: 仓库ID={w_id}, 区域ID={d_id}, 客户ID={c_id}")

                # 创建订单
                await conn.execute("""
                    INSERT INTO tpcc_orders (
                        o_w_id, o_d_id, o_id, o_c_id, o_carrier_id,
                        o_ol_cnt, o_all_local, o_entry_d
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                """, w_id, d_id, o_id, c_id, None, len(items), 1)

                # 创建订单项
                total_amount = 0
                for i, item in enumerate(items, 1):
                    # 获取商品价格
                    item_info = await conn.fetchrow("""
                        SELECT i_price
                        FROM tpcc_item
                        WHERE i_id = $1
                    """, item['i_id'])

                    if not item_info:
                        raise ValueError(f"商品不存在: ID={item['i_id']}")

                    # 计算订单项金额
                    amount = item_info['i_price'] * item['quantity']
                    total_amount += amount

                    await conn.execute("""
                        INSERT INTO tpcc_order_line (
                            ol_w_id, ol_d_id, ol_o_id, ol_number,
                            ol_i_id, ol_supply_w_id, ol_quantity,
                            ol_amount, ol_dist_info
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    """, w_id, d_id, o_id, i, item['i_id'], w_id, item['quantity'],
                        amount, f"DIST_{d_id}")

                return {
                    "order_id": o_id,
                    "customer_id": c_id,
                    "customer_name": f"{customer['c_first']} {customer['c_middle']} {customer['c_last']}",
                    "warehouse_id": w_id,
                    "district_id": d_id,
                    "items": items,
                    "total_amount": total_amount
                }

        except Exception as e:
            print(f"新订单事务执行失败: {str(e)}")
            print(traceback.format_exc())
            raise

    async def payment(self, w_id: int, d_id: int, c_id: int, amount: float) -> Dict:
        """付款事务"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.transaction():
                    # 1. 获取客户信息
                    customer = await conn.fetchrow(
                        "SELECT c_balance, c_ytd_payment, c_payment_cnt, c_credit, c_data FROM tpcc_customer WHERE c_w_id = $1 AND c_d_id = $2 AND c_id = $3",
                        w_id, d_id, c_id
                    )
                    if not customer:
                        return {
                            "success": False,
                            "message": f"客户不存在: w_id={w_id}, d_id={d_id}, c_id={c_id}",
                            "data": None
                        }

                    # 2. 更新客户余额
                    new_balance = float(customer['c_balance']) - float(amount)
                    new_ytd_payment = float(customer['c_ytd_payment']) + float(amount)
                    new_payment_cnt = customer['c_payment_cnt'] + 1

                    await conn.execute(
                        """
                        UPDATE tpcc_customer 
                        SET c_balance = $1, c_ytd_payment = $2, c_payment_cnt = $3
                        WHERE c_w_id = $4 AND c_d_id = $5 AND c_id = $6
                        """,
                        new_balance, new_ytd_payment, new_payment_cnt, w_id, d_id, c_id
                    )

                    # 3. 更新仓库和地区余额
                    await conn.execute(
                        "UPDATE tpcc_warehouse SET w_ytd = w_ytd + $1 WHERE w_id = $2",
                        float(amount), w_id
                    )
                    await conn.execute(
                        "UPDATE tpcc_district SET d_ytd = d_ytd + $1 WHERE d_w_id = $2 AND d_id = $3",
                        float(amount), w_id, d_id
                    )

                    # 4. 记录历史
                    current_time = datetime.now()
                    history_data = f"Payment {current_time.strftime('%Y%m%d%H%M%S')}"
                    await conn.execute(
                        """
                        INSERT INTO tpcc_history (h_c_id, h_c_d_id, h_c_w_id, h_d_id, h_w_id, h_date, h_amount, h_data)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        """,
                        c_id, d_id, w_id, d_id, w_id, current_time, float(amount), history_data[:24]
                    )

                    return {
                        "success": True,
                        "data": {
                            'customer': {
                                'id': c_id,
                                'balance': new_balance,
                                'ytd_payment': new_ytd_payment,
                                'payment_cnt': new_payment_cnt
                            },
                            'amount': float(amount)
                        }
                    }
        except Exception as e:
            print(f"支付事务执行失败: {str(e)}")
            print(traceback.format_exc())
            return {
                "success": False,
                "message": f"支付事务执行失败: {str(e)}",
                "data": None
            }

    async def order_status(self, w_id: int, d_id: int, c_id: int) -> Dict:
        """订单状态查询事务"""
        try:
            async with self.pool.acquire() as conn:
                # 1. 获取客户信息
                print(f"正在查询客户信息: w_id={w_id}, d_id={d_id}, c_id={c_id}")
                customer = await conn.fetchrow(
                    "SELECT c_balance, c_first, c_middle, c_last FROM tpcc_customer WHERE c_w_id = $1 AND c_d_id = $2 AND c_id = $3",
                    w_id, d_id, c_id
                )
                if not customer:
                    print(f"客户不存在: w_id={w_id}, d_id={d_id}, c_id={c_id}")
                    raise ValueError(f"Customer not found: w_id={w_id}, d_id={d_id}, c_id={c_id}")

                # 2. 获取最近订单（修改为获取最近10个订单）
                print(f"正在查询最近订单: w_id={w_id}, d_id={d_id}, c_id={c_id}")
                orders = await conn.fetch(
                    """
                    SELECT o_id, o_entry_d, o_carrier_id
                    FROM tpcc_orders
                    WHERE o_w_id = $1 AND o_d_id = $2 AND o_c_id = $3
                    ORDER BY o_id DESC
                    LIMIT 10
                    """,
                    w_id, d_id, c_id
                )

                if not orders:
                    print(f"客户没有订单记录: w_id={w_id}, d_id={d_id}, c_id={c_id}")
                    return {
                        'customer': {
                            'id': c_id,
                            'name': f"{customer['c_first']} {customer['c_middle']} {customer['c_last']}",
                            'balance': customer['c_balance']
                        },
                        'orders': []
                    }

                # 3. 获取所有订单的订单项
                order_results = []
                for order in orders:
                    print(f"正在查询订单项: w_id={w_id}, d_id={d_id}, o_id={order['o_id']}")
                    order_lines = await conn.fetch(
                        """
                        SELECT ol_number, ol_i_id, ol_supply_w_id, ol_quantity, ol_amount, ol_delivery_d
                        FROM tpcc_order_line
                        WHERE ol_w_id = $1 AND ol_d_id = $2 AND ol_o_id = $3
                        ORDER BY ol_number
                        """,
                        w_id, d_id, order['o_id']
                    )

                    order_results.append({
                        'order_id': order['o_id'],
                        'entry_date': order['o_entry_d'],
                        'carrier_id': order['o_carrier_id'],
                        'items': [{
                            'number': ol['ol_number'],
                            'item_id': ol['ol_i_id'],
                            'supply_w_id': ol['ol_supply_w_id'],
                            'quantity': ol['ol_quantity'],
                            'amount': ol['ol_amount'],
                            'delivery_date': ol['ol_delivery_d']
                        } for ol in order_lines]
                    })

                return {
                    'customer': {
                        'id': c_id,
                        'name': f"{customer['c_first']} {customer['c_middle']} {customer['c_last']}",
                        'balance': customer['c_balance']
                    },
                    'orders': order_results
                }
        except asyncpg.PostgresError as e:
            print(f"数据库错误: {str(e)}")
            print(f"错误详情: {traceback.format_exc()}")
            raise ValueError(f"数据库错误: {str(e)}")
        except Exception as e:
            print(f"未知错误: {str(e)}")
            print(f"错误详情: {traceback.format_exc()}")
            raise ValueError(f"未知错误: {str(e)}")

    async def delivery(self, w_id: int, d_id: int, o_id: int, carrier_id: int) -> Dict:
        """配送事务"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.transaction():
                    # 1. 检查订单是否存在且未发货
                    order = await conn.fetchrow(
                        """
                        SELECT o_id, o_c_id
                        FROM tpcc_orders
                        WHERE o_w_id = $1 AND o_d_id = $2 AND o_id = $3 AND o_carrier_id IS NULL
                        """,
                        w_id, d_id, o_id
                    )

                    if not order:
                        return {
                            "success": False,
                            "message": f"订单不存在或已发货: 仓库ID={w_id}, 区域ID={d_id}, 订单ID={o_id}",
                            "data": None
                        }

                    # 2. 更新订单配送信息
                    await conn.execute(
                        """
                        UPDATE tpcc_orders
                        SET o_carrier_id = $1
                        WHERE o_w_id = $2 AND o_d_id = $3 AND o_id = $4
                        """,
                        carrier_id, w_id, d_id, o_id
                    )

                    # 3. 更新订单项配送信息
                    await conn.execute(
                        """
                        UPDATE tpcc_order_line
                        SET ol_delivery_d = $1
                        WHERE ol_w_id = $2 AND ol_d_id = $3 AND ol_o_id = $4
                        """,
                        datetime.now(), w_id, d_id, o_id
                    )

                    # 4. 更新客户配送计数
                    await conn.execute(
                        """
                        UPDATE tpcc_customer
                        SET c_delivery_cnt = c_delivery_cnt + 1
                        WHERE c_w_id = $1 AND c_d_id = $2 AND c_id = $3
                        """,
                        w_id, d_id, order['o_c_id']
                    )

                    return {
                        "success": True,
                        "data": {
                            'warehouse_id': w_id,
                            'district_id': d_id,
                            'order_id': o_id,
                            'carrier_id': carrier_id,
                            'customer_id': order['o_c_id'],
                            'delivery_date': datetime.now()
                        }
                    }
        except Exception as e:
            print(f"发货事务执行失败: {str(e)}")
            print(traceback.format_exc())
            return {
                "success": False,
                "message": f"发货事务执行失败: {str(e)}",
                "data": None
            }

    async def stock_level(self, w_id: int, d_id: int, threshold: int) -> Dict:
        """库存水平查询事务"""
        async with self.pool.acquire() as conn:
            # 1. 获取最近订单
            recent_orders = await conn.fetch(
                """
                SELECT o_id
                FROM tpcc_orders
                WHERE o_w_id = $1 AND o_d_id = $2
                ORDER BY o_id DESC
                LIMIT 20
                """,
                w_id, d_id
            )

            if not recent_orders:
                return {
                    'warehouse_id': w_id,
                    'district_id': d_id,
                    'threshold': threshold,
                    'low_stock_count': 0,
                    'items': []
                }

            # 2. 获取所有商品的库存信息
            stock_info = await conn.fetch(
                """
                SELECT 
                    s.s_i_id as item_id,
                    i.i_name as item_name,
                    s.s_quantity as quantity,
                    s.s_ytd as ytd,
                    s.s_order_cnt as order_count,
                    s.s_remote_cnt as remote_count,
                    CASE WHEN s.s_quantity < $3 THEN true ELSE false END as is_low_stock
                FROM tpcc_stock s
                JOIN tpcc_item i ON s.s_i_id = i.i_id
                WHERE s.s_w_id = $1
                AND s.s_i_id IN (
                    SELECT DISTINCT ol.ol_i_id
                    FROM tpcc_order_line ol
                    WHERE ol.ol_w_id = $1
                    AND ol.ol_d_id = $2
                    AND ol.ol_o_id IN (
                        SELECT o_id 
                        FROM tpcc_orders 
                        WHERE o_w_id = $1 
                        AND o_d_id = $2 
                        ORDER BY o_id DESC 
                        LIMIT 20
                    )
                )
                ORDER BY s.s_i_id
                """,
                w_id, d_id, threshold
            )

            # 3. 统计低于阈值的商品数量
            low_stock_count = sum(1 for item in stock_info if item['is_low_stock'])

            return {
                'warehouse_id': w_id,
                'district_id': d_id,
                'threshold': threshold,
                'low_stock_count': low_stock_count,
                'items': [{
                    'item_id': item['item_id'],
                    'item_name': item['item_name'],
                    'quantity': item['quantity'],
                    'ytd': item['ytd'],
                    'order_count': item['order_count'],
                    'remote_count': item['remote_count'],
                    'is_low_stock': item['is_low_stock']
                } for item in stock_info]
            } 
```

# tpcc/__init__.py

```python
 
```

# tpcc/api.py

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncpg
from .transactions import TPCCTransaction
import traceback
from fastapi.responses import JSONResponse
import asyncio
from datetime import datetime
import json

router = APIRouter()

# 数据库连接池
pool = None

# 读取数据库配置
def get_db_config():
    try:
        with open("config/database.json", "r") as f:
            config = json.load(f)
            return {
                "user": config["username"],
                "password": config["password"],
                "database": config["database"],
                "host": config["host"],
                "port": config["port"]
            }
    except:
        # 如果配置文件不存在，使用默认配置
        return {
            "user": "tpc_user",
            "password": "tpc_password",
            "database": "tpc_db",
            "host": "localhost",
            "port": 5432
        }

async def get_pool():
    global pool
    if pool is None:
        try:
            config = get_db_config()
            pool = await asyncpg.create_pool(**config)
        except Exception as e:
            print(f"数据库连接错误: {str(e)}")
            print(f"错误详情: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"数据库连接错误: {str(e)}")
    return pool

# 请求模型
class NewOrderRequest(BaseModel):
    w_id: int
    d_id: int
    c_id: int
    items: List[Dict]
    o_id: int

class PaymentRequest(BaseModel):
    w_id: int
    d_id: int
    c_id: int
    amount: float

class OrderStatusRequest(BaseModel):
    w_id: int
    d_id: int
    c_id: int

class DeliveryRequest(BaseModel):
    w_id: int
    d_id: int
    o_id: int
    carrier_id: int

class StockLevelRequest(BaseModel):
    w_id: int
    d_id: int
    threshold: int

class MaxOrderIdRequest(BaseModel):
    w_id: int
    d_id: int

# 添加并发测试请求模型
class ConcurrentTestRequest(BaseModel):
    transaction_types: List[str]  # 要测试的事务类型列表
    concurrency: int  # 并发数
    duration: int  # 测试持续时间（秒）
    params: Dict  # 测试参数

# 路由处理函数
@router.post("/new-order")
async def new_order(request: NewOrderRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.new_order(
            request.w_id,
            request.d_id,
            request.c_id,
            request.items,
            request.o_id
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/payment")
async def payment(request: PaymentRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.payment(
            request.w_id,
            request.d_id,
            request.c_id,
            request.amount
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/order-status")
async def order_status(request: OrderStatusRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.order_status(
            request.w_id,
            request.d_id,
            request.c_id
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/delivery")
async def delivery(request: DeliveryRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.delivery(
            request.w_id,
            request.d_id,
            request.o_id,
            request.carrier_id
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/stock-level")
async def stock_level(request: StockLevelRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.stock_level(
            request.w_id,
            request.d_id,
            request.threshold
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/max-order-id")
async def get_max_order_id(request: MaxOrderIdRequest):
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            # 查询当前最大订单ID
            max_order_id = await conn.fetchval("""
                SELECT COALESCE(MAX(o_id), 0)
                FROM tpcc_orders
                WHERE o_w_id = $1 AND o_d_id = $2
            """, request.w_id, request.d_id)
            
            return {
                "success": True,
                "data": {
                    "max_order_id": max_order_id
                }
            }
    except Exception as e:
        print(f"获取最大订单ID失败: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(e)}
        )

# 添加并发测试路由
@router.post("/concurrent")
async def concurrent_test(request: ConcurrentTestRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        
        # 记录开始时间
        start_time = asyncio.get_event_loop().time()
        end_time = start_time + request.duration
        results = []
        
        # 执行并发测试
        while asyncio.get_event_loop().time() < end_time:
            tasks = []
            for i in range(request.concurrency):
                # 随机选择一个事务类型
                transaction_type = request.transaction_types[i % len(request.transaction_types)]
                
                # 根据事务类型准备参数
                if transaction_type == "NEW_ORDER":
                    # 获取最大订单ID
                    max_order_id = await pool.fetchval("""
                        SELECT COALESCE(MAX(o_id), 0)
                        FROM tpcc_orders
                        WHERE o_w_id = $1 AND o_d_id = $2
                    """, 1, 1)  # 使用默认的仓库和区域ID
                    
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "c_id": 1,
                        "o_id": max_order_id + 1,
                        "items": [{"i_id": 1, "quantity": 1}]
                    }
                elif transaction_type == "PAYMENT":
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "c_id": 1,
                        "amount": 100.0
                    }
                elif transaction_type == "ORDER_STATUS":
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "c_id": 1
                    }
                elif transaction_type == "DELIVERY":
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "o_id": 1,
                        "carrier_id": 1
                    }
                else:  # STOCK_LEVEL
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "threshold": 10
                    }
                
                # 创建任务
                if transaction_type == "NEW_ORDER":
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.new_order(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
                elif transaction_type == "PAYMENT":
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.payment(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
                elif transaction_type == "ORDER_STATUS":
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.order_status(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
                elif transaction_type == "DELIVERY":
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.delivery(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
                else:  # STOCK_LEVEL
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.stock_level(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
            
            # 短暂休眠以避免过度消耗资源
            await asyncio.sleep(0.1)
        
        # 计算统计信息
        successful_transactions = [r for r in results if r["success"]]
        failed_transactions = [r for r in results if not r["success"]]
        
        total_time = asyncio.get_event_loop().time() - start_time
        throughput = len(successful_transactions) / total_time if total_time > 0 else 0
        error_rate = len(failed_transactions) / len(results) * 100 if results else 0
        
        # 计算平均响应时间
        avg_response_time = 0
        if successful_transactions:
            total_response_time = sum(r.get("executionTime", 0) for r in successful_transactions)
            avg_response_time = total_response_time / len(successful_transactions)
        
        return {
            "success": True,
            "summary": {
                "totalTransactions": len(results),
                "successfulTransactions": len(successful_transactions),
                "failedTransactions": len(failed_transactions),
                "throughput": throughput,
                "errorRate": error_rate,
                "avgResponseTime": avg_response_time,
                "duration": total_time
            },
            "results": results
        }
        
    except Exception as e:
        print(f"并发测试执行失败: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        ) 
```

# tpcc/data_generator.py

```python
import asyncio
import random
from datetime import datetime, timedelta
import asyncpg
from typing import List, Dict

class TPCCDataGenerator:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def generate_warehouse(self, w_id: int) -> None:
        """生成仓库数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_warehouse (w_id, w_name, w_street_1, w_street_2, w_city, w_state, w_zip, w_tax, w_ytd)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """,
            w_id,
            f"WAREHOUSE{w_id}",
            f"Street {w_id}",
            None,
            f"City {w_id}",
            "ST",
            f"{w_id:05d}",
            random.uniform(0.1, 0.2),
            300000.00
        )

    async def generate_district(self, w_id: int, d_id: int) -> None:
        """生成地区数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_district (d_id, d_w_id, d_name, d_street_1, d_street_2, d_city, d_state, d_zip, d_tax, d_ytd, d_next_o_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """,
            d_id,
            w_id,
            f"DISTRICT{d_id}",
            f"Street {d_id}",
            None,
            f"City {d_id}",
            "ST",
            f"{d_id:05d}",
            random.uniform(0.1, 0.2),
            30000.00,
            3001
        )

    async def generate_customer(self, w_id: int, d_id: int, c_id: int) -> None:
        """生成客户数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_customer (c_id, c_d_id, c_w_id, c_first, c_middle, c_last, c_street_1, c_street_2, c_city, c_state, c_zip, c_phone, c_since, c_credit, c_credit_lim, c_discount, c_balance, c_ytd_payment, c_payment_cnt, c_delivery_cnt, c_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            """,
            c_id,
            d_id,
            w_id,
            f"First{c_id}",
            "OE",
            f"Last{c_id}",
            f"Street {c_id}",
            None,
            f"City {c_id}",
            "ST",
            f"{c_id:05d}",
            f"{c_id:010d}",
            datetime.now(),
            "GC",
            50000.00,
            random.uniform(0.0, 0.5),
            0.00,
            0.00,
            0,
            0,
            f"Customer data for {c_id}"
        )

    async def generate_item(self, i_id: int) -> None:
        """生成商品数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_item (i_id, i_im_id, i_name, i_price, i_data)
            VALUES ($1, $2, $3, $4, $5)
            """,
            i_id,
            random.randint(1, 10000),
            f"Item {i_id}",
            random.uniform(1.00, 100.00),
            f"Item data for {i_id}"
        )

    async def generate_stock(self, w_id: int, i_id: int) -> None:
        """生成库存数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_stock (s_i_id, s_w_id, s_quantity, s_dist_01, s_dist_02, s_dist_03, s_dist_04, s_dist_05, s_dist_06, s_dist_07, s_dist_08, s_dist_09, s_dist_10, s_ytd, s_order_cnt, s_remote_cnt, s_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            """,
            i_id,
            w_id,
            random.randint(10, 100),
            f"Dist {w_id}-1",
            f"Dist {w_id}-2",
            f"Dist {w_id}-3",
            f"Dist {w_id}-4",
            f"Dist {w_id}-5",
            f"Dist {w_id}-6",
            f"Dist {w_id}-7",
            f"Dist {w_id}-8",
            f"Dist {w_id}-9",
            f"Dist {w_id}-10",
            0,
            0,
            0,
            f"Stock data for {w_id}-{i_id}"
        )

    async def generate_data(self, num_warehouses: int = 1) -> None:
        """生成完整的 TPC-C 测试数据"""
        # 生成仓库
        for w_id in range(1, num_warehouses + 1):
            await self.generate_warehouse(w_id)
            
            # 生成地区
            for d_id in range(1, 11):
                await self.generate_district(w_id, d_id)
                
                # 生成客户
                for c_id in range(1, 3001):
                    await self.generate_customer(w_id, d_id, c_id)

        # 生成商品
        for i_id in range(1, 100001):
            await self.generate_item(i_id)
            
            # 生成库存
            for w_id in range(1, num_warehouses + 1):
                await self.generate_stock(w_id, i_id)

async def main():
    # 创建数据库连接池
    pool = await asyncpg.create_pool(
        user="tpc_user",
        password="tpc_password",
        database="tpc_db",
        host="localhost",
        port=5432
    )

    # 创建数据生成器
    generator = TPCCDataGenerator(pool)

    # 生成数据
    print("开始生成 TPC-C 测试数据...")
    await generator.generate_data(num_warehouses=1)
    print("数据生成完成！")

    # 关闭连接池
    await pool.close()

if __name__ == "__main__":
    asyncio.run(main()) 
```

# scripts/import_data.py

```python
import os
import asyncio
import asyncpg
from datetime import datetime

# 数据库配置
DB_URL = os.getenv("DATABASE_URL", "postgresql://tpc_user:tpc_password@localhost:5432/tpc_db")

async def import_data():
    """导入TPC-H测试数据"""
    try:
        # 连接数据库
        conn = await asyncpg.connect(DB_URL)
        
        # 开始导入
        print("开始导入数据...")
        start_time = datetime.now()
        
        # 导入nation表
        print("导入nation表...")
        with open('TPC-H V3.0.1/ref_data/nation.tbl', 'r') as f:
            await conn.copy_to_table('tpc.nation', source=f, format='csv', delimiter='|')
        
        # 导入region表
        print("导入region表...")
        with open('TPC-H V3.0.1/ref_data/region.tbl', 'r') as f:
            await conn.copy_to_table('tpc.region', source=f, format='csv', delimiter='|')
        
        # 导入customer表
        print("导入customer表...")
        with open('TPC-H V3.0.1/dbgen/customer.tbl', 'r') as f:
            await conn.copy_to_table('tpc.customer', source=f, format='csv', delimiter='|')
        
        # 导入orders表
        print("导入orders表...")
        with open('TPC-H V3.0.1/dbgen/orders.tbl', 'r') as f:
            await conn.copy_to_table('tpc.orders', source=f, format='csv', delimiter='|')
        
        # 导入lineitem表
        print("导入lineitem表...")
        with open('TPC-H V3.0.1/dbgen/lineitem.tbl', 'r') as f:
            await conn.copy_to_table('tpc.lineitem', source=f, format='csv', delimiter='|')
        
        # 导入part表
        print("导入part表...")
        with open('TPC-H V3.0.1/dbgen/part.tbl', 'r') as f:
            await conn.copy_to_table('tpc.part', source=f, format='csv', delimiter='|')
        
        # 导入supplier表
        print("导入supplier表...")
        with open('TPC-H V3.0.1/dbgen/supplier.tbl', 'r') as f:
            await conn.copy_to_table('tpc.supplier', source=f, format='csv', delimiter='|')
        
        # 导入partsupp表
        print("导入partsupp表...")
        with open('TPC-H V3.0.1/dbgen/partsupp.tbl', 'r') as f:
            await conn.copy_to_table('tpc.partsupp', source=f, format='csv', delimiter='|')
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"数据导入完成！耗时: {duration:.2f} 秒")
        
        # 验证数据
        print("\n验证数据...")
        tables = ['nation', 'region', 'customer', 'orders', 'lineitem', 'part', 'supplier', 'partsupp']
        for table in tables:
            count = await conn.fetchval(f'SELECT COUNT(*) FROM tpc.{table}')
            print(f"{table}表: {count} 条记录")
        
    except Exception as e:
        print(f"导入过程中出错: {str(e)}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(import_data()) 
```

# scripts/truncate_tables.py

```python
import os
import asyncio
import asyncpg
from datetime import datetime

# 数据库配置
DB_URL = os.getenv("DATABASE_URL", "postgresql://tpc_user:tpc_password@localhost:5432/tpc_db")

async def truncate_tables():
    """清空TPC-H表"""
    try:
        # 连接数据库
        conn = await asyncpg.connect(DB_URL)
        
        print("开始清空表...")
        start_time = datetime.now()
        
        # 读取并执行SQL文件
        with open('scripts/truncate_tables.sql', 'r') as f:
            sql = f.read()
            await conn.execute(sql)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"表清空完成！耗时: {duration:.2f} 秒")
        
        # 验证表是否已清空
        tables = ['nation', 'region', 'customer', 'orders', 'lineitem', 'part', 'supplier', 'partsupp']
        for table in tables:
            count = await conn.fetchval(f'SELECT COUNT(*) FROM tpc.{table}')
            print(f"{table}表: {count} 条记录")
        
    except Exception as e:
        print(f"清空表过程中出错: {str(e)}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(truncate_tables()) 
```

# scripts/truncate_tables.sql

```sql
-- 清空 TPC-H 表
TRUNCATE TABLE tpc.lineitem CASCADE;
TRUNCATE TABLE tpc.orders CASCADE;
TRUNCATE TABLE tpc.customer CASCADE;
TRUNCATE TABLE tpc.part CASCADE;
TRUNCATE TABLE tpc.supplier CASCADE;
TRUNCATE TABLE tpc.partsupp CASCADE;
TRUNCATE TABLE tpc.nation CASCADE;
TRUNCATE TABLE tpc.region CASCADE; 
```



# 03-triggers.sql

```sql
-- 设置搜索路径
SET search_path TO tpc, public;

-- 创建导入日志表
CREATE TABLE IF NOT EXISTS import_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    record_count INTEGER NOT NULL,
    import_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    error_message TEXT
);

-- 创建数据验证日志表
CREATE TABLE IF NOT EXISTS validation_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    validation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 为每个表创建导入触发器函数
CREATE OR REPLACE FUNCTION log_import_operation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO import_logs (table_name, operation, record_count, status)
    VALUES (TG_TABLE_NAME, TG_OP, 1, 'SUCCESS');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为每个表创建验证触发器函数
CREATE OR REPLACE FUNCTION validate_record()
RETURNS TRIGGER AS $$
DECLARE
    error_msg TEXT;
BEGIN
    -- 根据表名执行不同的验证
    CASE TG_TABLE_NAME
        WHEN 'customer' THEN
            -- 验证客户数据
            IF NEW.c_acctbal < 0 THEN
                error_msg := '账户余额不能为负数';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.c_custkey, 'c_acctbal', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
            
        WHEN 'orders' THEN
            -- 验证订单数据
            IF NEW.o_totalprice <= 0 THEN
                error_msg := '订单总价必须大于0';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.o_orderkey, 'o_totalprice', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
            
        WHEN 'lineitem' THEN
            -- 验证订单明细数据
            IF NEW.l_quantity <= 0 THEN
                error_msg := '商品数量必须大于0';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.l_orderkey, 'l_quantity', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
            
        WHEN 'part' THEN
            -- 验证零件数据
            IF NEW.p_retailprice <= 0 THEN
                error_msg := '零售价必须大于0';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.p_partkey, 'p_retailprice', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
            
        WHEN 'supplier' THEN
            -- 验证供应商数据
            IF NEW.s_acctbal < 0 THEN
                error_msg := '账户余额不能为负数';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.s_suppkey, 's_acctbal', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为每个表创建触发器
CREATE TRIGGER trg_log_customer_import
    AFTER INSERT ON customer
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_customer
    BEFORE INSERT OR UPDATE ON customer
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

CREATE TRIGGER trg_log_orders_import
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_orders
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

CREATE TRIGGER trg_log_lineitem_import
    AFTER INSERT ON lineitem
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_lineitem
    BEFORE INSERT OR UPDATE ON lineitem
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

CREATE TRIGGER trg_log_part_import
    AFTER INSERT ON part
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_part
    BEFORE INSERT OR UPDATE ON part
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

CREATE TRIGGER trg_log_supplier_import
    AFTER INSERT ON supplier
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_supplier
    BEFORE INSERT OR UPDATE ON supplier
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

-- 添加注释
COMMENT ON TABLE import_logs IS '数据导入日志表';
COMMENT ON TABLE validation_logs IS '数据验证日志表';
COMMENT ON FUNCTION log_import_operation() IS '记录数据导入操作';
COMMENT ON FUNCTION validate_record() IS '验证数据记录'; 
```

# 05-add-new-order-table.sql

```sql
-- 设置搜索路径
SET search_path TO tpc, public;

-- 创建新订单表
CREATE TABLE IF NOT EXISTS tpcc_new_order (
    no_o_id INTEGER NOT NULL,
    no_d_id INTEGER NOT NULL,
    no_w_id INTEGER NOT NULL,
    PRIMARY KEY (no_w_id, no_d_id, no_o_id),
    FOREIGN KEY (no_w_id, no_d_id, no_o_id) REFERENCES tpcc_orders(o_w_id, o_d_id, o_id)
);

-- 创建索引
CREATE INDEX idx_tpcc_new_order ON tpcc_new_order(no_w_id, no_d_id);

-- 添加注释
COMMENT ON TABLE tpcc_new_order IS 'TPC-C 新订单表'; 
```

# 06-tpcc-test-data.sql

```sql
-- 设置搜索路径
SET search_path TO tpc, public;

-- 插入仓库数据
INSERT INTO tpcc_warehouse (w_id, w_name, w_street_1, w_street_2, w_city, w_state, w_zip, w_tax, w_ytd)
VALUES 
(1, '仓库1', '街道1', '街道2', '城市1', 'ST', '123456789', 0.1, 1000000.00),
(2, '仓库2', '街道3', '街道4', '城市2', 'ST', '987654321', 0.1, 1000000.00);

-- 插入区域数据
INSERT INTO tpcc_district (d_id, d_w_id, d_name, d_street_1, d_street_2, d_city, d_state, d_zip, d_tax, d_ytd, d_next_o_id)
VALUES 
(1, 1, '区域1', '街道1', '街道2', '城市1', 'ST', '123456789', 0.1, 100000.00, 1),
(2, 1, '区域2', '街道3', '街道4', '城市1', 'ST', '123456789', 0.1, 100000.00, 1),
(1, 2, '区域1', '街道1', '街道2', '城市2', 'ST', '987654321', 0.1, 100000.00, 1),
(2, 2, '区域2', '街道3', '街道4', '城市2', 'ST', '987654321', 0.1, 100000.00, 1);

-- 插入客户数据
INSERT INTO tpcc_customer (c_id, c_d_id, c_w_id, c_first, c_middle, c_last, c_street_1, c_street_2, c_city, c_state, c_zip, c_phone, c_since, c_credit, c_credit_lim, c_discount, c_balance, c_ytd_payment, c_payment_cnt, c_delivery_cnt, c_data)
VALUES 
(1, 1, 1, '张', '三', '客户1', '街道1', '街道2', '城市1', 'ST', '123456789', '1234567890', CURRENT_TIMESTAMP, 'GC', 50000.00, 0.1, 0.00, 0.00, 0, 0, '客户数据1'),
(2, 1, 1, '李', '四', '客户2', '街道3', '街道4', '城市1', 'ST', '123456789', '1234567891', CURRENT_TIMESTAMP, 'GC', 50000.00, 0.1, 0.00, 0.00, 0, 0, '客户数据2'),
(1, 1, 2, '王', '五', '客户3', '街道1', '街道2', '城市2', 'ST', '987654321', '1234567892', CURRENT_TIMESTAMP, 'GC', 50000.00, 0.1, 0.00, 0.00, 0, 0, '客户数据3'),
(2, 1, 2, '赵', '六', '客户4', '街道3', '街道4', '城市2', 'ST', '987654321', '1234567893', CURRENT_TIMESTAMP, 'GC', 50000.00, 0.1, 0.00, 0.00, 0, 0, '客户数据4');

-- 插入商品数据
INSERT INTO tpcc_item (i_id, i_im_id, i_name, i_price, i_data)
VALUES 
(1, 1, '商品1', 100.00, '商品数据1'),
(2, 2, '商品2', 200.00, '商品数据2'),
(3, 3, '商品3', 300.00, '商品数据3');

-- 插入库存数据
INSERT INTO tpcc_stock (s_i_id, s_w_id, s_quantity, s_dist_01, s_dist_02, s_dist_03, s_dist_04, s_dist_05, s_dist_06, s_dist_07, s_dist_08, s_dist_09, s_dist_10, s_ytd, s_order_cnt, s_remote_cnt, s_data)
VALUES 
(1, 1, 100, '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', 0, 0, 0, '库存数据1'),
(2, 1, 100, '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', 0, 0, 0, '库存数据2'),
(3, 1, 100, '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', 0, 0, 0, '库存数据3');

-- 插入订单数据
INSERT INTO tpcc_orders (o_id, o_d_id, o_w_id, o_c_id, o_entry_d, o_carrier_id, o_ol_cnt, o_all_local)
VALUES 
(1, 1, 1, 1, CURRENT_TIMESTAMP, NULL, 1, 1);

-- 插入订单明细数据
INSERT INTO tpcc_order_line (ol_o_id, ol_d_id, ol_w_id, ol_number, ol_i_id, ol_supply_w_id, ol_delivery_d, ol_quantity, ol_amount, ol_dist_info)
VALUES 
(1, 1, 1, 1, 1, 1, NULL, 1, 100.00, '订单明细数据1');

-- 插入新订单数据
INSERT INTO tpcc_new_order (no_o_id, no_d_id, no_w_id)
VALUES 
(1, 1, 1);

-- 插入历史记录数据
INSERT INTO tpcc_history (h_c_id, h_c_d_id, h_c_w_id, h_d_id, h_w_id, h_date, h_amount, h_data)
VALUES 
(1, 1, 1, 1, 1, CURRENT_TIMESTAMP, 100.00, '历史记录数据1'); 
```

# 02-tpc-tables.sql

```sql
-- 设置搜索路径
SET search_path TO tpc, public;

-- 创建NATION表
CREATE TABLE IF NOT EXISTS nation (
    n_nationkey INTEGER PRIMARY KEY,
    n_name CHAR(25) NOT NULL,
    n_regionkey INTEGER NOT NULL,
    n_comment VARCHAR(152)
);

-- 创建REGION表
CREATE TABLE IF NOT EXISTS region (
    r_regionkey INTEGER PRIMARY KEY,
    r_name CHAR(25) NOT NULL,
    r_comment VARCHAR(152)
);

-- 创建PART表
CREATE TABLE IF NOT EXISTS part (
    p_partkey INTEGER PRIMARY KEY,
    p_name VARCHAR(55) NOT NULL,
    p_mfgr CHAR(25) NOT NULL,
    p_brand CHAR(10) NOT NULL,
    p_type VARCHAR(25) NOT NULL,
    p_size INTEGER NOT NULL,
    p_container CHAR(10) NOT NULL,
    p_retailprice DECIMAL(15,2) NOT NULL,
    p_comment VARCHAR(23) NOT NULL
);

-- 创建SUPPLIER表
CREATE TABLE IF NOT EXISTS supplier (
    s_suppkey INTEGER PRIMARY KEY,
    s_name CHAR(25) NOT NULL,
    s_address VARCHAR(40) NOT NULL,
    s_nationkey INTEGER NOT NULL,
    s_phone CHAR(15) NOT NULL,
    s_acctbal DECIMAL(15,2) NOT NULL,
    s_comment VARCHAR(101) NOT NULL,
    FOREIGN KEY (s_nationkey) REFERENCES nation(n_nationkey)
);

-- 创建PARTSUPP表
CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey INTEGER NOT NULL,
    ps_suppkey INTEGER NOT NULL,
    ps_availqty INTEGER NOT NULL,
    ps_supplycost DECIMAL(15,2) NOT NULL,
    ps_comment VARCHAR(199) NOT NULL,
    PRIMARY KEY (ps_partkey, ps_suppkey),
    FOREIGN KEY (ps_partkey) REFERENCES part(p_partkey),
    FOREIGN KEY (ps_suppkey) REFERENCES supplier(s_suppkey)
);

-- 创建CUSTOMER表
CREATE TABLE IF NOT EXISTS customer (
    c_custkey INTEGER PRIMARY KEY,
    c_name VARCHAR(25) NOT NULL,
    c_address VARCHAR(40) NOT NULL,
    c_nationkey INTEGER NOT NULL,
    c_phone CHAR(15) NOT NULL,
    c_acctbal DECIMAL(15,2) NOT NULL,
    c_mktsegment CHAR(10) NOT NULL,
    c_comment VARCHAR(117) NOT NULL,
    FOREIGN KEY (c_nationkey) REFERENCES nation(n_nationkey)
);

-- 创建ORDERS表
CREATE TABLE IF NOT EXISTS orders (
    o_orderkey INTEGER PRIMARY KEY,
    o_custkey INTEGER NOT NULL,
    o_orderstatus CHAR(1) NOT NULL,
    o_totalprice DECIMAL(15,2) NOT NULL,
    o_orderdate DATE NOT NULL,
    o_orderpriority CHAR(15) NOT NULL,
    o_clerk CHAR(15) NOT NULL,
    o_shippriority INTEGER NOT NULL,
    o_comment VARCHAR(79) NOT NULL,
    FOREIGN KEY (o_custkey) REFERENCES customer(c_custkey)
);

-- 创建LINEITEM表
CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey INTEGER NOT NULL,
    l_partkey INTEGER NOT NULL,
    l_suppkey INTEGER NOT NULL,
    l_linenumber INTEGER NOT NULL,
    l_quantity DECIMAL(15,2) NOT NULL,
    l_extendedprice DECIMAL(15,2) NOT NULL,
    l_discount DECIMAL(15,2) NOT NULL,
    l_tax DECIMAL(15,2) NOT NULL,
    l_returnflag CHAR(1) NOT NULL,
    l_linestatus CHAR(1) NOT NULL,
    l_shipdate DATE NOT NULL,
    l_commitdate DATE NOT NULL,
    l_receiptdate DATE NOT NULL,
    l_shipinstruct CHAR(25) NOT NULL,
    l_shipmode CHAR(10) NOT NULL,
    l_comment VARCHAR(44) NOT NULL,
    PRIMARY KEY (l_orderkey, l_linenumber),
    FOREIGN KEY (l_orderkey) REFERENCES orders(o_orderkey),
    FOREIGN KEY (l_partkey, l_suppkey) REFERENCES partsupp(ps_partkey, ps_suppkey)
);

-- 创建索引
CREATE INDEX idx_nation_regionkey ON nation(n_regionkey);
CREATE INDEX idx_supplier_nationkey ON supplier(s_nationkey);
CREATE INDEX idx_customer_nationkey ON customer(c_nationkey);
CREATE INDEX idx_orders_custkey ON orders(o_custkey);
CREATE INDEX idx_orders_orderdate ON orders(o_orderdate);
CREATE INDEX idx_lineitem_orderkey ON lineitem(l_orderkey);
CREATE INDEX idx_lineitem_partkey ON lineitem(l_partkey);
CREATE INDEX idx_lineitem_suppkey ON lineitem(l_suppkey);
CREATE INDEX idx_lineitem_shipdate ON lineitem(l_shipdate);
CREATE INDEX idx_lineitem_commitdate ON lineitem(l_commitdate);
CREATE INDEX idx_lineitem_receiptdate ON lineitem(l_receiptdate);
CREATE INDEX idx_partsupp_partkey ON partsupp(ps_partkey);
CREATE INDEX idx_partsupp_suppkey ON partsupp(ps_suppkey);

-- 添加注释
COMMENT ON TABLE nation IS '国家信息表';
COMMENT ON TABLE region IS '地区信息表';
COMMENT ON TABLE part IS '零件信息表';
COMMENT ON TABLE supplier IS '供应商信息表';
COMMENT ON TABLE partsupp IS '零件供应商关联表';
COMMENT ON TABLE customer IS '客户信息表';
COMMENT ON TABLE orders IS '订单信息表';
COMMENT ON TABLE lineitem IS '订单明细表';

-- TPC-C 表结构
-- 仓库表
CREATE TABLE IF NOT EXISTS tpcc_warehouse (
    w_id INTEGER PRIMARY KEY,
    w_name VARCHAR(10) NOT NULL,
    w_street_1 VARCHAR(20) NOT NULL,
    w_street_2 VARCHAR(20),
    w_city VARCHAR(20) NOT NULL,
    w_state CHAR(2) NOT NULL,
    w_zip CHAR(9) NOT NULL,
    w_tax DECIMAL(4,4) NOT NULL,
    w_ytd DECIMAL(12,2) NOT NULL
);

-- 地区表
CREATE TABLE IF NOT EXISTS tpcc_district (
    d_id INTEGER NOT NULL,
    d_w_id INTEGER NOT NULL,
    d_name VARCHAR(10) NOT NULL,
    d_street_1 VARCHAR(20) NOT NULL,
    d_street_2 VARCHAR(20),
    d_city VARCHAR(20) NOT NULL,
    d_state CHAR(2) NOT NULL,
    d_zip CHAR(9) NOT NULL,
    d_tax DECIMAL(4,4) NOT NULL,
    d_ytd DECIMAL(12,2) NOT NULL,
    d_next_o_id INTEGER NOT NULL,
    PRIMARY KEY (d_w_id, d_id),
    FOREIGN KEY (d_w_id) REFERENCES tpcc_warehouse(w_id)
);

-- 客户表
CREATE TABLE IF NOT EXISTS tpcc_customer (
    c_id INTEGER NOT NULL,
    c_d_id INTEGER NOT NULL,
    c_w_id INTEGER NOT NULL,
    c_first VARCHAR(16) NOT NULL,
    c_middle CHAR(2) NOT NULL,
    c_last VARCHAR(16) NOT NULL,
    c_street_1 VARCHAR(20) NOT NULL,
    c_street_2 VARCHAR(20),
    c_city VARCHAR(20) NOT NULL,
    c_state CHAR(2) NOT NULL,
    c_zip CHAR(9) NOT NULL,
    c_phone CHAR(16) NOT NULL,
    c_since TIMESTAMP NOT NULL,
    c_credit CHAR(2) NOT NULL,
    c_credit_lim DECIMAL(12,2) NOT NULL,
    c_discount DECIMAL(4,4) NOT NULL,
    c_balance DECIMAL(12,2) NOT NULL,
    c_ytd_payment DECIMAL(12,2) NOT NULL,
    c_payment_cnt INTEGER NOT NULL,
    c_delivery_cnt INTEGER NOT NULL,
    c_data VARCHAR(500) NOT NULL,
    PRIMARY KEY (c_w_id, c_d_id, c_id),
    FOREIGN KEY (c_w_id, c_d_id) REFERENCES tpcc_district(d_w_id, d_id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS tpcc_orders (
    o_id INTEGER NOT NULL,
    o_d_id INTEGER NOT NULL,
    o_w_id INTEGER NOT NULL,
    o_c_id INTEGER NOT NULL,
    o_entry_d TIMESTAMP NOT NULL,
    o_carrier_id INTEGER,
    o_ol_cnt INTEGER NOT NULL,
    o_all_local INTEGER NOT NULL,
    PRIMARY KEY (o_w_id, o_d_id, o_id),
    FOREIGN KEY (o_w_id, o_d_id, o_c_id) REFERENCES tpcc_customer(c_w_id, c_d_id, c_id)
);

-- 订单明细表
CREATE TABLE IF NOT EXISTS tpcc_order_line (
    ol_o_id INTEGER NOT NULL,
    ol_d_id INTEGER NOT NULL,
    ol_w_id INTEGER NOT NULL,
    ol_number INTEGER NOT NULL,
    ol_i_id INTEGER NOT NULL,
    ol_supply_w_id INTEGER NOT NULL,
    ol_delivery_d TIMESTAMP,
    ol_quantity INTEGER NOT NULL,
    ol_amount DECIMAL(6,2) NOT NULL,
    ol_dist_info CHAR(24) NOT NULL,
    PRIMARY KEY (ol_w_id, ol_d_id, ol_o_id, ol_number),
    FOREIGN KEY (ol_w_id, ol_d_id, ol_o_id) REFERENCES tpcc_orders(o_w_id, o_d_id, o_id)
);

-- 商品表
CREATE TABLE IF NOT EXISTS tpcc_item (
    i_id INTEGER PRIMARY KEY,
    i_im_id INTEGER NOT NULL,
    i_name VARCHAR(24) NOT NULL,
    i_price DECIMAL(5,2) NOT NULL,
    i_data VARCHAR(50) NOT NULL
);

-- 库存表
CREATE TABLE IF NOT EXISTS tpcc_stock (
    s_i_id INTEGER NOT NULL,
    s_w_id INTEGER NOT NULL,
    s_quantity INTEGER NOT NULL,
    s_dist_01 CHAR(24) NOT NULL,
    s_dist_02 CHAR(24) NOT NULL,
    s_dist_03 CHAR(24) NOT NULL,
    s_dist_04 CHAR(24) NOT NULL,
    s_dist_05 CHAR(24) NOT NULL,
    s_dist_06 CHAR(24) NOT NULL,
    s_dist_07 CHAR(24) NOT NULL,
    s_dist_08 CHAR(24) NOT NULL,
    s_dist_09 CHAR(24) NOT NULL,
    s_dist_10 CHAR(24) NOT NULL,
    s_ytd INTEGER NOT NULL,
    s_order_cnt INTEGER NOT NULL,
    s_remote_cnt INTEGER NOT NULL,
    s_data VARCHAR(50) NOT NULL,
    PRIMARY KEY (s_w_id, s_i_id),
    FOREIGN KEY (s_w_id) REFERENCES tpcc_warehouse(w_id),
    FOREIGN KEY (s_i_id) REFERENCES tpcc_item(i_id)
);

-- 历史记录表
CREATE TABLE IF NOT EXISTS tpcc_history (
    h_c_id INTEGER NOT NULL,
    h_c_d_id INTEGER NOT NULL,
    h_c_w_id INTEGER NOT NULL,
    h_d_id INTEGER NOT NULL,
    h_w_id INTEGER NOT NULL,
    h_date TIMESTAMP NOT NULL,
    h_amount DECIMAL(6,2) NOT NULL,
    h_data VARCHAR(24) NOT NULL,
    FOREIGN KEY (h_c_w_id, h_c_d_id, h_c_id) REFERENCES tpcc_customer(c_w_id, c_d_id, c_id),
    FOREIGN KEY (h_w_id, h_d_id) REFERENCES tpcc_district(d_w_id, d_id)
);

-- 创建索引
CREATE INDEX idx_tpcc_customer_name ON tpcc_customer(c_w_id, c_d_id, c_last, c_first);
CREATE INDEX idx_tpcc_orders_customer ON tpcc_orders(o_w_id, o_d_id, o_c_id, o_id);
CREATE INDEX idx_tpcc_order_line ON tpcc_order_line(ol_w_id, ol_d_id, ol_o_id);
CREATE INDEX idx_tpcc_stock_item ON tpcc_stock(s_w_id, s_i_id);

-- 添加注释
COMMENT ON TABLE tpcc_warehouse IS 'TPC-C 仓库信息表';
COMMENT ON TABLE tpcc_district IS 'TPC-C 地区信息表';
COMMENT ON TABLE tpcc_customer IS 'TPC-C 客户信息表';
COMMENT ON TABLE tpcc_orders IS 'TPC-C 订单信息表';
COMMENT ON TABLE tpcc_order_line IS 'TPC-C 订单明细表';
COMMENT ON TABLE tpcc_item IS 'TPC-C 商品信息表';
COMMENT ON TABLE tpcc_stock IS 'TPC-C 库存信息表';
COMMENT ON TABLE tpcc_history IS 'TPC-C 历史记录表'; 
```

# 01-init-admin.sql

```sql
-- 创建系统用户表（如果不存在）
CREATE TABLE IF NOT EXISTS system_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建初始管理员账号（密码为 admin123）
-- 使用 bcrypt 加密的密码
INSERT INTO system_users (username, password, role, status)
VALUES (
    'admin',
    '$2b$10$BEJNn0lezOr9adnvFDvOyOel6fTpIuwbZVzkBC/rt9644SABG5OP2',
    'admin',
    'active'
) ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password; 
```

# 04-tpch-test-data.sql

```sql
-- 创建测试数据
-- 地区数据
INSERT INTO tpc.region (r_regionkey, r_name, r_comment) VALUES
(0, 'AFRICA', '非洲地区'),
(1, 'AMERICA', '美洲地区'),
(2, 'ASIA', '亚洲地区'),
(3, 'EUROPE', '欧洲地区'),
(4, 'MIDDLE EAST', '中东地区');

-- 国家数据
INSERT INTO tpc.nation (n_nationkey, n_name, n_regionkey, n_comment) VALUES
(0, 'ALGERIA', 0, '阿尔及利亚'),
(1, 'ARGENTINA', 1, '阿根廷'),
(2, 'BRAZIL', 1, '巴西'),
(3, 'CANADA', 1, '加拿大'),
(4, 'EGYPT', 0, '埃及'),
(5, 'ETHIOPIA', 0, '埃塞俄比亚'),
(6, 'FRANCE', 3, '法国'),
(7, 'GERMANY', 3, '德国'),
(8, 'INDIA', 2, '印度'),
(9, 'INDONESIA', 2, '印度尼西亚'),
(10, 'IRAN', 4, '伊朗'),
(11, 'IRAQ', 4, '伊拉克'),
(12, 'JAPAN', 2, '日本'),
(13, 'JORDAN', 4, '约旦'),
(14, 'KENYA', 0, '肯尼亚'),
(15, 'MOROCCO', 0, '摩洛哥'),
(16, 'MOZAMBIQUE', 0, '莫桑比克'),
(17, 'PERU', 1, '秘鲁'),
(18, 'CHINA', 2, '中国'),
(19, 'ROMANIA', 3, '罗马尼亚'),
(20, 'SAUDI ARABIA', 4, '沙特阿拉伯'),
(21, 'VIETNAM', 2, '越南'),
(22, 'RUSSIA', 3, '俄罗斯'),
(23, 'UNITED KINGDOM', 3, '英国'),
(24, 'UNITED STATES', 1, '美国');

-- 供应商数据
INSERT INTO tpc.supplier (s_suppkey, s_name, s_address, s_nationkey, s_phone, s_acctbal, s_comment) VALUES
(1, 'Supplier#000000001', '北京市朝阳区', 18, '86-10-12345678', 1000.00, '中国供应商'),
(2, 'Supplier#000000002', '上海市浦东新区', 18, '86-21-87654321', 2000.00, '上海供应商'),
(3, 'Supplier#000000003', '东京都', 12, '81-3-12345678', 3000.00, '日本供应商'),
(4, 'Supplier#000000004', '纽约市', 24, '1-212-1234567', 4000.00, '美国供应商'),
(5, 'Supplier#000000005', '柏林市', 7, '49-30-12345678', 5000.00, '德国供应商');

-- 客户数据
INSERT INTO tpc.customer (c_custkey, c_name, c_address, c_nationkey, c_phone, c_acctbal, c_mktsegment, c_comment) VALUES
(1, 'Customer#000000001', '北京市海淀区', 18, '86-10-11111111', 1000.00, 'BUILDING', '建筑行业客户'),
(2, 'Customer#000000002', '上海市徐汇区', 18, '86-21-22222222', 2000.00, 'AUTOMOBILE', '汽车行业客户'),
(3, 'Customer#000000003', '东京都', 12, '81-3-33333333', 3000.00, 'MACHINERY', '机械行业客户'),
(4, 'Customer#000000004', '纽约市', 24, '1-212-4444444', 4000.00, 'HOUSEHOLD', '家居行业客户'),
(5, 'Customer#000000005', '柏林市', 7, '49-30-55555555', 5000.00, 'FURNITURE', '家具行业客户');

-- 订单数据
INSERT INTO tpc.orders (o_orderkey, o_custkey, o_orderstatus, o_totalprice, o_orderdate, o_orderpriority, o_clerk, o_shippriority, o_comment) VALUES
(1, 1, 'O', 1000.00, '1994-01-01', '1-URGENT', 'Clerk#000000001', 0, '紧急订单'),
(2, 2, 'F', 2000.00, '1994-02-01', '2-HIGH', 'Clerk#000000002', 1, '高优先级订单'),
(3, 3, 'O', 3000.00, '1994-03-01', '3-MEDIUM', 'Clerk#000000003', 2, '中等优先级订单'),
(4, 4, 'F', 4000.00, '1994-04-01', '4-NOT SPECIFIED', 'Clerk#000000004', 3, '普通订单'),
(5, 5, 'O', 5000.00, '1994-05-01', '5-LOW', 'Clerk#000000005', 4, '低优先级订单');


INSERT INTO tpc.part (p_partkey, p_name, p_mfgr, p_brand, p_type, p_size, p_container, p_retailprice, p_comment) VALUES
(1, 'Part#000000001', 'Manufacturer#1', 'Brand#1', 'STANDARD', 10, 'SM BOX', 100.00, '零件1'),
(2, 'Part#000000002', 'Manufacturer#2', 'Brand#2', 'STANDARD', 20, 'SM BOX', 200.00, '零件2'),
(3, 'Part#000000003', 'Manufacturer#3', 'Brand#3', 'STANDARD', 30, 'SM BOX', 300.00, '零件3'),
(4, 'Part#000000004', 'Manufacturer#4', 'Brand#4', 'STANDARD', 40, 'SM BOX', 400.00, '零件4'),
(5, 'Part#000000005', 'Manufacturer#5', 'Brand#5', 'STANDARD', 50, 'SM BOX', 500.00, '零件5');

-- 零件供应商数据
INSERT INTO tpc.partsupp (ps_partkey, ps_suppkey, ps_availqty, ps_supplycost, ps_comment) VALUES
(1, 1, 100, 10.00, '零件1供应商1'),
(2, 2, 200, 20.00, '零件2供应商2'),
(3, 3, 300, 30.00, '零件3供应商3'),
(4, 4, 400, 40.00, '零件4供应商4'),
(5, 5, 500, 50.00, '零件5供应商5');

-- 订单明细数据
INSERT INTO tpc.lineitem (l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag, l_linestatus, l_shipdate, l_commitdate, l_receiptdate, l_shipinstruct, l_shipmode, l_comment) VALUES
(1, 1, 1, 1, 10, 1000.00, 0.05, 0.10, 'N', 'O', '1994-01-15', '1994-01-10', '1994-01-20', 'DELIVER IN PERSON', 'TRUCK', '正常发货'),
(2, 2, 2, 1, 20, 2000.00, 0.10, 0.15, 'R', 'F', '1994-02-15', '1994-02-10', '1994-02-20', 'COLLECT COD', 'SHIP', '退货'),
(3, 3, 3, 1, 30, 3000.00, 0.15, 0.20, 'A', 'O', '1994-03-15', '1994-03-10', '1994-03-20', 'TAKE BACK RETURN', 'AIR', '退货'),
(4, 4, 4, 1, 40, 4000.00, 0.20, 0.25, 'N', 'F', '1994-04-15', '1994-04-10', '1994-04-20', 'NONE', 'RAIL', '正常发货'),
(5, 5, 5, 1, 50, 5000.00, 0.25, 0.30, 'R', 'O', '1994-05-15', '1994-05-10', '1994-05-20', 'DELIVER IN PERSON', 'TRUCK', '退货'); 
```

# 01-init.sql

```sql
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建模式
CREATE SCHEMA IF NOT EXISTS tpc;

-- 设置搜索路径
ALTER DATABASE tpc_db SET search_path TO tpc, public;

-- 为当前会话设置搜索路径
SET search_path TO tpc, public;

-- 创建表空间（如果需要）
-- CREATE TABLESPACE tpc_tablespace LOCATION '/var/lib/postgresql/data/tpc_tablespace';

-- 设置默认表空间（如果需要）
-- SET default_tablespace = tpc_tablespace;

-- 创建用户和权限
-- CREATE USER tpc_app WITH PASSWORD 'tpc_app_password';
-- GRANT ALL PRIVILEGES ON DATABASE tpc_db TO tpc_app;
-- GRANT ALL PRIVILEGES ON SCHEMA tpc TO tpc_app; 
```

# 04-indexes.sql

```sql
-- 设置搜索路径
SET search_path TO tpc, public;

-- LINEITEM表索引
CREATE INDEX IF NOT EXISTS idx_lineitem_orderkey ON lineitem (l_orderkey);
CREATE INDEX IF NOT EXISTS idx_lineitem_partkey_suppkey ON lineitem (l_partkey, l_suppkey);
CREATE INDEX IF NOT EXISTS idx_lineitem_shipdate ON lineitem (l_shipdate);
CREATE INDEX IF NOT EXISTS idx_lineitem_returnflag_linestatus ON lineitem (l_returnflag, l_linestatus);
CREATE INDEX IF NOT EXISTS idx_lineitem_commitdate ON lineitem (l_commitdate);
CREATE INDEX IF NOT EXISTS idx_lineitem_receiptdate ON lineitem (l_receiptdate);
CREATE INDEX IF NOT EXISTS idx_lineitem_suppkey ON lineitem (l_suppkey);
CREATE INDEX IF NOT EXISTS idx_lineitem_partkey ON lineitem (l_partkey);

-- ORDERS表索引
CREATE INDEX IF NOT EXISTS idx_orders_custkey ON orders (o_custkey);
CREATE INDEX IF NOT EXISTS idx_orders_orderdate ON orders (o_orderdate);
CREATE INDEX IF NOT EXISTS idx_orders_orderstatus ON orders (o_orderstatus);
CREATE INDEX IF NOT EXISTS idx_orders_orderpriority ON orders (o_orderpriority);
CREATE INDEX IF NOT EXISTS idx_orders_clerk ON orders (o_clerk);

-- CUSTOMER表索引
CREATE INDEX IF NOT EXISTS idx_customer_nationkey ON customer (c_nationkey);
CREATE INDEX IF NOT EXISTS idx_customer_mktsegment ON customer (c_mktsegment);
CREATE INDEX IF NOT EXISTS idx_customer_acctbal ON customer (c_acctbal);
CREATE INDEX IF NOT EXISTS idx_customer_name ON customer (c_name);

-- PART表索引
CREATE INDEX IF NOT EXISTS idx_part_brand ON part (p_brand);
CREATE INDEX IF NOT EXISTS idx_part_type ON part (p_type);
CREATE INDEX IF NOT EXISTS idx_part_container ON part (p_container);
CREATE INDEX IF NOT EXISTS idx_part_size ON part (p_size);
CREATE INDEX IF NOT EXISTS idx_part_retailprice ON part (p_retailprice);

-- SUPPLIER表索引
CREATE INDEX IF NOT EXISTS idx_supplier_nationkey ON supplier (s_nationkey);
CREATE INDEX IF NOT EXISTS idx_supplier_acctbal ON supplier (s_acctbal);
CREATE INDEX IF NOT EXISTS idx_supplier_name ON supplier (s_name);

-- PARTSUPP表索引
CREATE INDEX IF NOT EXISTS idx_partsupp_partkey ON partsupp (ps_partkey);
CREATE INDEX IF NOT EXISTS idx_partsupp_suppkey ON partsupp (ps_suppkey);
CREATE INDEX IF NOT EXISTS idx_partsupp_availqty ON partsupp (ps_availqty);
CREATE INDEX IF NOT EXISTS idx_partsupp_supplycost ON partsupp (ps_supplycost);

-- NATION表索引
CREATE INDEX IF NOT EXISTS idx_nation_regionkey ON nation (n_regionkey);
CREATE INDEX IF NOT EXISTS idx_nation_name ON nation (n_name);

-- REGION表索引
CREATE INDEX IF NOT EXISTS idx_region_name ON region (r_name);

-- TPC-C表索引
-- WAREHOUSE表索引
CREATE INDEX IF NOT EXISTS idx_warehouse_name ON tpcc_warehouse (w_name);
CREATE INDEX IF NOT EXISTS idx_warehouse_ytd ON tpcc_warehouse (w_ytd);

-- DISTRICT表索引
CREATE INDEX IF NOT EXISTS idx_district_warehouse ON tpcc_district (d_w_id);
CREATE INDEX IF NOT EXISTS idx_district_name ON tpcc_district (d_name);
CREATE INDEX IF NOT EXISTS idx_district_ytd ON tpcc_district (d_ytd);

-- CUSTOMER表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_warehouse ON tpcc_customer (c_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_district ON tpcc_customer (c_d_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_name ON tpcc_customer (c_last, c_first);
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_credit ON tpcc_customer (c_credit);
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_balance ON tpcc_customer (c_balance);

-- ORDERS表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_warehouse ON tpcc_orders (o_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_district ON tpcc_orders (o_d_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_customer ON tpcc_orders (o_c_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_entry_d ON tpcc_orders (o_entry_d);
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_carrier ON tpcc_orders (o_carrier_id);

-- ORDER_LINE表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_warehouse ON tpcc_order_line (ol_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_district ON tpcc_order_line (ol_d_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_order ON tpcc_order_line (ol_o_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_item ON tpcc_order_line (ol_i_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_amount ON tpcc_order_line (ol_amount);

-- ITEM表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_item_name ON tpcc_item (i_name);
CREATE INDEX IF NOT EXISTS idx_tpcc_item_price ON tpcc_item (i_price);
CREATE INDEX IF NOT EXISTS idx_tpcc_item_data ON tpcc_item (i_data);

-- STOCK表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_warehouse ON tpcc_stock (s_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_item ON tpcc_stock (s_i_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_quantity ON tpcc_stock (s_quantity);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_ytd ON tpcc_stock (s_ytd);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_order_cnt ON tpcc_stock (s_order_cnt);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_remote_cnt ON tpcc_stock (s_remote_cnt);

-- HISTORY表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_history_warehouse ON tpcc_history (h_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_history_district ON tpcc_history (h_d_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_history_customer ON tpcc_history (h_c_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_history_date ON tpcc_history (h_date);
CREATE INDEX IF NOT EXISTS idx_tpcc_history_amount ON tpcc_history (h_amount);

-- 添加注释
COMMENT ON INDEX idx_lineitem_orderkey IS 'LINEITEM表订单号索引';
COMMENT ON INDEX idx_lineitem_partkey_suppkey IS 'LINEITEM表零件号和供应商号复合索引';
COMMENT ON INDEX idx_lineitem_shipdate IS 'LINEITEM表发货日期索引';
COMMENT ON INDEX idx_lineitem_returnflag_linestatus IS 'LINEITEM表退货标志和行状态复合索引';
COMMENT ON INDEX idx_orders_custkey IS 'ORDERS表客户号索引';
COMMENT ON INDEX idx_orders_orderdate IS 'ORDERS表订单日期索引';
COMMENT ON INDEX idx_customer_nationkey IS 'CUSTOMER表国家号索引';
COMMENT ON INDEX idx_customer_mktsegment IS 'CUSTOMER表市场分区索引'; 
```

