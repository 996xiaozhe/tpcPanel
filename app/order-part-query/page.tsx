"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Search, ArrowLeft, BarChart3, AlertCircle } from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function OrderPartQueryPage() {
  const [queryType, setQueryType] = useState<"order" | "part">("order")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [showChart, setShowChart] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        type: queryType,
        search: searchTerm,
        status: statusFilter,
      })

      console.log("发送查询请求:", {
        type: queryType,
        search: searchTerm,
        status: statusFilter
      })

      const response = await fetch(`/api/order-part-queries?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("收到查询结果:", result)

      if (result.error) {
        throw new Error(result.error)
      }

      if (!Array.isArray(result.data)) {
        console.error("返回的数据格式不正确:", result)
        throw new Error("返回的数据格式不正确")
      }

      setResults(result.data)
      setQueryTime(result.executionTime)
    } catch (error) {
      console.error("查询失败:", error)
      setError(error instanceof Error ? error.message : "查询失败")
      setResults([])
      setQueryTime(null)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (results.length === 0) return

    let headers: string[] = []
    let csvContent = ""

    if (queryType === "order") {
      headers = ["订单ID", "客户ID", "客户姓名", "订单日期", "状态", "总价", "优先级"]
      csvContent = [
        headers.join(","),
        ...results.map((order: any) =>
          [
            order.id,
            order.customer_id,
            order.customer_name,
            order.order_date,
            order.status,
            order.total_price,
            order.priority,
          ].join(","),
        ),
      ].join("\n")
    } else {
      headers = ["零部件ID", "名称", "品牌", "类型", "尺寸", "容器", "零售价"]
      csvContent = [
        headers.join(","),
        ...results.map((part: any) =>
          [part.id, part.name, part.brand, part.type, part.size, part.container, part.retail_price].join(","),
        ),
      ].join("\n")
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${queryType}_query_results.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getChartData = () => {
    if (queryType === "order") {
      const statusCount = results.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {})
      return Object.entries(statusCount).map(([status, count]) => ({ name: status, value: count }))
    } else {
      const typeCount = results.reduce((acc: any, part: any) => {
        const type = part.type.split(" ")[0] // 取类型的第一个词
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
      return Object.entries(typeCount)
        .slice(0, 5)
        .map(([type, count]) => ({ name: type, value: count }))
    }
  }

  const getPriceChartData = () => {
    if (queryType === "order") {
      return results.slice(0, 10).map((order: any) => ({
        name: `订单${order.id}`,
        price: Number.parseFloat(order.total_price),
      }))
    } else {
      return results.slice(0, 10).map((part: any) => ({
        name: part.name.substring(0, 15) + "...",
        price: Number.parseFloat(part.retail_price),
      }))
    }
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
          <h1 className="text-3xl font-bold text-gray-900">订单零部件查询</h1>
          <p className="text-gray-600 mt-2">查询真实的订单和零部件信息，支持图表展示</p>
        </div>

        {/* 查询条件 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>查询条件</CardTitle>
            <CardDescription>选择查询类型并设置筛选条件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={queryType} onValueChange={(value: "order" | "part") => setQueryType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="查询类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">订单查询</SelectItem>
                  <SelectItem value="part">零部件查询</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder={queryType === "order" ? "输入客户姓名或订单ID..." : "输入零部件名称或品牌..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={queryType === "order" ? "订单状态" : "零部件类型"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {queryType === "order" ? (
                    <>
                      <SelectItem value="O">进行中</SelectItem>
                      <SelectItem value="F">已完成</SelectItem>
                      <SelectItem value="P">部分完成</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="STANDARD">标准</SelectItem>
                      <SelectItem value="SMALL">小型</SelectItem>
                      <SelectItem value="MEDIUM">中型</SelectItem>
                      <SelectItem value="LARGE">大型</SelectItem>
                      <SelectItem value="ECONOMY">经济型</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "查询中..." : "查询"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 查询结果 */}
        {results.length > 0 && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>查询结果</CardTitle>
                    <CardDescription>
                      找到 {results.length} 条记录
                      {queryTime && ` (查询时间: ${queryTime}ms)`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowChart(!showChart)} variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {showChart ? "隐藏图表" : "显示图表"}
                    </Button>
                    <Button onClick={exportToCSV} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      导出CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {queryType === "order" ? (
                          <>
                            <TableHead>订单ID</TableHead>
                            <TableHead>客户ID</TableHead>
                            <TableHead>客户姓名</TableHead>
                            <TableHead>订单日期</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>总价</TableHead>
                            <TableHead>优先级</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>零部件ID</TableHead>
                            <TableHead>名称</TableHead>
                            <TableHead>品牌</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>尺寸</TableHead>
                            <TableHead>容器</TableHead>
                            <TableHead>零售价</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.slice(0, 50).map((item: any) => (
                        <TableRow key={item.id}>
                          {queryType === "order" ? (
                            <>
                              <TableCell>{item.id}</TableCell>
                              <TableCell>{item.customer_id}</TableCell>
                              <TableCell className="font-medium">{item.customer_name}</TableCell>
                              <TableCell>{item.order_date}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.status === "F" ? "default" : item.status === "O" ? "secondary" : "outline"
                                  }
                                >
                                  {item.status === "F" ? "已完成" : item.status === "O" ? "进行中" : item.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                ${Number.parseFloat(item.total_price).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.priority === "1-URGENT"
                                      ? "destructive"
                                      : item.priority === "2-HIGH"
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {item.priority}
                                </Badge>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>{item.id}</TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.brand}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{item.type}</Badge>
                              </TableCell>
                              <TableCell>{item.size}</TableCell>
                              <TableCell>{item.container}</TableCell>
                              <TableCell className="text-right">
                                ${Number.parseFloat(item.retail_price).toFixed(2)}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {results.length > 50 && (
                    <div className="text-center text-sm text-gray-500 mt-4">显示前50条记录，共{results.length}条</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 图表展示 */}
            {showChart && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{queryType === "order" ? "订单状态分布" : "零部件类型分布"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{queryType === "order" ? "订单金额分布" : "零部件价格分布"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getPriceChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="price" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
