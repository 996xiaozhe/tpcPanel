import { type NextRequest, NextResponse } from "next/server"
import { executeQueryWithTiming } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchTerm = request.nextUrl.searchParams.get("term")

    if (!searchTerm) {
      return NextResponse.json({ error: "缺少搜索条件" }, { status: 400 })
    }

    const query = `
      SELECT c.*, n.n_name
      FROM customer c
      LEFT JOIN nation n ON c.c_nationkey = n.n_nationkey
      WHERE c.c_name ILIKE $1 OR n.n_name ILIKE $1
      ORDER BY c.c_custkey
      LIMIT 100
    `

    const result = await executeQueryWithTiming(query, [`%${searchTerm}%`])

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
