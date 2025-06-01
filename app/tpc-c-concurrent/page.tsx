"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, Play, CircleStopIcon as Stop, ArrowLeft, Users, Clock, Database } from "lucide-react"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

interface ConcurrentTransaction {
  id: string
  clientId: number
  transactionType: string
  status: "waiting" | "running" | "committed" | "aborted"
  startTime?: number
  endTime?: number
  duration?: number
  operations: number
  error?: string
}

export default function TPCCConcurrentPage() {
  const [clientCount, setClientCount] = useState(10)
  const [transactionMix, setTransactionMix] = useState("standard")
  const [testDuration, setTestDuration] = useState(120)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [concurrentTransactions, setConcurrentTransactions] = useState<ConcurrentTransaction[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState(0)
  const [tpmC, setTpmC] = useState(0) // Transactions per minute C
  const [abortRate, setAbortRate] = useState(0)

  const transactionTypes = ["NEW_ORDER", "PAYMENT", "ORDER_STATUS", "DELIVERY", "STOCK_LEVEL"]
  const standardMix = {
    NEW_ORDER: 0.45,
    PAYMENT: 0.43,
    ORDER_STATUS: 0.04,
    DELIVERY: 0.04,
    STOCK_LEVEL: 0.04,
  }

  const testStartTime = useRef<number>(0)
  const testInterval = useRef<NodeJS.Timeout | null>(null)

  const getRandomTransactionType = () => {
    if (transactionMix === "standard") {
      const rand = Math.random()
      let cumulative = 0
      for (const [type, probability] of Object.entries(standardMix)) {
        cumulative += probability
        if (rand <= cumulative) return type
      }
    }
    return transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
  }

  const startConcurrentTest = () => {
    setIsRunning(true)
    setProgress(0)
    setConcurrentTransactions([])
    setPerformanceData([])
    setTotalTransactions(0)
    setAvgResponseTime(0)
    setTpmC(0)
    setAbortRate(0)
    testStartTime.current = Date.now()

    // 初始化并发事务
    const transactions: ConcurrentTransaction[] = []
    for (let i = 1; i <= clientCount; i++) {
      transactions.push({
        id: `client-${i}`,
        clientId: i,
        transactionType: getRandomTransactionType(),
        status: "waiting",
        operations: 0,
      })
    }
    setConcurrentTransactions(transactions)

    // 开始执行测试
    executeRealConcurrentTransactions(transactions)
  }

  const executeRealConcurrentTransactions = async (initialTransactions: ConcurrentTransaction[]) => {
    const totalDuration = testDuration * 1000
    let completedTransactions = 0
    let abortedTransactions = 0
    let totalResponseTime = 0
    const performanceHistory: any[] = []

    // 更新进度的定时器
    testInterval.current = setInterval(() => {
      const elapsed = Date.now() - testStartTime.current
      const progressPercent = Math.min((elapsed / totalDuration) * 100, 100)
      setProgress(progressPercent)

      if (elapsed >= totalDuration) {
        stopTest()
      }
    }, 1000)

    // 执行并发事务
    const executeTransaction = async (transaction: ConcurrentTransaction) => {
      if (!isRunning) return

      // 更新状态为运行中
      setConcurrentTransactions((prev) =>
        prev.map((t) =>
          t.id === transaction.id
            ? {
                ...t,
                status: "running",
                startTime: Date.now(),
                operations: Math.floor(Math.random() * 5) + 1,
              }
            : t,
        ),
      )

      try {
        const response = await fetch("/api/tpc-c-concurrent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionType: transaction.transactionType,
            clientId: transaction.clientId,
          }),
        })

        const result = await response.json()
        const endTime = Date.now()

        if (result.success) {
          completedTransactions++
          totalResponseTime += result.executionTime

          setConcurrentTransactions((prev) =>
            prev.map((t) =>
              t.id === transaction.id
                ? {
                    ...t,
                    status: "committed",
                    endTime,
                    duration: result.executionTime,
                    operations: result.operations,
                  }
                : t,
            ),
          )
        } else {
          abortedTransactions++
          setConcurrentTransactions((prev) =>
            prev.map((t) =>
              t.id === transaction.id
                ? {
                    ...t,
                    status: "aborted",
                    endTime,
                    duration: result.executionTime || endTime - (transaction.startTime || endTime),
                    error: result.error,
                  }
                : t,
            ),
          )
        }

        // 更新性能指标
        const totalExecuted = completedTransactions + abortedTransactions
        if (totalExecuted > 0) {
          const elapsed = (Date.now() - testStartTime.current) / 1000
          const currentTpmC = (completedTransactions / elapsed) * 60
          const currentAvgResponse = completedTransactions > 0 ? totalResponseTime / completedTransactions : 0
          const currentAbortRate = (abortedTransactions / totalExecuted) * 100

          setTotalTransactions(totalExecuted)
          setAvgResponseTime(currentAvgResponse)
          setTpmC(currentTpmC)
          setAbortRate(currentAbortRate)

          // 记录性能历史
          performanceHistory.push({
            time: Math.floor(elapsed),
            tpmC: currentTpmC,
            responseTime: currentAvgResponse,
            abortRate: currentAbortRate,
            activeTransactions: concurrentTransactions.filter((t) => t.status === "running").length,
            throughput: (totalExecuted / elapsed).toFixed(2),
          })
          setPerformanceData([...performanceHistory])
        }

        // 如果测试还在进行，启动新的事务
        if (isRunning && Date.now() - testStartTime.current < testDuration * 1000) {
          setTimeout(
            () => {
              const newTransactionType = getRandomTransactionType()

              executeTransaction({
                ...transaction,
                transactionType: newTransactionType,
                status: "waiting",
                startTime: undefined,
                endTime: undefined,
                duration: undefined,
                operations: 0,
              })
            },
            Math.random() * 1000 + 200,
          ) // 随机延迟0.2-1.2秒
        } else {
          // 测试结束，设置为等待状态
          setConcurrentTransactions((prev) =>
            prev.map((t) => (t.id === transaction.id ? { ...t, status: "waiting" } : t)),
          )
        }
      } catch (error) {
        abortedTransactions++
        setConcurrentTransactions((prev) =>
          prev.map((t) =>
            t.id === transaction.id
              ? {
                  ...t,
                  status: "aborted",
                  endTime: Date.now(),
                  error: error instanceof Error ? error.message : String(error),
                }
              : t,
          ),
        )
      }
    }

    // 为每个客户端启动事务
    initialTransactions.forEach((transaction) => {
      setTimeout(() => executeTransaction(transaction), Math.random() * 500) // 随机启动延迟
    })
  }

  const stopTest = () => {
    setIsRunning(false)
    if (testInterval.current) {
      clearInterval(testInterval.current)
    }
  }

  const exportResults = () => {
    const csvContent = [
      "Time,TpmC,ResponseTime(ms),AbortRate(%),ActiveTransactions,Throughput(TPS)",
      ...performanceData.map(
        (data) =>
          `${data.time},${data.tpmC.toFixed(2)},${data.responseTime.toFixed(2)},${data.abortRate.toFixed(2)},${data.activeTransactions},${data.throughput}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "tpc_c_concurrent_test_results.csv")
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
          <h1 className="text-3xl font-bold text-gray-900">TPC-C 并发事务测试</h1>
          <p className="text-gray-600 mt-2">真实数据库多客户端并发事务性能测试</p>
        </div>

        {/* 测试配置 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>并发事务测试配置</CardTitle>
            <CardDescription>设置并发客户端数量、事务混合类型和测试时长</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">并发客户端数量</label>
                <Input
                  type="number"
                  value={clientCount}
                  onChange={(e) => setClientCount(Number.parseInt(e.target.value) || 1)}
                  min="1"
                  max="50"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="text-sm font-medium">事务混合类型</label>
                <Select value={transactionMix} onValueChange={setTransactionMix} disabled={isRunning}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">标准混合 (45% NEW_ORDER)</SelectItem>
                    <SelectItem value="NEW_ORDER">仅新订单事务</SelectItem>
                    <SelectItem value="PAYMENT">仅付款事务</SelectItem>
                    <SelectItem value="random">随机混合</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">测试时长 (秒)</label>
                <Input
                  type="number"
                  value={testDuration}
                  onChange={(e) => setTestDuration(Number.parseInt(e.target.value) || 120)}
                  min="30"
                  max="600"
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={startConcurrentTest} disabled={isRunning} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                开始并发测试
              </Button>
              {isRunning && (
                <Button onClick={stopTest} variant="destructive">
                  <Stop className="h-4 w-4 mr-2" />
                  停止测试
                </Button>
              )}
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>测试进度</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 实时性能指标 */}
        {(isRunning || performanceData.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">TpmC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tpmC.toFixed(0)}</div>
                <div className="text-xs text-gray-500">
                  <Database className="h-3 w-3 inline mr-1" />
                  事务/分钟
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">平均响应时间</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgResponseTime.toFixed(1)}ms</div>
                <div className="text-xs text-gray-500">
                  <Clock className="h-3 w-3 inline mr-1" />
                  毫秒
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">中止率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{abortRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">事务中止百分比</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">总事务数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTransactions}</div>
                <div className="text-xs text-gray-500">
                  <Users className="h-3 w-3 inline mr-1" />
                  {clientCount} 个客户端
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 性能图表 */}
        {performanceData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>TpmC 趋势</CardTitle>
                <CardDescription>每分钟事务数 (Transactions per minute C)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="tpmC"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="TpmC"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>响应时间与中止率</CardTitle>
                <CardDescription>事务响应时间和中止率趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="responseTime" stroke="#82ca9d" name="响应时间 (ms)" />
                    <Line yAxisId="right" type="monotone" dataKey="abortRate" stroke="#ff7300" name="中止率 (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 事务状态 */}
        {concurrentTransactions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>事务状态</CardTitle>
                  <CardDescription>实时显示各客户端的事务执行状态</CardDescription>
                </div>
                {performanceData.length > 0 && (
                  <Button onClick={exportResults} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    导出结果
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>客户端ID</TableHead>
                      <TableHead>事务类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作数</TableHead>
                      <TableHead>执行时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {concurrentTransactions.slice(0, 20).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.clientId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.transactionType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "committed"
                                ? "default"
                                : transaction.status === "running"
                                  ? "secondary"
                                  : transaction.status === "aborted"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {transaction.status === "waiting"
                              ? "等待"
                              : transaction.status === "running"
                                ? "执行中"
                                : transaction.status === "committed"
                                  ? "已提交"
                                  : "已中止"}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.operations}</TableCell>
                        <TableCell>{transaction.duration ? `${transaction.duration}ms` : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {concurrentTransactions.length > 20 && (
                  <div className="text-center text-sm text-gray-500 mt-4">
                    显示前20个客户端，共{concurrentTransactions.length}个
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
