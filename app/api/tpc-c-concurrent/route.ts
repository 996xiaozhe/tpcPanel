import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// 简化的TPC-C事务用于并发测试
async function executeSimpleTransaction(transactionType: string, clientId: number) {
  const startTime = Date.now()

  try {
    let result

    switch (transactionType) {
      case "NEW_ORDER":
        // 简化的新订单事务 - 只查询客户信息
        result = await sql`
          SELECT c_custkey, c_name, c_acctbal 
          FROM tpc.customer 
          WHERE c_custkey = ${Math.floor(Math.random() * 1000) + 1}
          LIMIT 1
        `
        break

      case "PAYMENT":
        // 简化的付款事务 - 查询客户余额
        result = await sql`
          SELECT c_custkey, c_name, c_acctbal 
          FROM tpc.customer 
          WHERE c_acctbal > ${Math.random() * 1000}
          LIMIT 1
        `
        break

      case "ORDER_STATUS":
        // 订单状态查询
        result = await sql`
          SELECT o.o_orderkey, o.o_orderdate, o.o_orderstatus, c.c_name
          FROM tpc.orders o
          JOIN tpc.customer c ON o.o_custkey = c.c_custkey
          WHERE o.o_custkey = ${Math.floor(Math.random() * 1000) + 1}
          ORDER BY o.o_orderdate DESC
          LIMIT 3
        `
        break

      case "DELIVERY":
        // 发货事务 - 查询待发货订单
        result = await sql`
          SELECT o_orderkey, o_orderdate, o_orderstatus
          FROM tpc.orders 
          WHERE o_orderstatus = 'O'
          LIMIT 5
        `
        break

      case "STOCK_LEVEL":
        // 库存水平查询
        result = await sql`
          SELECT p.p_partkey, p.p_name, ps.ps_availqty
          FROM tpc.part p
          JOIN tpc.partsupp ps ON p.p_partkey = ps.ps_partkey
          WHERE ps.ps_availqty < ${Math.floor(Math.random() * 100) + 50}
          LIMIT 10
        `
        break

      default:
        throw new Error("不支持的事务类型")
    }

    const executionTime = Date.now() - startTime

    // 模拟事务成功/失败（95%成功率）
    const success = Math.random() > 0.05

    return {
      clientId,
      transactionType,
      success,
      executionTime,
      rowCount: result.length,
      operations: Math.floor(Math.random() * 5) + 1,
      data: success ? result.slice(0, 3) : null, // 只返回前3条记录
    }
  } catch (error) {
    return {
      clientId,
      transactionType,
      success: false,
      executionTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      operations: 0,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transactionType, clientId } = await request.json()

    if (!transactionType) {
      return NextResponse.json({ error: "缺少事务类型" }, { status: 400 })
    }

    const result = await executeSimpleTransaction(transactionType, clientId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: `并发事务执行错误: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
      },
      { status: 500 },
    )
  }
}
