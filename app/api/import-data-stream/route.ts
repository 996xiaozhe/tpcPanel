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
