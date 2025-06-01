"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Search, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Customer {
  c_custkey: number
  c_name: string
  c_address: string
  c_nationkey: number
  c_phone: string
  c_acctbal: number
  c_mktsegment: string
  c_comment: string
  n_name?: string
}

export default function CustomerQueryPage() {
  const [searchInput, setSearchInput] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [queryResults, setQueryResults] = useState<Customer[]>([])
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [customerNames, setCustomerNames] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // 初始化下拉列表数据
  const initializeDropdowns = async () => {
    if (isInitialized) return

    try {
      // 获取客户名称列表
      const namesResponse = await fetch("/api/customers/names")
      if (namesResponse.ok) {
        const namesData = await namesResponse.json()
        setCustomerNames(namesData)
      }

      // 获取国家名称列表
      const countriesResponse = await fetch("/api/countries")
      if (countriesResponse.ok) {
        const countriesData = await countriesResponse.json()
        setCountries(countriesData)
      }

      setIsInitialized(true)
    } catch (error) {
      console.error("初始化下拉列表失败:", error)
    }
  }

  // 组件挂载时初始化
  if (typeof window !== "undefined" && !isInitialized) {
    initializeDropdowns()
  }

  const handleInputSearch = async () => {
    if (!searchInput.trim()) return

    setIsLoading(true)
    const startTime = Date.now()

    try {
      const response = await fetch(`/api/customers/search?term=${encodeURIComponent(searchInput)}`)
      if (response.ok) {
        const data = await response.json()
        setQueryResults(data)
      } else {
        console.error("查询失败:", await response.text())
        setQueryResults([])
      }
    } catch (error) {
      console.error("查询出错:", error)
      setQueryResults([])
    } finally {
      const endTime = Date.now()
      setQueryTime(endTime - startTime)
      setIsLoading(false)
    }
  }

  const handleDropdownSearch = async () => {
    if (!selectedCustomer && !selectedCountry) return

    setIsLoading(true)
    const startTime = Date.now()

    try {
      let url = "/api/customers/filter?"
      if (selectedCustomer && selectedCustomer !== "all") {
        url += `name=${encodeURIComponent(selectedCustomer)}&`
      }
      if (selectedCountry && selectedCountry !== "all") {
        url += `country=${encodeURIComponent(selectedCountry)}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setQueryResults(data)
      } else {
        console.error("查询失败:", await response.text())
        setQueryResults([])
      }
    } catch (error) {
      console.error("查询出错:", error)
      setQueryResults([])
    } finally {
      const endTime = Date.now()
      setQueryTime(endTime - startTime)
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (queryResults.length === 0) return

    const headers = ["ID", "客户姓名", "国家", "地址", "电话", "细分市场", "账户余额", "备注"]
    const csvContent = [
      headers.join(","),
      ...queryResults.map((customer) =>
        [
          customer.c_custkey,
          customer.c_name,
          customer.n_name || "",
          `"${customer.c_address.replace(/"/g, '""')}"`,
          customer.c_phone,
          customer.c_mktsegment,
          customer.c_acctbal,
          `"${customer.c_comment?.replace(/"/g, '""') || ""}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "customer_query_results.csv")
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
          <h1 className="text-3xl font-bold text-gray-900">客户信息查询</h1>
          <p className="text-gray-600 mt-2">支持输入框和下拉列表两种查询方式</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 输入框查询 */}
          <Card>
            <CardHeader>
              <CardTitle>输入框查询</CardTitle>
              <CardDescription>输入客户姓名或国家名称进行查询</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="输入客户姓名或国家名称..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleInputSearch()}
                disabled={isLoading}
              />
              <Button onClick={handleInputSearch} className="w-full" disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "查询中..." : "搜索"}
              </Button>
            </CardContent>
          </Card>

          {/* 下拉列表查询 */}
          <Card>
            <CardHeader>
              <CardTitle>下拉列表查询</CardTitle>
              <CardDescription>通过下拉列表选择客户或国家</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部客户</SelectItem>
                  {customerNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="选择国家" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部国家</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleDropdownSearch} className="w-full" disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "查询中..." : "查询"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 查询结果 */}
        {queryResults.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>查询结果</CardTitle>
                  <CardDescription>
                    找到 {queryResults.length} 条记录
                    {queryTime && ` (查询时间: ${queryTime}ms)`}
                  </CardDescription>
                </div>
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  导出CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>客户姓名</TableHead>
                      <TableHead>国家</TableHead>
                      <TableHead>地址</TableHead>
                      <TableHead>电话</TableHead>
                      <TableHead>细分市场</TableHead>
                      <TableHead>账户余额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryResults.map((customer) => (
                      <TableRow key={customer.c_custkey}>
                        <TableCell>{customer.c_custkey}</TableCell>
                        <TableCell className="font-medium">{customer.c_name}</TableCell>
                        <TableCell>{customer.n_name || "-"}</TableCell>
                        <TableCell>{customer.c_address}</TableCell>
                        <TableCell>{customer.c_phone}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.c_mktsegment}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${customer.c_acctbal.toFixed(2)}</TableCell>
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
