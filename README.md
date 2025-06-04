# TPC Panel

TPC Panel 是一个基于 Next.js 开发的现代化数据库性能测试和监控平台，专注于 TPC 基准测试的展示和管理。

## 功能特性

- 📊 数据库性能测试结果可视化
- 🔍 TPC 基准测试数据管理
- 📈 性能指标实时监控
- 🔐 用户认证和授权
- 🎨 现代化的用户界面
- 📱 响应式设计

## 技术栈

- **前端框架**: Next.js 15
- **UI 组件**: 
  - Tailwind CSS
- **数据库**: PostgreSQL 16
- **认证**: JWT + bcrypt
- **图表**: Recharts
- **开发语言**: TypeScript
- **后端 API**: FastAPI (Python)

## 系统要求

- Node.js 18+
- PostgreSQL 16+
- Python 3.8+
- pnpm 包管理器

## 快速开始

1. 克隆项目
```bash
git clone [项目地址]
cd tpcPanel
```

2. 安装依赖
```bash
# 安装前端依赖
pnpm install

# 安装后端依赖
cd tpc-bench
pip install -r requirements.txt
```

3. 启动 PostgreSQL 数据库
```bash
docker-compose up -d
```

4. 启动后端服务
```bash
cd tpc-bench
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

5. 启动前端开发服务器
```bash
pnpm run dev
```

6. 访问应用
打开浏览器访问 http://localhost:3000

## API 文档

### TPC-H 基准测试 API

#### 1. 获取可用查询列表
```http
GET /api/tpch/queries
```
返回所有可用的 TPC-H 查询列表，包含查询名称、描述、复杂度等信息。

#### 2. 执行单个查询
```http
POST /api/tpch/query
Content-Type: application/json

{
    "queryId": "Q1",
    "params": []  // 可选参数
}
```
执行指定的 TPC-H 查询并返回结果。

#### 3. 并发执行查询
```http
POST /api/tpch/concurrent
Content-Type: application/json

{
    "queries": [
        {"queryId": "Q1", "params": []},
        {"queryId": "Q3", "params": ["BUILDING"]}
    ]
}
```
并发执行多个 TPC-H 查询并返回结果。

### TPC-C 基准测试 API

TPC-C 相关的 API 路由以 `/api/tpcc` 为前缀，提供以下功能：
- 数据库初始化
- 数据加载
- 性能测试执行
- 结果统计

## 项目结构

```
tpcPanel/
├── app/                # Next.js 应用主目录
├── components/         # React 组件
├── lib/               # 工具函数和库
├── public/            # 静态资源
├── styles/            # 全局样式
├── hooks/             # 自定义 React Hooks
├── config/            # 配置文件
├── docs/              # 项目文档
├── scripts/           # 脚本文件
└── tpc-bench/         # TPC 基准测试后端
    ├── main.py        # FastAPI 主程序
    ├── tpcc/          # TPC-C 测试实现
    ├── queries/       # TPC-H 查询模板
    └── scripts/       # 辅助脚本
```

## 环境变量

创建 `.env.local` 文件并配置以下环境变量：

```env
DATABASE_URL=postgresql://tpc_user:tpc_password@localhost:5432/tpc_db
JWT_SECRET=your_jwt_secret
```

## 开发

- `pnpm dev` - 启动前端开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm lint` - 运行代码检查

## 贡献

欢迎提交 Pull Requests 和 Issues。

## 许可证

MIT