"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Database, Save, Wifi } from "lucide-react"
import Link from "next/link"

interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
}

export default function DatabaseConfigPage() {
  const [config, setConfig] = useState<DatabaseConfig>({
    host: "localhost",
    port: 5432,
    database: "tpc_db",
    username: "tpc_user",
    password: "tpc_password"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  useEffect(() => {
    // 获取当前数据库配置
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/database/config")
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error("获取数据库配置失败:", error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/database/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "数据库配置已保存" })
      } else {
        setMessage({ type: "error", text: data.error || "保存失败" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "保存失败，请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/database/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "数据库连接测试成功" })
      } else {
        setMessage({ type: "error", text: data.error || "连接测试失败" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "连接测试失败，请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回仪表板
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">数据库配置</h1>
          <p className="text-gray-600 mt-2">配置TPC数据库连接参数</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              数据库连接参数
            </CardTitle>
            <CardDescription>
              配置数据库连接信息，修改后需要重启服务才能生效
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert className={`mb-4 ${message.type === "success" ? "bg-green-50" : "bg-red-50"}`}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">主机地址</Label>
                  <Input
                    id="host"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">端口</Label>
                  <Input
                    id="port"
                    type="number"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                    placeholder="5432"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="database">数据库名</Label>
                <Input
                  id="database"
                  value={config.database}
                  onChange={(e) => setConfig({ ...config, database: e.target.value })}
                  placeholder="tpc_db"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  placeholder="tpc_user"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="tpc_password"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isLoading}
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  测试连接
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  保存配置
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 