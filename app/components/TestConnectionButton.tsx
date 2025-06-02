"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import { toast } from "sonner"

export function TestConnectionButton() {
  const [isTesting, setIsTesting] = useState(false)

  const testConnection = async () => {
    setIsTesting(true)
    try {
      const response = await fetch("/api/test-connection")
      const data = await response.json()
      
      if (data.success) {
        toast.success("数据库连接成功")
      } else {
        toast.error(`数据库连接失败: ${data.error}`)
      }
    } catch (error) {
      toast.error(`测试连接时发生错误: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Button 
      onClick={testConnection} 
      disabled={isTesting}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Database className="h-4 w-4" />
      {isTesting ? "测试连接中..." : "测试数据库连接"}
    </Button>
  )
} 