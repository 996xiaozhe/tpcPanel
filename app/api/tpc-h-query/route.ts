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