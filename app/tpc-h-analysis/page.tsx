"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Play, ArrowLeft, Clock, Database } from "lucide-react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// TPC-H 查询模板
const tpcHQueries = [
  {
    id: "Q1",
    name: "定价汇总报表查询",
    description: "按退货标志、线路状态分组的定价汇总报表",
    complexity: "中等",
    estimatedTime: "2-5s",
    parameters: [],
  },
  {
    id: "Q3",
    name: "运输优先级查询",
    description: "获取指定市场细分的客户在指定日期之前的订单收入",
    complexity: "高",
    estimatedTime: "3-8s",
    parameters: [
      {
        name: "segment",
        label: "市场细分",
        type: "select",
        options: ["BUILDING", "AUTOMOBILE", "MACHINERY", "HOUSEHOLD", "FURNITURE"],
        default: "BUILDING",
      },
    ],
  },
  {
    id: "Q5",
    name: "本地供应商销量查询",
    description: "列出指定地区在指定年份的收入",
    complexity: "高",
    estimatedTime: "4-10s",
    parameters: [
      {
        name: "region",
        label: "地区",
        type: "select",
        options: ["ASIA", "AMERICA", "EUROPE", "MIDDLE EAST", "AFRICA"],
        default: "ASIA",
      },
    ],
  },
  {
    id: "Q7",
    name: "销量查询",
    description: "两个国家之间的贸易量",
    complexity: "高",
    estimatedTime: "5-12s",
    parameters: [
      {
        name: "nation1",
        label: "国家1",
        type: "input",
        default: "FRANCE",
      },
      {
        name: "nation2",
        label: "国家2",
        type: "input",
        default: "GERMANY",
      },
    ],
  },
  {
    id: "Q10",
    name: "退货客户查询",
    description: "分析退货客户的损失",
    complexity: "中等",
    estimatedTime: "2-6s",
    parameters: [],
  },
]

export default function TPCHAnalysisPage() {
  const [selectedQuery, setSelectedQuery] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [executionPlan, setExecutionPlan] = useState<string>("")
  const [parameters, setParameters] = useState<Record<string, string>>({})
  const [queryInfo, setQueryInfo] = useState<any>(null)

  const selectedQueryConfig = tpcHQueries.find((q) => q.id === selectedQuery)

  const executeQuery = async () => {
    if (!selectedQuery) return

    setIsExecuting(true)
    const startTime = Date.now()

    try {
      const response = await fetch("/api/tpc-h-queries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queryId: selectedQuery,
          parameters,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setQueryResults(result.data)
      setExecutionTime(result.executionTime)
      setQueryInfo(result.queryInfo)

      // 生成执行计划信息
      setExecutionPlan(`
查询执行分析:
查询名称: ${result.queryInfo.name}
执行时间: ${result.executionTime}ms
返回行数: ${result.data.length}

SQL查询:
${result.queryInfo.sql}

性能指标:
- 查询复杂度: ${selectedQueryConfig?.complexity}
- 涉及表数: ${(result.queryInfo.sql.match(/FROM|JOIN/gi) || []).length}
- 聚合函数: ${(result.queryInfo.sql.match(/SUM|AVG|COUNT|MAX|MIN/gi) || []).length}
- 排序操作: ${result.queryInfo.sql.includes("ORDER BY") ? "是" : "否"}
- 分组操作: ${result.queryInfo.sql.includes("GROUP BY") ? "是" : "否"}

数据库优化建议:
- 确保相关字段有适当的索引
- 考虑分区大表以提高查询性能
- 监控查询执行计划以识别瓶颈
`)
    } catch (error) {
      console.error("查询执行失败:", error)
      setQueryResults([])
      setExecutionPlan(`查询执行失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const exportResults = () => {
    if (queryResults.length === 0) return

    const headers = Object.keys(queryResults[0])
    const csvContent = [
      headers.join(","),
      ...queryResults.map((row) => headers.map((header) => row[header]).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `tpc_h_${selectedQuery}_results.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getChartData = () => {
    if (queryResults.length === 0) return []

    if (selectedQuery === "Q1") {
      return queryResults.map((row) => ({
        name: `${row.l_returnflag}-${row.l_linestatus}`,
        revenue: Number.parseFloat(row.sum_disc_price) / 1000000, // 转换为百万
        orders: Number.parseInt(row.count_order) / 1000, // 转换为千
      }))
    } else if (selectedQuery === "Q5") {
      return queryResults.slice(0, 10).map((row) => ({
        name: row.n_name,
        revenue: Number.parseFloat(row.revenue) / 1000000, // 转换为百万
      }))
    } else if (selectedQuery === "Q3") {
      return queryResults.slice(0, 10).map((row) => ({
        name: `订单${row.l_orderkey}`,
        revenue: Number.parseFloat(row.revenue) / 1000, // 转换为千
      }))
    } else if (selectedQuery === "Q10") {
      return queryResults.slice(0, 10).map((row) => ({
        name: row.c_name.substring(0, 10),
        revenue: Number.parseFloat(row.revenue) / 1000, // 转换为千
      }))
    }
    return []
  }

  const handleParameterChange = (paramName: string, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [paramName]: value,
    }))
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
          <h1 className="text-3xl font-bold text-gray-900">TPC-H 统计分析</h1>
          <p className="text-gray-600 mt-2">复杂SQL查询和统计分析，连接真实数据库</p>
        </div>

        {/* 查询选择 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>选择TPC-H查询</CardTitle>
            <CardDescription>选择要执行的复杂统计分析查询</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedQuery} onValueChange={setSelectedQuery}>
              <SelectTrigger>
                <SelectValue placeholder="选择查询..." />
              </SelectTrigger>
              <SelectContent>
                {tpcHQueries.map((query) => (
                  <SelectItem key={query.id} value={query.id}>
                    {query.id} - {query.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedQueryConfig && (
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedQueryConfig.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{selectedQueryConfig.description}</p>
                  <div className="flex gap-4 mb-3">
                    <Badge variant="secondary">复杂度: {selectedQueryConfig.complexity}</Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      预估时间: {selectedQueryConfig.estimatedTime}
                    </Badge>
                  </div>

                  {/* 参数设置 */}
                  {selectedQueryConfig.parameters.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">查询参数:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedQueryConfig.parameters.map((param) => (
                          <div key={param.name}>
                            <label className="text-sm font-medium">{param.label}</label>
                            {param.type === "select" ? (
                              <Select
                                value={parameters[param.name] || param.default}
                                onValueChange={(value) => handleParameterChange(param.name, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {param.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={parameters[param.name] || param.default}
                                onChange={(e) => handleParameterChange(param.name, e.target.value)}
                                placeholder={param.default}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={executeQuery} disabled={isExecuting} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  {isExecuting ? "执行中..." : "执行查询"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 执行结果 */}
        {queryResults.length > 0 && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>查询结果</CardTitle>
                    <CardDescription>
                      查询执行时间: {executionTime}ms | 返回 {queryResults.length} 条记录
                    </CardDescription>
                  </div>
                  <Button onClick={exportResults} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    导出结果
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(queryResults[0]).map((key) => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryResults.slice(0, 20).map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value: any, i) => (
                            <TableCell key={i}>
                              {typeof value === "number"
                                ? value > 1000
                                  ? value.toLocaleString()
                                  : value.toFixed(2)
                                : String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {queryResults.length > 20 && (
                    <div className="text-center text-sm text-gray-500 mt-4">
                      显示前20条记录，共{queryResults.length}条
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 图表展示 */}
            {getChartData().length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>数据可视化</CardTitle>
                  <CardDescription>查询结果的图表展示</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="收入" />
                      {selectedQuery === "Q1" && <Bar dataKey="orders" fill="#82ca9d" name="订单数" />}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* 执行计划 */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Database className="h-5 w-5 inline mr-2" />
                  查询执行分析
                </CardTitle>
                <CardDescription>SQL查询的执行过程和性能分析</CardDescription>
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
