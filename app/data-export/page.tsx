"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const TABLES = [
  "CUSTOMER",
  "ORDERS",
  "LINEITEM",
  "PART",
  "PARTSUPP",
  "SUPPLIER",
  "NATION",
  "REGION"
]

const FORMATS = [
  { value: "csv", label: "CSV" },
  { value: "txt", label: "TXT" }
]

export default function DataExportPage() {
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [selectedFormat, setSelectedFormat] = useState<string>("csv")
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!selectedTable) {
      toast.error("请选择要导出的表")
      return
    }

    try {
      setIsExporting(true)
      const response = await fetch("/api/data/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: selectedTable,
          format: selectedFormat,
        }),
      })

      if (!response.ok) {
        throw new Error("导出失败")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedTable}.${selectedFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("导出成功")
    } catch (error) {
      toast.error("导出失败：" + (error as Error).message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>数据导出</CardTitle>
          <CardDescription>选择要导出的表和导出格式</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">选择表</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要导出的表" />
                </SelectTrigger>
                <SelectContent>
                  {TABLES.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">导出格式</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="选择导出格式" />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleExport}
              disabled={!selectedTable || isExporting}
              className="w-full"
            >
              {isExporting ? "导出中..." : "导出数据"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 