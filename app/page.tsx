import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Search, BarChart3, Zap, Users, Package, Upload, LayoutDashboard, FileText, Download } from "lucide-react"

export default function HomePage() {
  const modules = [
    {
      title: "客户信息查询",
      description: "支持输入框和下拉列表查询客户信息",
      icon: <Users className="h-8 w-8" />,
      href: "/customer-query",
      color: "bg-blue-500",
    },
    {
      title: "订单零部件查询",
      description: "查询订单和零部件信息，支持图表展示",
      icon: <Package className="h-8 w-8" />,
      href: "/order-part-query",
      color: "bg-green-500",
    },
    {
      title: "TPC-H统计分析",
      description: "复杂SQL查询和统计分析，性能监控",
      icon: <BarChart3 className="h-8 w-8" />,
      href: "/tpc-h-analysis",
      color: "bg-purple-500",
    },
    {
      title: "TPC-C事务查询",
      description: "事务处理和数据库操作",
      icon: <Database className="h-8 w-8" />,
      href: "/tpc-c-transaction",
      color: "bg-orange-500",
    },
    {
      title: "TPC-H并发测试",
      description: "并发查询性能测试",
      icon: <Zap className="h-8 w-8" />,
      href: "/tpc-h-concurrent",
      color: "bg-red-500",
    },
    {
      title: "TPC-C并发事务测试",
      description: "并发事务性能测试",
      icon: <Search className="h-8 w-8" />,
      href: "/tpc-c-concurrent",
      color: "bg-indigo-500",
    },
    {
      title: "数据导入",
      description: "支持TXT文件上传导入并进行数据清洗",
      icon: <Upload className="h-8 w-8" />,
      href: "/data-import",
      color: "bg-teal-500",
    },
    {
      title: "数据导出",
      description: "支持多表导出，可选择CSV或TXT格式",
      icon: <Download className="h-8 w-8" />,
      href: "/data-export",
      color: "bg-cyan-500",
    },
    {
      title: "仪表板",
      description: "查看系统概览和管理员功能",
      icon: <LayoutDashboard className="h-8 w-8" />,
      href: "/dashboard",
      color: "bg-yellow-500",
    },
    {
      title: "API文档",
      description: "查看API接口文档和测试",
      icon: <FileText className="h-8 w-8" />,
      href: "http://localhost:8000/docs",
      color: "bg-pink-500",
      external: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">TPC-H Benchmark 电商数据管理系统</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            完整的数据库基准测试系统，支持复杂查询、事务处理、性能分析和并发测试
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div
                  className={`w-16 h-16 ${module.color} rounded-lg flex items-center justify-center text-white mb-4`}
                >
                  {module.icon}
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <CardDescription className="text-gray-600">{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {module.external ? (
                  <a href={module.href} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full">查看文档</Button>
                  </a>
                ) : (
                  <Link href={module.href}>
                    <Button className="w-full">进入模块</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">系统特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">多表查询</h3>
              <p className="text-sm text-gray-600">支持复杂的多表关联查询</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">图表展示</h3>
              <p className="text-sm text-gray-600">直观的数据可视化</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">性能监控</h3>
              <p className="text-sm text-gray-600">实时查询性能分析</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">数据导入</h3>
              <p className="text-sm text-gray-600">支持文件导入和数据清洗</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
