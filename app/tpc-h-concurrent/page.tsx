"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, Play, CircleStopIcon as Stop, ArrowLeft, Users, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ConcurrentTest {
  id: string
  queryId: string
  name: string
  status: "waiting" | "running" | "completed" | "failed"
  startTime?: number
  endTime?: number
  duration?: number
  rowCount?: number
  error?: string
}

export default function TPCHConcurrentPage() {
  const [clientCount, setClientCount] = useState(5)
  const [queryMix, setQueryMix] = useState("mixed")
  const [testDuration, setTestDuration] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [concurrentTests, setConcurrentTests] = useState<ConcurrentTest[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [totalQueries, setTotalQueries] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState(0)
  const [throughput, setThroughput] = useState(0)
  const [errorRate, setErrorRate] = useState(0)

  const queryTypes = ["Q1", "Q3", "Q5"]
  const testStartTime = useRef<number>(0)
  const testInterval = useRef<NodeJS.Timeout | null>(null)

  const startConcurrentTest = async () => {
    setIsRunning(true)
    setProgress(0)
    setConcurrentTests([])
    setPerformanceData([])
    setTotalQueries(0)
    setAvgResponseTime(0)
    setThroughput(0)
    setErrorRate(0)
    testStartTime.current = Date.now()

    try {
      const response = await fetch("http://localhost:8000/api/tpch/concurrent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryIds: queryMix === "mixed" ? queryTypes : [queryMix],
          concurrency: clientCount,
          duration: testDuration,
          params: {
            Q3: ["BUILDING", "1995-03-15"],
            Q5: ["ASIA", "1994-01-01", "1995-01-01"]
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // 更新性能指标
        setTotalQueries(result.summary.totalQueries)
        setAvgResponseTime(result.summary.avgResponseTime)
        setThroughput(result.summary.throughput)
        setErrorRate(result.summary.errorRate)

        // 更新测试结果
        const tests = result.results.map((r: any, index: number) => ({
          id: `test-${index}`,
          queryId: r.queryId,
          name: r.name,
          status: r.success ? "completed" : "failed",
          duration: r.executionTime,
          rowCount: r.rowCount,
          error: r.error
        }))
        setConcurrentTests(tests)

        // 更新性能数据
        const performanceHistory = result.results.map((r: any) => ({
          time: new Date(r.timestamp).getTime() - testStartTime.current,
          throughput: result.summary.throughput,
          responseTime: r.executionTime,
          errorRate: result.summary.errorRate,
          activeClients: clientCount
        }))
        setPerformanceData(performanceHistory)
      } else {
        console.error("测试执行失败:", result.error)
      }
    } catch (error) {
      console.error("测试执行出错:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const stopTest = () => {
    setIsRunning(false)
    if (testInterval.current) {
      clearInterval(testInterval.current)
    }
  }

  const exportResults = () => {
    const csvContent = [
      "Time,Throughput(QPS),AvgResponseTime(ms),ErrorRate(%),ActiveClients",
      ...performanceData.map(
        (data) =>
          `${data.time},${data.throughput.toFixed(2)},${data.responseTime.toFixed(2)},${data.errorRate.toFixed(2)},${data.activeClients}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "tpc_h_concurrent_test_results.csv")
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
          <h1 className="text-3xl font-bold text-gray-900">TPC-H 并发测试</h1>
          <p className="text-gray-600 mt-2">真实数据库多客户端并发查询性能测试</p>
        </div>

        {/* 测试配置 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>并发测试配置</CardTitle>
            <CardDescription>设置并发客户端数量、查询类型和测试时长</CardDescription>
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
                  max="20"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="text-sm font-medium">查询类型</label>
                <Select value={queryMix} onValueChange={setQueryMix} disabled={isRunning}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">混合查询</SelectItem>
                    <SelectItem value="Q1">Q1 - 定价汇总</SelectItem>
                    <SelectItem value="Q3">Q3 - 运输优先级</SelectItem>
                    <SelectItem value="Q5">Q5 - 本地供应商</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">测试时长 (秒)</label>
                <Input
                  type="number"
                  value={testDuration}
                  onChange={(e) => setTestDuration(Number.parseInt(e.target.value) || 60)}
                  min="10"
                  max="300"
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
                <CardTitle className="text-sm">总查询数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalQueries}</div>
                <div className="text-xs text-gray-500">
                  <Users className="h-3 w-3 inline mr-1" />
                  {clientCount} 个客户端
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
                <CardTitle className="text-sm">吞吐量</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{throughput.toFixed(2)}</div>
                <div className="text-xs text-gray-500">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  QPS (查询/秒)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">错误率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errorRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">查询失败百分比</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 性能图表 */}
        {performanceData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>吞吐量趋势</CardTitle>
                <CardDescription>每秒查询数 (QPS)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="throughput" stroke="#8884d8" name="吞吐量 (QPS)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>响应时间与错误率</CardTitle>
                <CardDescription>平均响应时间和错误率趋势</CardDescription>
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
                    <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#ff7300" name="错误率 (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 客户端状态 */}
        {concurrentTests.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>客户端状态</CardTitle>
                  <CardDescription>实时显示各客户端的执行状态</CardDescription>
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
                      <TableHead>查询ID</TableHead>
                      <TableHead>查询名称</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>执行时间</TableHead>
                      <TableHead>返回行数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {concurrentTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>{test.queryId}</TableCell>
                        <TableCell>{test.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              test.status === "completed"
                                ? "default"
                                : test.status === "running"
                                  ? "secondary"
                                  : test.status === "failed"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {test.status === "waiting"
                              ? "等待"
                              : test.status === "running"
                                ? "执行中"
                                : test.status === "completed"
                                  ? "完成"
                                  : "失败"}
                          </Badge>
                        </TableCell>
                        <TableCell>{test.duration ? `${test.duration.toFixed(1)}ms` : "-"}</TableCell>
                        <TableCell>{test.rowCount || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
