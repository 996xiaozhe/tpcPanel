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
    FROM lineitem
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
    FROM customer c, orders o, lineitem l
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
    FROM customer c, orders o, lineitem l, supplier s, nation n, region r
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
