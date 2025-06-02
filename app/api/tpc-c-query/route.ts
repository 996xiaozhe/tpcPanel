import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { queryType, customerId } = await request.json()
    
    let result
    switch (queryType) {
      case 'NEW_ORDER':
        // 检查客户信息
        const customer = await sql`
          SELECT c_custkey, c_name, c_acctbal 
          FROM tpc.customer 
          WHERE c_custkey = ${Number.parseInt(customerId)}
        `
        
        if (customer.length === 0) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }
        
        // 创建新订单
        const order = await sql`
          INSERT INTO tpc.orders (
            o_custkey, o_orderstatus, o_totalprice, o_orderdate
          ) VALUES (
            ${Number.parseInt(customerId)},
            'O',
            0,
            CURRENT_DATE
          )
          RETURNING o_orderkey
        `
        
        result = {
          customer: customer[0],
          order: order[0]
        }
        break
        
      case 'PAYMENT':
        // 更新客户余额
        result = await sql`
          UPDATE tpc.customer
          SET c_acctbal = c_acctbal - 100
          WHERE c_custkey = ${Number.parseInt(customerId)}
          RETURNING c_custkey, c_name, c_acctbal
        `
        break
        
      case 'ORDER_STATUS':
        // 查询客户最新订单
        result = await sql`
          SELECT o_orderkey, o_orderdate, o_orderstatus, o_totalprice
          FROM tpc.orders 
          WHERE o_custkey = ${Number.parseInt(customerId)}
          ORDER BY o_orderdate DESC 
          LIMIT 1
        `
        break
        
      case 'DELIVERY':
        // 更新订单状态
        result = await sql`
          UPDATE tpc.orders
          SET o_orderstatus = 'F'
          WHERE o_orderkey IN (
            SELECT o_orderkey
            FROM tpc.orders
            WHERE o_orderstatus = 'O'
            ORDER BY o_orderdate ASC
            LIMIT 1
          )
          RETURNING o_orderkey, o_orderstatus
        `
        break
        
      case 'STOCK_LEVEL':
        // 检查库存水平
        result = await sql`
          SELECT COUNT(*) as low_stock_count
          FROM tpc.stock
          WHERE s_quantity < 10
        `
        break
        
      default:
        return NextResponse.json({ error: 'Invalid query type' }, { status: 400 })
    }
    
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error executing TPC-C query:', error)
    return NextResponse.json({ error: 'Failed to execute query' }, { status: 500 })
  }
} 