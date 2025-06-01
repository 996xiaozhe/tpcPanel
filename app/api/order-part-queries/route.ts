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
        FROM orders o
        LEFT JOIN customer c ON o.o_custkey = c.c_custkey
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
        FROM part p
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

    const result = await executeQueryWithTiming(query, params)

    if (result.success) {
      return NextResponse.json({
        data: result.data,
        executionTime: result.executionTime,
      })
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
