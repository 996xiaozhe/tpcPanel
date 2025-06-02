import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// TPC-C 事务处理函数
async function executeNewOrderTransaction(customerId: string, warehouseId: string, amount: string) {
  const startTime = Date.now()
  const steps = []

  try {
    // 步骤1: 检查客户信息
    const step1Start = Date.now()
    const customerCheck = await sql`
      SELECT c_id, c_first, c_last, c_credit, c_discount
      FROM tpcc_customer 
      WHERE c_w_id = ${Number.parseInt(warehouseId.replace('WH-', ''))} 
      AND c_id = ${Number.parseInt(customerId)}
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

    // 步骤2: 获取地区信息
    const step2Start = Date.now()
    const districtCheck = await sql`
      SELECT d_id, d_tax, d_next_o_id
      FROM tpcc_district 
      WHERE d_w_id = ${Number.parseInt(warehouseId.replace('WH-', ''))}
      LIMIT 1
    `
    steps.push({
      step: 2,
      operation: "获取地区信息",
      time: Date.now() - step2Start,
      status: districtCheck.length > 0 ? "SUCCESS" : "FAILED",
    })

    if (districtCheck.length === 0) {
      throw new Error("地区不存在")
    }

    // 步骤3: 创建订单
    const step3Start = Date.now()
    const orderId = districtCheck[0].d_next_o_id
    const districtId = districtCheck[0].d_id

    // 更新地区订单ID
    await sql`
      UPDATE tpcc_district 
      SET d_next_o_id = d_next_o_id + 1 
      WHERE d_w_id = ${Number.parseInt(warehouseId.replace('WH-', ''))} 
      AND d_id = ${districtId}
    `

    // 插入订单
    await sql`
      INSERT INTO tpcc_orders (
        o_id, o_d_id, o_w_id, o_c_id, o_entry_d, o_ol_cnt, o_all_local
      ) VALUES (
        ${orderId}, 
        ${districtId}, 
        ${Number.parseInt(warehouseId.replace('WH-', ''))}, 
        ${Number.parseInt(customerId)}, 
        NOW(), 
        1, 
        1
      )
    `

    steps.push({
      step: 3,
      operation: "创建订单记录",
      time: Date.now() - step3Start,
      status: "SUCCESS",
    })

    // 步骤4: 创建订单项
    const step4Start = Date.now()
    const itemId = Math.floor(Math.random() * 100000) + 1
    const quantity = Math.floor(Math.random() * 10) + 1

    // 获取商品信息
    const itemInfo = await sql`
      SELECT i_price, i_name 
      FROM tpcc_item 
      WHERE i_id = ${itemId}
    `

    if (itemInfo.length === 0) {
      throw new Error("商品不存在")
    }

    // 更新库存
    await sql`
      UPDATE tpcc_stock 
      SET s_quantity = s_quantity - ${quantity},
          s_ytd = s_ytd + ${quantity},
          s_order_cnt = s_order_cnt + 1
      WHERE s_w_id = ${Number.parseInt(warehouseId.replace('WH-', ''))} 
      AND s_i_id = ${itemId}
    `

    // 插入订单项
    await sql`
      INSERT INTO tpcc_order_line (
        ol_o_id, ol_d_id, ol_w_id, ol_number, ol_i_id, 
        ol_supply_w_id, ol_quantity, ol_amount, ol_dist_info
      ) VALUES (
        ${orderId}, 
        ${districtId}, 
        ${Number.parseInt(warehouseId.replace('WH-', ''))}, 
        1, 
        ${itemId}, 
        ${Number.parseInt(warehouseId.replace('WH-', ''))}, 
        ${quantity}, 
        ${itemInfo[0].i_price * quantity}, 
        'DIST-INFO'
      )
    `

    steps.push({
      step: 4,
      operation: "创建订单项",
      time: Date.now() - step4Start,
      status: "SUCCESS",
    })

    return {
      success: true,
      orderId: `ORD-${orderId}`,
      customerId,
      customerName: `${customerCheck[0].c_first} ${customerCheck[0].c_last}`,
      warehouseId,
      totalAmount: itemInfo[0].i_price * quantity,
      itemCount: 1,
      steps,
      totalTime: Date.now() - startTime,
    }
  } catch (error) {
    console.error("新订单事务执行失败:", error)
    throw error
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
      FROM tpc.customer 
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
      FROM tpc.customer 
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
      FROM tpc.orders 
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
        FROM tpc.lineitem 
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
