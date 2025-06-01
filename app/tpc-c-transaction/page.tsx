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
]

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

  const executeTransaction = async () => {
    if (!selectedTransaction) return

    setIsExecuting(true)
    const startTime = Date.now()

    try {
      const response = await fetch("/api/tpc-c-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionType: selectedTransaction,
          customerId,
          warehouseId,
          amount,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      const actualTime = Date.now() - startTime
      setExecutionTime(actualTime)
      setTransactionResult(result)

      // 生成执行计划
      const selectedConfig = tpcCTransactions.find((t) => t.id === selectedTransaction)
      setExecutionPlan(`
事务执行计划分析:
事务类型: ${selectedConfig?.name}
总执行时间: ${actualTime}ms
数据库执行时间: ${result.totalTime}ms

执行步骤详情:
${
  result.steps
    ?.map((step: any, index: number) => `${index + 1}. ${step.operation} - ${step.time}ms (${step.status})`)
    .join("\n") || "无详细步骤信息"
}

锁定策略:
- 行级锁: CUSTOMER, ORDERS 表
- 事务隔离级别: READ COMMITTED
- 并发控制: 两阶段锁定协议

性能指标:
- 事务成功率: ${result.success ? "100%" : "0%"}
- 平均响应时间: ${actualTime}ms
- 数据库连接: Neon PostgreSQL
- 网络延迟: ${actualTime - (result.totalTime || 0)}ms

优化建议:
- 确保相关字段有适当的索引
- 监控长时间运行的事务
- 考虑连接池优化
`)
    } catch (error) {
      console.error("事务执行失败:", error)
      setTransactionResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        steps: [],
      })
      setExecutionPlan(`事务执行失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const exportResults = () => {
    if (!transactionResult || !transactionResult.steps) return

    const csvContent = [
      "Step,Operation,Time(ms),Status",
      ...transactionResult.steps.map((step: any) => `${step.step},"${step.operation}",${step.time},${step.status}`),
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

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>TPC-C事务测试连接真实的Neon数据库，模拟OLTP工作负载。</AlertDescription>
        </Alert>

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
                  {selectedTransaction !== "ORDER_STATUS" && (
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
                </div>

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
                      {transactionResult.orderId && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600">订单ID</div>
                          <div className="font-semibold">{transactionResult.orderId}</div>
                        </div>
                      )}
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-600">客户</div>
                        <div className="font-semibold">{transactionResult.customerName}</div>
                        <div className="text-xs text-gray-500">ID: {transactionResult.customerId}</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm text-purple-600">仓库ID</div>
                        <div className="font-semibold">{transactionResult.warehouseId}</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-sm text-orange-600">
                          {transactionResult.totalAmount
                            ? "订单金额"
                            : transactionResult.paymentAmount
                              ? "付款金额"
                              : "查询结果"}
                        </div>
                        <div className="font-semibold">
                          {transactionResult.totalAmount && `$${transactionResult.totalAmount.toFixed(2)}`}
                          {transactionResult.paymentAmount && `$${transactionResult.paymentAmount.toFixed(2)}`}
                          {transactionResult.orders && `${transactionResult.orders.length} 个订单`}
                        </div>
                      </div>
                    </div>

                    {/* 订单状态查询特殊显示 */}
                    {selectedTransaction === "ORDER_STATUS" && transactionResult.orders && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-3">最近订单</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>订单ID</TableHead>
                                <TableHead>订单日期</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>总价</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactionResult.orders.map((order: any) => (
                                <TableRow key={order.o_orderkey}>
                                  <TableCell>{order.o_orderkey}</TableCell>
                                  <TableCell>{order.o_orderdate}</TableCell>
                                  <TableCell>
                                    <Badge variant={order.o_orderstatus === "F" ? "default" : "secondary"}>
                                      {order.o_orderstatus}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>${Number.parseFloat(order.o_totalprice).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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
                {transactionResult.steps && transactionResult.steps.length > 0 && (
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
                        {transactionResult.steps.map((step: any) => (
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
