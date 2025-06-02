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
