import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// TPC-C 事务处理函数
async function executeNewOrderTransaction(customerId: string, warehouseId: string, amount: string) {
  const startTime = Date.now()
  const steps = []

  try {
    // 模拟新订单事务的多个步骤

    // 步骤1: 检查客户信息
    const step1Start = Date.now()
    const customerCheck = await sql`
      SELECT c_custkey, c_name, c_acctbal 
      FROM customer 
      WHERE c_custkey = ${Number.parseInt(customerId)}
    `
    steps.push({
      step: 1,
      operation: "检查客户信息",
      time: Date.now() - step1Start,
      status: customerCheck.length > 0 ? "SUCCESS" : "FAILED",
    })

    if (customerCheck.length === 0) {
      throw new Error("客户不存在")
    }

    // 步骤2: 创建订单记录
    const step2Start = Date.now()
    const orderId = Math.floor(Math.random() * 1000000) + 1000000
    const orderDate = new Date().toISOString().split("T")[0]

    // 这里我们模拟插入订单，实际应该插入到orders表
    steps.push({
      step: 2,
      operation: "创建订单记录",
      time: Date.now() - step2Start,
      status: "SUCCESS",
    })

    // 步骤3: 更新库存
    const step3Start = Date.now()
    // 模拟库存更新
    steps.push({
      step: 3,
      operation: "更新库存信息",
      time: Date.now() - step3Start,
      status: "SUCCESS",
    })

    // 步骤4: 计算总价
    const step4Start = Date.now()
    const totalAmount = Number.parseFloat(amount)
    steps.push({
      step: 4,
      operation: "计算订单总价",
      time: Date.now() - step4Start,
      status: "SUCCESS",
    })

    return {
      success: true,
      orderId: `ORD-${orderId}`,
      customerId,
      customerName: customerCheck[0].c_name,
      warehouseId,
      totalAmount,
      itemCount: Math.floor(Math.random() * 5) + 1,
      steps,
      totalTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      steps,
      totalTime: Date.now() - startTime,
    }
  }
}

async function executePaymentTransaction(customerId: string, warehouseId: string, amount: string) {
  const startTime = Date.now()
  const steps = []

  try {
    // 步骤1: 验证客户
    const step1Start = Date.now()
    const customer = await sql`
      SELECT c_custkey, c_name, c_acctbal 
      FROM customer 
      WHERE c_custkey = ${Number.parseInt(customerId)}
    `
    steps.push({
      step: 1,
      operation: "验证客户信息",
      time: Date.now() - step1Start,
      status: customer.length > 0 ? "SUCCESS" : "FAILED",
    })

    if (customer.length === 0) {
      throw new Error("客户不存在")
    }

    // 步骤2: 检查账户余额
    const step2Start = Date.now()
    const paymentAmount = Number.parseFloat(amount)
    const currentBalance = Number.parseFloat(customer[0].c_acctbal)

    steps.push({
      step: 2,
      operation: "检查账户余额",
      time: Date.now() - step2Start,
      status: currentBalance >= paymentAmount ? "SUCCESS" : "WARNING",
    })

    // 步骤3: 处理付款
    const step3Start = Date.now()
    // 这里应该更新客户余额，但为了演示我们只是模拟
    steps.push({
      step: 3,
      operation: "处理付款",
      time: Date.now() - step3Start,
      status: "SUCCESS",
    })

    // 步骤4: 记录交易历史
    const step4Start = Date.now()
    steps.push({
      step: 4,
      operation: "记录交易历史",
      time: Date.now() - step4Start,
      status: "SUCCESS",
    })

    return {
      success: true,
      customerId,
      customerName: customer[0].c_name,
      paymentAmount,
      warehouseId,
      districtId: "DIST-10",
      newBalance: currentBalance - paymentAmount,
      steps,
      totalTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      steps,
      totalTime: Date.now() - startTime,
    }
  }
}

async function executeOrderStatusQuery(customerId: string) {
  const startTime = Date.now()
  const steps = []

  try {
    // 步骤1: 查询客户信息
    const step1Start = Date.now()
    const customer = await sql`
      SELECT c_custkey, c_name 
      FROM customer 
      WHERE c_custkey = ${Number.parseInt(customerId)}
    `
    steps.push({
      step: 1,
      operation: "查询客户信息",
      time: Date.now() - step1Start,
      status: customer.length > 0 ? "SUCCESS" : "FAILED",
    })

    if (customer.length === 0) {
      throw new Error("客户不存在")
    }

    // 步骤2: 查询最新订单
    const step2Start = Date.now()
    const orders = await sql`
      SELECT o_orderkey, o_orderdate, o_orderstatus, o_totalprice
      FROM orders 
      WHERE o_custkey = ${Number.parseInt(customerId)}
      ORDER BY o_orderdate DESC 
      LIMIT 5
    `
    steps.push({
      step: 2,
      operation: "查询订单信息",
      time: Date.now() - step2Start,
      status: "SUCCESS",
    })

    // 步骤3: 查询订单明细
    const step3Start = Date.now()
    let orderDetails = []
    if (orders.length > 0) {
      orderDetails = await sql`
        SELECT l_orderkey, l_partkey, l_quantity, l_extendedprice
        FROM lineitem 
        WHERE l_orderkey = ${orders[0].o_orderkey}
        LIMIT 10
      `
    }
    steps.push({
      step: 3,
      operation: "查询订单明细",
      time: Date.now() - step3Start,
      status: "SUCCESS",
    })

    return {
      success: true,
      customerId,
      customerName: customer[0].c_name,
      orders: orders.slice(0, 3),
      orderDetails: orderDetails.slice(0, 5),
      steps,
      totalTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      steps,
      totalTime: Date.now() - startTime,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transactionType, customerId, warehouseId, amount } = await request.json()

    if (!transactionType) {
      return NextResponse.json({ error: "缺少事务类型" }, { status: 400 })
    }

    let result
    switch (transactionType) {
      case "NEW_ORDER":
        result = await executeNewOrderTransaction(customerId, warehouseId, amount)
        break
      case "PAYMENT":
        result = await executePaymentTransaction(customerId, warehouseId, amount)
        break
      case "ORDER_STATUS":
        result = await executeOrderStatusQuery(customerId)
        break
      default:
        return NextResponse.json({ error: "不支持的事务类型" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: `事务执行错误: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
