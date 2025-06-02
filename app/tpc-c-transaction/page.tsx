"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Play, ArrowLeft, Clock, Database, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

// TPC-C 事务类型
const tpcCTransactions = [
  {
    id: "NEW_ORDER",
    name: "新订单事务",
    description: "创建新订单，包含多个订单项的插入操作",
    operations: ["检查客户信息", "创建订单记录", "更新库存信息", "计算订单总价"],
    complexity: "高",
    estimatedTime: "15ms",
  },
  {
    id: "PAYMENT",
    name: "付款事务",
    description: "处理客户付款，更新客户和仓库余额",
    operations: ["验证客户信息", "检查账户余额", "处理付款", "记录交易历史"],
    complexity: "中等",
    estimatedTime: "8ms",
  },
  {
    id: "ORDER_STATUS",
    name: "订单状态查询",
    description: "查询客户的最新订单状态",
    operations: ["查询客户信息", "查询订单信息", "查询订单明细"],
    complexity: "低",
    estimatedTime: "3ms",
  },
  {
    id: "DELIVERY",
    name: "发货事务",
    description: "处理订单发货，更新订单状态",
    operations: ["获取待发货订单", "更新订单状态", "更新客户余额"],
    complexity: "中等",
    estimatedTime: "10ms",
  },
  {
    id: "STOCK_LEVEL",
    name: "库存查询",
    description: "检查库存水平，识别低库存商品",
    operations: ["获取区域信息", "查询库存状态", "统计低库存商品"],
    complexity: "低",
    estimatedTime: "5ms",
  },
]

// 在文件顶部添加类型定义
interface BaseRequestBody {
  w_id: number;
  d_id: number;
  c_id: number;
}

interface NewOrderRequestBody extends BaseRequestBody {
  items: Array<{
    i_id: number;
    quantity: number;
  }>;
}

interface PaymentRequestBody extends BaseRequestBody {
  amount: number;
}

type RequestBody = BaseRequestBody | NewOrderRequestBody | PaymentRequestBody;

export default function TPCCTransactionPage() {
  const [selectedTransaction, setSelectedTransaction] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [transactionResult, setTransactionResult] = useState<any>(null)
  const [executionPlan, setExecutionPlan] = useState<string>("")

  // 事务参数
  const [customerId, setCustomerId] = useState("1")
  const [warehouseId, setWarehouseId] = useState("WH-001")
  const [amount, setAmount] = useState("500.00")
  const [selectedItems, setSelectedItems] = useState<Array<{i_id: number, quantity: number}>>([
    { i_id: 1, quantity: 1 }
  ])
  const [orderId, setOrderId] = useState("1")
  const [districtId, setDistrictId] = useState("1")

  // 添加商品
  const addItem = () => {
    setSelectedItems([...selectedItems, { i_id: 1, quantity: 1 }])
  }

  // 移除商品
  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  // 更新商品
  const updateItem = (index: number, field: 'i_id' | 'quantity', value: number) => {
    const newItems = [...selectedItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setSelectedItems(newItems)
  }

  const executeTransaction = async () => {
    if (!selectedTransaction) return

    setIsExecuting(true)
    const startTime = Date.now()

    try {
      // 根据事务类型选择对应的 API 端点
      const endpoint = selectedTransaction === "NEW_ORDER" ? "http://localhost:8000/api/tpcc/new-order" :
                      selectedTransaction === "PAYMENT" ? "http://localhost:8000/api/tpcc/payment" :
                      selectedTransaction === "ORDER_STATUS" ? "http://localhost:8000/api/tpcc/order-status" :
                      selectedTransaction === "DELIVERY" ? "http://localhost:8000/api/tpcc/delivery" :
                      "http://localhost:8000/api/tpcc/stock-level"

      // 构建请求体
      let requestBody: any = {
        w_id: parseInt(warehouseId.replace("WH-", "")),
        d_id: 1, // 默认使用第一个区域
        c_id: parseInt(customerId),
      }

      // 根据事务类型添加特定字段
      if (selectedTransaction === "NEW_ORDER") {
        // 获取当前最大订单ID
        const maxOrderResponse = await fetch("http://localhost:8000/api/tpcc/max-order-id", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            w_id: requestBody.w_id,
            d_id: requestBody.d_id
          }),
        })

        if (!maxOrderResponse.ok) {
          throw new Error("获取最大订单ID失败")
        }

        const maxOrderData = await maxOrderResponse.json()
        const nextOrderId = maxOrderData.data.max_order_id + 1

        // 修改请求体格式，确保与后端 API 定义一致
        requestBody = {
          w_id: parseInt(warehouseId.replace("WH-", "")),
          d_id: 1,
          c_id: parseInt(customerId),
          o_id: nextOrderId,
          items: selectedItems.map(item => ({
            i_id: item.i_id,
            quantity: item.quantity
          }))
        }
      } else if (selectedTransaction === "PAYMENT") {
        requestBody.amount = parseFloat(amount)
      } else if (selectedTransaction === "DELIVERY") {
        requestBody = {
          w_id: parseInt(warehouseId.replace("WH-", "")),
          d_id: parseInt(districtId),
          o_id: parseInt(orderId),
          carrier_id: 1
        }
      } else if (selectedTransaction === "STOCK_LEVEL") {
        requestBody.threshold = 10
      }

      console.log('发送请求:', {
        endpoint,
        requestBody
      })

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()
      console.log('收到响应:', responseData)

      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP error! status: ${response.status}`)
      }

      const actualTime = Date.now() - startTime
      setExecutionTime(actualTime)
      setTransactionResult(responseData)

      // 生成执行计划
      const selectedConfig = tpcCTransactions.find((t) => t.id === selectedTransaction)
      if (selectedConfig) {
        setExecutionPlan(
          `事务类型: ${selectedConfig.name}\n` +
          `复杂度: ${selectedConfig.complexity}\n` +
          `预估时间: ${selectedConfig.estimatedTime}\n` +
          `实际执行时间: ${actualTime}ms\n` +
          `执行步骤:\n${responseData.data.steps ? responseData.data.steps.map((step: any) => 
            `- ${step.operation}: ${step.time}ms (${step.status})`
          ).join('\n') : '无详细步骤信息'}`
        )
      }
    } catch (error) {
      console.error("事务执行失败:", error)
      setTransactionResult({
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const exportResults = () => {
    if (!transactionResult || !transactionResult.data.steps) return

    const csvContent = [
      "Step,Operation,Time(ms),Status",
      ...transactionResult.data.steps.map((step: any) => `${step.step},"${step.operation}",${step.time},${step.status}`),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `tpc_c_${selectedTransaction}_results.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回主页
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">TPC-C 事务查询</h1>
          <p className="text-gray-600 mt-2">真实数据库事务处理和操作，支持增删改查</p>
        </div>

        {/* 事务选择和参数 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>事务配置</CardTitle>
            <CardDescription>选择要执行的TPC-C事务类型并设置参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedTransaction} onValueChange={setSelectedTransaction}>
              <SelectTrigger>
                <SelectValue placeholder="选择事务类型..." />
              </SelectTrigger>
              <SelectContent>
                {tpcCTransactions.map((transaction) => (
                  <SelectItem key={transaction.id} value={transaction.id}>
                    {transaction.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTransaction && (
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">
                    {tpcCTransactions.find((t) => t.id === selectedTransaction)?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {tpcCTransactions.find((t) => t.id === selectedTransaction)?.description}
                  </p>
                  <div className="flex gap-4 mb-3">
                    <Badge variant="secondary">
                      复杂度: {tpcCTransactions.find((t) => t.id === selectedTransaction)?.complexity}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      预估时间: {tpcCTransactions.find((t) => t.id === selectedTransaction)?.estimatedTime}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <strong>涉及操作:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {tpcCTransactions
                        .find((t) => t.id === selectedTransaction)
                        ?.operations.map((op, index) => (
                          <li key={index}>{op}</li>
                        ))}
                    </ul>
                  </div>
                </div>

                {/* 事务参数 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">客户ID</label>
                    <Input
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      placeholder="输入客户ID"
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">仓库ID</label>
                    <Input value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} placeholder="WH-XXX" />
                  </div>
                  {selectedTransaction === "PAYMENT" && (
                    <div>
                      <label className="text-sm font-medium">金额</label>
                      <Input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                      />
                    </div>
                  )}
                  {selectedTransaction === "DELIVERY" && (
                    <>
                      <div>
                        <label className="text-sm font-medium">区域ID</label>
                        <Input
                          value={districtId}
                          onChange={(e) => setDistrictId(e.target.value)}
                          placeholder="输入区域ID"
                          type="number"
                          min="1"
                          max="10"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">订单ID</label>
                        <Input
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                          placeholder="输入订单ID"
                          type="number"
                          min="1"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* 新订单商品列表 */}
                {selectedTransaction === "NEW_ORDER" && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">订单商品</label>
                      <Button onClick={addItem} variant="outline" size="sm">
                        添加商品
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {selectedItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="flex-1">
                            <label className="text-xs text-gray-500">商品ID</label>
                            <Input
                              value={item.i_id}
                              onChange={(e) => updateItem(index, 'i_id', parseInt(e.target.value))}
                              type="number"
                              min="1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-500">数量</label>
                            <Input
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                              type="number"
                              min="1"
                            />
                          </div>
                          <Button
                            onClick={() => removeItem(index)}
                            variant="ghost"
                            size="sm"
                            className="mt-6"
                          >
                            删除
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={executeTransaction} disabled={isExecuting} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  {isExecuting ? "执行中..." : "执行事务"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 事务执行结果 */}
        {transactionResult && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>事务执行结果</CardTitle>
                    <CardDescription>
                      总执行时间: {executionTime}ms | 状态: {transactionResult.success ? "成功" : "失败"}
                    </CardDescription>
                  </div>
                  <Button onClick={exportResults} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    导出结果
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {transactionResult.success ? (
                  <>
                    {/* 事务概要 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {selectedTransaction === "ORDER_STATUS" && transactionResult.data.customer && (
                        <>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-600">客户信息</div>
                            <div className="font-semibold">{transactionResult.data.customer.name}</div>
                            <div className="text-xs text-gray-500">ID: {transactionResult.data.customer.id}</div>
                            <div className="text-xs text-gray-500">余额: ${transactionResult.data.customer.balance.toFixed(2)}</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm text-blue-600">订单数量</div>
                            <div className="font-semibold">{transactionResult.data.orders.length} 个订单</div>
                          </div>
                        </>
                      )}
                      {selectedTransaction === "STOCK_LEVEL" && (
                        <>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="text-sm text-purple-600">仓库ID</div>
                            <div className="font-semibold">{transactionResult.data.warehouse_id}</div>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <div className="text-sm text-orange-600">区域ID</div>
                            <div className="font-semibold">{transactionResult.data.district_id}</div>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="text-sm text-red-600">库存阈值</div>
                            <div className="font-semibold">{transactionResult.data.threshold}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-600">低库存商品数</div>
                            <div className="font-semibold">{transactionResult.data.low_stock_count}</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* 库存查询特殊显示 */}
                    {selectedTransaction === "STOCK_LEVEL" && transactionResult.data.items && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">库存详情</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>商品ID</TableHead>
                                <TableHead>商品名称</TableHead>
                                <TableHead>当前库存</TableHead>
                                <TableHead>年度销量</TableHead>
                                <TableHead>订单数量</TableHead>
                                <TableHead>远程订单数</TableHead>
                                <TableHead>库存状态</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactionResult.data.items.map((item: any) => (
                                <TableRow key={item.item_id}>
                                  <TableCell>{item.item_id}</TableCell>
                                  <TableCell>{item.item_name}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{item.ytd}</TableCell>
                                  <TableCell>{item.order_count}</TableCell>
                                  <TableCell>{item.remote_count}</TableCell>
                                  <TableCell>
                                    <Badge variant={item.is_low_stock ? "destructive" : "default"}>
                                      {item.is_low_stock ? "库存不足" : "库存充足"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* 订单状态查询特殊显示 */}
                    {selectedTransaction === "ORDER_STATUS" && transactionResult.data.orders && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-3">订单详情</h4>
                        <div className="space-y-4">
                          {transactionResult.data.orders.map((order: any) => (
                            <div key={order.order_id} className="bg-white p-4 rounded-lg shadow">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-semibold">订单 #{order.order_id}</div>
                                <div className="text-sm text-gray-500">
                                  下单时间: {new Date(order.entry_date).toLocaleString()}
                                </div>
                              </div>
                              <div className="mb-2">
                                <Badge variant={order.carrier_id ? "default" : "secondary"}>
                                  {order.carrier_id ? `已发货 (承运商: ${order.carrier_id})` : "待发货"}
                                </Badge>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>商品编号</TableHead>
                                    <TableHead>供应仓库</TableHead>
                                    <TableHead>数量</TableHead>
                                    <TableHead>金额</TableHead>
                                    <TableHead>发货状态</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item: any) => (
                                    <TableRow key={item.number}>
                                      <TableCell>{item.item_id}</TableCell>
                                      <TableCell>{item.supply_w_id}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>${item.amount.toFixed(2)}</TableCell>
                                      <TableCell>
                                        <Badge variant={item.delivery_date ? "default" : "secondary"}>
                                          {item.delivery_date ? "已发货" : "待发货"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>事务执行失败: {transactionResult.error}</AlertDescription>
                  </Alert>
                )}

                {/* 执行步骤详情 */}
                {transactionResult.data?.steps && transactionResult.data.steps.length > 0 && (
                  <div className="overflow-x-auto">
                    <h4 className="text-sm font-medium mb-3">执行步骤详情</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>步骤</TableHead>
                          <TableHead>操作</TableHead>
                          <TableHead>执行时间 (ms)</TableHead>
                          <TableHead>状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionResult.data.steps.map((step: any) => (
                          <TableRow key={step.step}>
                            <TableCell>{step.step}</TableCell>
                            <TableCell className="font-medium">{step.operation}</TableCell>
                            <TableCell>{step.time}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  step.status === "SUCCESS"
                                    ? "default"
                                    : step.status === "WARNING"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {step.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 执行计划 */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Database className="h-5 w-5 inline mr-2" />
                  事务执行分析
                </CardTitle>
                <CardDescription>事务的执行过程、性能分析和优化建议</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {executionPlan}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
