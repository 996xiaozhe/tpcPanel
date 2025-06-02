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
