import { neon } from "@neondatabase/serverless"

// 创建数据库连接
export const sql = neon(process.env.DATABASE_URL!)

// 执行查询并测量时间
export async function executeQueryWithTiming(query: string, params: any[] = []) {
  const startTime = Date.now()
  try {
    let result
    if (params.length === 0) {
      // 没有参数时使用tagged template
      result = await sql`${query}`
    } else {
      // 有参数时使用sql.query
      result = await sql.query(query, params)
    }
    const endTime = Date.now()
    return {
      data: result,
      executionTime: endTime - startTime,
      success: true,
    }
  } catch (error) {
    const endTime = Date.now()
    return {
      error: error instanceof Error ? error.message : String(error),
      executionTime: endTime - startTime,
      success: false,
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
