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