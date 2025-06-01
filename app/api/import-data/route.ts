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
