"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, AlertCircle, CheckCircle2, XCircle, Pause, Play, Square, Database } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"

interface ImportProgress {
  processed: number
  imported: number
  failed: number
  errors: Array<{
    line: number
    reason: string
    data: string
  }>
  fileSize?: number
  fileHash?: string
}

interface FileInfo {
  size: number
  hash: string
}

interface ImportResult {
  totalRows: number
  importedRows: number
  failedRows: number
  errors: Array<{
    line: number
    reason: string
    data: string
  }>
  success: boolean
}

export default function DataImportPage() {
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [delimiter, setDelimiter] = useState<string>("|")
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [progress, setProgress] = useState<ImportProgress>({ processed: 0, imported: 0, failed: 0, errors: [] })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<string>("")
  const [totalRows, setTotalRows] = useState<number>(0)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const startTimeRef = useRef<number>(0)

  // 完整的TPC-H 8张表配置
  const tables = [
    {
      id: "customer",
      name: "客户表 (CUSTOMER)",
      description: "客户基本信息 - 7字段",
      fields: ["c_custkey", "c_name", "c_address", "c_nationkey", "c_phone", "c_acctbal", "c_mktsegment", "c_comment"],
      category: "核心表",
    },
    {
      id: "orders",
      name: "订单表 (ORDERS)",
      description: "订单主表信息 - 9字段",
      fields: [
        "o_orderkey",
        "o_custkey",
        "o_orderstatus",
        "o_totalprice",
        "o_orderdate",
        "o_orderpriority",
        "o_clerk",
        "o_shippriority",
        "o_comment",
      ],
      category: "核心表",
    },
    {
      id: "lineitem",
      name: "订单明细表 (LINEITEM)",
      description: "订单行项目详情 - 16字段",
      fields: [
        "l_orderkey",
        "l_partkey",
        "l_suppkey",
        "l_linenumber",
        "l_quantity",
        "l_extendedprice",
        "l_discount",
        "l_tax",
        "l_returnflag",
        "l_linestatus",
        "l_shipdate",
        "l_commitdate",
        "l_receiptdate",
        "l_shipinstruct",
        "l_shipmode",
        "l_comment",
      ],
      category: "核心表",
    },
    {
      id: "part",
      name: "零部件表 (PART)",
      description: "零部件基本信息 - 9字段",
      fields: [
        "p_partkey",
        "p_name",
        "p_mfgr",
        "p_brand",
        "p_type",
        "p_size",
        "p_container",
        "p_retailprice",
        "p_comment",
      ],
      category: "产品表",
    },
    {
      id: "supplier",
      name: "供应商表 (SUPPLIER)",
      description: "供应商基本信息 - 7字段",
      fields: ["s_suppkey", "s_name", "s_address", "s_nationkey", "s_phone", "s_acctbal", "s_comment"],
      category: "产品表",
    },
    {
      id: "partsupp",
      name: "零部件供应表 (PARTSUPP)",
      description: "零部件供应关系 - 5字段",
      fields: ["ps_partkey", "ps_suppkey", "ps_availqty", "ps_supplycost", "ps_comment"],
      category: "产品表",
    },
    {
      id: "nation",
      name: "国家表 (NATION)",
      description: "国家基本信息 - 4字段",
      fields: ["n_nationkey", "n_name", "n_regionkey", "n_comment"],
      category: "维度表",
    },
    {
      id: "region",
      name: "地区表 (REGION)",
      description: "地区基本信息 - 3字段",
      fields: ["r_regionkey", "r_name", "r_comment"],
      category: "维度表",
    },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setTotalRows(0) // 重置总行数

      // 计算文件总行数
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const lines = content.split("\n")
        setTotalRows(lines.length)
        
        // 预览前10行
        const previewLines = lines.slice(0, 10).join("\n")
        setPreviewData(previewLines)
      }
      reader.readAsText(selectedFile)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number) => {
    return formatFileSize(bytesPerSecond) + "/s"
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}秒`
    if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
    return `${Math.round(seconds / 3600)}小时`
  }

  const handleUpload = async () => {
    if (!file || !selectedTable) return

    setIsUploading(true)
    setIsPaused(false)
    setProgress({ processed: 0, imported: 0, failed: 0, errors: [] })
    setImportResult(null)
    startTimeRef.current = Date.now()

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    const formData = new FormData()
    formData.append("file", file)
    formData.append("table", selectedTable)
    formData.append("delimiter", delimiter)

    try {
      const response = await fetch("/api/import-data-stream", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("无法读取响应流")
      }

      let buffer = "" // 用于存储未完成的数据块

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // 处理最后可能剩余的数据
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer)
              handleStreamData(data)
            } catch (e) {
              console.error("处理最后数据块时出错:", buffer, e)
            }
          }
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // 按行分割并处理完整的数据块
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // 保留最后一个可能不完整的行

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const data = JSON.parse(line)
            handleStreamData(data)
          } catch (parseError) {
            console.error("解析响应数据失败:", {
              line,
              error: parseError,
              buffer: buffer.slice(0, 100) // 只显示前100个字符
            })
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("导入已取消")
      } else {
        console.error("导入失败:", error)
        setImportResult({
          totalRows: 0,
          importedRows: 0,
          failedRows: 0,
          errors: [
            {
              line: 0,
              reason: `导入失败: ${error instanceof Error ? error.message : String(error)}`,
              data: "",
            },
          ],
          success: false,
        })
      }
      setIsUploading(false)
    }
  }

  // 处理流数据的辅助函数
  const handleStreamData = (data: any) => {
    if (data.type === "fileInfo") {
      setFileInfo(data.data)
    } else if (data.type === "progress") {
      setProgress(data.data)
      // 输出文件信息
      if (data.data.fileSize && data.data.fileHash) {
        console.log('文件信息:', {
          size: data.data.fileSize,
          hash: data.data.fileHash
        })
      }
    } else if (data.type === "complete") {
      setImportResult(data.data)
      setIsUploading(false)
    } else if (data.type === "error") {
      console.error('导入错误:', data.data)
      throw new Error(data.data.error)
    }
  }

  const handlePause = () => {
    setIsPaused(true)
    // 注意：当前实现不支持真正的暂停，这里只是UI状态
  }

  const handleResume = () => {
    setIsPaused(false)
    // 注意：当前实现不支持真正的恢复，这里只是UI状态
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsUploading(false)
    setIsPaused(false)
  }

  const getProgressPercentage = () => {
    if (!file || progress.processed === 0) return 0
    // 使用已处理行数和总行数的比例计算进度
    if (totalRows === 0) return 0
    return Math.min((progress.processed / totalRows) * 100, 100)
  }

  const selectedTableInfo = tables.find((t) => t.id === selectedTable)

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
          <h1 className="text-3xl font-bold text-gray-900">TPC-H 数据导入</h1>
          <p className="text-gray-600 mt-2">支持完整的TPC-H 8张表数据导入，GB级别文件流式处理</p>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">文件上传</TabsTrigger>
            <TabsTrigger value="tables">表结构</TabsTrigger>
            <TabsTrigger value="guide">导入指南</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>选择导入表和文件</CardTitle>
                <CardDescription>支持TPC-H标准的8张表，GB级别大文件流式处理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">选择目标表</label>
                    <Select value={selectedTable} onValueChange={setSelectedTable} disabled={isUploading}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择要导入的表..." />
                      </SelectTrigger>
                      <SelectContent>
                        {["核心表", "产品表", "维度表"].map((category) => (
                          <div key={category}>
                            <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100">{category}</div>
                            {tables
                              .filter((table) => table.category === category)
                              .map((table) => (
                                <SelectItem key={table.id} value={table.id}>
                                  <div>
                                    <div>{table.name}</div>
                                    <div className="text-xs text-gray-500">{table.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">分隔符</label>
                    <Select value={delimiter} onValueChange={setDelimiter} disabled={isUploading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="|">竖线 (|) - TPC-H标准</SelectItem>
                        <SelectItem value=",">逗号 (,)</SelectItem>
                        <SelectItem value="\t">制表符 (Tab)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedTableInfo && (
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertTitle>{selectedTableInfo.name}</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <div className="text-sm mb-2">字段列表 ({selectedTableInfo.fields.length} 个字段):</div>
                        <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                          {selectedTableInfo.fields.join(" | ")}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">选择数据文件</label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".txt,.csv,.dat,.tbl"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    {!isUploading ? (
                      <Button onClick={handleUpload} disabled={!file || !selectedTable}>
                        <Upload className="h-4 w-4 mr-2" />
                        开始导入
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        {!isPaused ? (
                          <Button onClick={handlePause} variant="outline" size="sm">
                            <Pause className="h-4 w-4 mr-2" />
                            暂停
                          </Button>
                        ) : (
                          <Button onClick={handleResume} variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            继续
                          </Button>
                        )}
                        <Button onClick={handleStop} variant="destructive" size="sm">
                          <Square className="h-4 w-4 mr-2" />
                          停止
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>支持 .txt, .csv, .dat, .tbl 格式文件</span>
                    <div className="space-x-4">
                      <span>文件大小: {formatFileSize(file?.size || 0)}</span>
                      {totalRows > 0 && <span>总行数: {totalRows.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>

                {file && previewData && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">文件预览 (前10行)</h3>
                    <Textarea value={previewData} readOnly className="font-mono text-xs h-40" />
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-blue-600 font-medium">已处理</div>
                        <div className="text-lg font-bold">{progress.processed.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">行</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-600 font-medium">已导入</div>
                        <div className="text-lg font-bold">{progress.imported.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">行</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-red-600 font-medium">失败</div>
                        <div className="text-lg font-bold">{progress.failed.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">行</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>导入进度</span>
                        <span>{getProgressPercentage().toFixed(1)}%</span>
                      </div>
                      <Progress value={getProgressPercentage()} />
                    </div>

                    {progress.fileSize && (
                      <div className="text-sm text-gray-500">
                        <div>文件大小: {formatFileSize(progress.fileSize)}</div>
                        {progress.fileHash && <div>文件哈希: {progress.fileHash}</div>}
                      </div>
                    )}

                    {progress.errors.length > 0 && (
                      <div className="max-h-40 overflow-y-auto">
                        <h4 className="text-sm font-medium mb-2">最近错误 (显示最新10条)</h4>
                        {progress.errors.slice(-5).map((error, index) => (
                          <Alert key={index} variant="destructive" className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>第 {error.line} 行</AlertTitle>
                            <AlertDescription className="text-xs">{error.reason}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {importResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    导入完成
                  </CardTitle>
                  <CardDescription>
                    总行数: {importResult.totalRows.toLocaleString()}, 成功导入:{" "}
                    {importResult.importedRows.toLocaleString()}, 失败: {importResult.failedRows.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {importResult.success ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>导入成功</AlertTitle>
                      <AlertDescription>
                        成功导入 {importResult.importedRows.toLocaleString()} 条记录到{" "}
                        {tables.find((t) => t.id === selectedTable)?.name} 中。
                        {importResult.failedRows > 0 &&
                          ` 有 ${importResult.failedRows.toLocaleString()} 条记录因数据问题未能导入。`}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>导入失败</AlertTitle>
                      <AlertDescription>导入过程中发生错误，请检查文件格式和数据内容。</AlertDescription>
                    </Alert>
                  )}

                  {importResult.errors.length > 0 && (
                    <div className="mt-4 max-h-60 overflow-y-auto">
                      <h4 className="text-sm font-medium mb-2">错误详情 (显示前20条)</h4>
                      {importResult.errors.slice(0, 20).map((error, index) => (
                        <Alert key={index} variant="destructive" className="mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>第 {error.line} 行</AlertTitle>
                          <AlertDescription className="space-y-1">
                            <div>{error.reason}</div>
                            <div className="text-xs font-mono bg-gray-100 p-1 rounded">{error.data}</div>
                          </AlertDescription>
                        </Alert>
                      ))}
                      {importResult.errors.length > 20 && (
                        <div className="text-sm text-gray-500 text-center">
                          还有 {importResult.errors.length - 20} 个错误未显示...
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tables">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <Card key={table.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{table.name}</CardTitle>
                    <CardDescription>{table.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">字段列表:</div>
                      <div className="text-xs font-mono bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                        {table.fields.map((field, index) => (
                          <div key={field}>
                            {index + 1}. {field}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">共 {table.fields.length} 个字段</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guide">
            <Card>
              <CardHeader>
                <CardTitle>TPC-H 数据导入指南</CardTitle>
                <CardDescription>如何准备和导入TPC-H标准数据文件</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">TPC-H 表结构说明</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-blue-600">核心表</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>CUSTOMER - 客户信息</li>
                        <li>ORDERS - 订单主表</li>
                        <li>LINEITEM - 订单明细（最大表）</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-600">产品表</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>PART - 零部件信息</li>
                        <li>SUPPLIER - 供应商信息</li>
                        <li>PARTSUPP - 零部件供应关系</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-600">维度表</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>NATION - 国家信息</li>
                        <li>REGION - 地区信息</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">导入顺序建议</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>先导入维度表：REGION → NATION</li>
                    <li>再导入基础表：CUSTOMER, SUPPLIER, PART</li>
                    <li>然后导入关系表：PARTSUPP</li>
                    <li>最后导入事务表：ORDERS → LINEITEM</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">文件格式要求</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>TPC-H标准使用竖线(|)作为分隔符</li>
                    <li>文件通常以.tbl扩展名结尾</li>
                    <li>每行末尾可能有额外的分隔符，系统会自动处理</li>
                    <li>日期格式：YYYY-MM-DD</li>
                    <li>数值格式：使用小数点，不使用千位分隔符</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">性能特性</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>支持GB级别大文件（最大2GB）</li>
                    <li>流式处理，内存占用低</li>
                    <li>批量插入，每批1000条记录</li>
                    <li>实时进度显示和错误报告</li>
                    <li>自动跳过重复数据</li>
                    <li>详细的数据验证和错误提示</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">故障排除</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>确保字段数量与表结构匹配</li>
                    <li>检查数据类型是否正确（整数、小数、日期）</li>
                    <li>验证外键约束（如nation_key, region_key）</li>
                    <li>确认文件编码为UTF-8</li>
                    <li>如果导入中断，可以重新开始（会自动跳过重复数据）</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
