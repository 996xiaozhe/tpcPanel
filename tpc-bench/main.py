import os
import asyncio
import asyncpg
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import json
from datetime import datetime
from tpcc.api import router as tpcc_router

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 TPC-C 路由
app.include_router(tpcc_router, prefix="/api/tpcc", tags=["TPC-C"])

# 数据库配置
DB_URL = os.getenv("DATABASE_URL", "postgresql://tpc_user:tpc_password@localhost:5432/tpc_db")

# TPC-H 查询模板
TPC_H_QUERIES = {
    "Q1": {
        "name": "定价汇总报表查询",
        "description": "按退货标志、线路状态分组的定价汇总报表",
        "complexity": "中等",
        "estimatedTime": "2-5s",
        "parameters": [],
        "sql": """
        SELECT 
            l_returnflag,
            l_linestatus,
            SUM(l_quantity) as sum_qty,
            SUM(l_extendedprice) as sum_base_price,
            SUM(l_extendedprice * (1 - l_discount)) as sum_disc_price,
            SUM(l_extendedprice * (1 - l_discount) * (1 + l_tax)) as sum_charge,
            AVG(l_quantity) as avg_qty,
            AVG(l_extendedprice) as avg_price,
            AVG(l_discount) as avg_disc,
            COUNT(*) as count_order
        FROM tpc.lineitem
        WHERE l_shipdate <= DATE '1998-12-01' - INTERVAL '90 days'
        GROUP BY l_returnflag, l_linestatus
        ORDER BY l_returnflag, l_linestatus
        """
    },
    "Q3": {
        "name": "运输优先级查询",
        "description": "获取指定市场细分的客户在指定日期之前的订单收入",
        "complexity": "高",
        "estimatedTime": "3-8s",
        "parameters": [
            {
                "name": "segment",
                "label": "市场细分",
                "type": "select",
                "options": ["BUILDING", "AUTOMOBILE", "MACHINERY", "HOUSEHOLD", "FURNITURE"],
                "default": "BUILDING"
            }
        ],
        "sql": """
        SELECT 
            l_orderkey,
            SUM(l_extendedprice * (1 - l_discount)) as revenue,
            o_orderdate,
            o_shippriority
        FROM tpc.customer c, tpc.orders o, tpc.lineitem l
        WHERE c.c_mktsegment = $1
            AND c.c_custkey = o.o_custkey
            AND l.l_orderkey = o.o_orderkey
            AND o.o_orderdate < $2
            AND l.l_shipdate > $2
        GROUP BY l.l_orderkey, o.o_orderdate, o.o_shippriority
        ORDER BY revenue DESC, o.o_orderdate
        LIMIT 10
        """
    },
    "Q5": {
        "name": "本地供应商销量查询",
        "description": "列出指定地区在指定年份的收入",
        "complexity": "高",
        "estimatedTime": "4-10s",
        "parameters": [
            {
                "name": "region",
                "label": "地区",
                "type": "select",
                "options": ["ASIA", "AMERICA", "EUROPE", "MIDDLE EAST", "AFRICA"],
                "default": "ASIA"
            }
        ],
        "sql": """
        SELECT 
            n.n_name,
            SUM(l.l_extendedprice * (1 - l.l_discount)) as revenue
        FROM tpc.customer c, tpc.orders o, tpc.lineitem l, tpc.supplier s, tpc.nation n, tpc.region r
        WHERE c.c_custkey = o.o_custkey
            AND l.l_orderkey = o.o_orderkey
            AND l.l_suppkey = s.s_suppkey
            AND c.c_nationkey = s.s_nationkey
            AND s.s_nationkey = n.n_nationkey
            AND n.n_regionkey = r.r_regionkey
            AND r.r_name = $1
            AND o.o_orderdate >= $2
            AND o.o_orderdate < $3
        GROUP BY n.n_name
        ORDER BY revenue DESC
        """
    },
    "Q7": {
        "name": "销量查询",
        "description": "两个国家之间的贸易量",
        "complexity": "高",
        "estimatedTime": "5-12s",
        "parameters": [
            {
                "name": "nation1",
                "label": "国家1",
                "type": "input",
                "default": "FRANCE"
            },
            {
                "name": "nation2",
                "label": "国家2",
                "type": "input",
                "default": "GERMANY"
            }
        ],
        "sql": """
        SELECT 
            supp_nation,
            cust_nation,
            l_year,
            SUM(volume) as revenue
        FROM (
            SELECT 
                n1.n_name as supp_nation,
                n2.n_name as cust_nation,
                EXTRACT(YEAR FROM l.l_shipdate) as l_year,
                l.l_extendedprice * (1 - l.l_discount) as volume
            FROM tpc.supplier s, tpc.lineitem l, tpc.orders o, tpc.customer c, tpc.nation n1, tpc.nation n2
            WHERE s.s_suppkey = l.l_suppkey
                AND o.o_orderkey = l.l_orderkey
                AND c.c_custkey = o.o_custkey
                AND s.s_nationkey = n1.n_nationkey
                AND c.c_nationkey = n2.n_nationkey
                AND n1.n_name = $1
                AND n2.n_name = $2
                AND l.l_shipdate BETWEEN DATE '1995-01-01' AND DATE '1996-12-31'
        ) shipping
        GROUP BY supp_nation, cust_nation, l_year
        ORDER BY supp_nation, cust_nation, l_year
        """
    },
    "Q10": {
        "name": "退货客户查询",
        "description": "分析退货客户的损失",
        "complexity": "中等",
        "estimatedTime": "2-6s",
        "parameters": [],
        "sql": """
        SELECT 
            c.c_custkey,
            c.c_name,
            SUM(l.l_extendedprice * (1 - l.l_discount)) as revenue,
            c.c_acctbal,
            n.n_name,
            c.c_address,
            c.c_phone,
            c.c_comment
        FROM tpc.customer c, tpc.orders o, tpc.lineitem l, tpc.nation n
        WHERE c.c_custkey = o.o_custkey
            AND l.l_orderkey = o.o_orderkey
            AND o.o_orderdate >= DATE '1993-10-01'
            AND o.o_orderdate < DATE '1993-10-01' + INTERVAL '3 months'
            AND l.l_returnflag = 'R'
            AND c.c_nationkey = n.n_nationkey
        GROUP BY c.c_custkey, c.c_name, c.c_acctbal, c.c_phone, n.n_name, c.c_address, c.c_comment
        ORDER BY revenue DESC
        LIMIT 20
        """
    }
}

# 查询参数默认值
DEFAULT_PARAMS = {
    "Q3": ["BUILDING", "1995-03-15"],
    "Q5": ["ASIA", "1994-01-01", "1995-01-01"],
    "Q7": ["FRANCE", "GERMANY"]
}

async def run_query(pool, query_id: str, params: Optional[List] = None) -> Dict:
    """执行单个查询并返回结果"""
    try:
        query_info = TPC_H_QUERIES[query_id]
        sql = query_info["sql"]
        query_params = params or DEFAULT_PARAMS.get(query_id, [])

        async with pool.acquire() as conn:
            start = asyncio.get_event_loop().time()
            rows = await conn.fetch(sql, *query_params)
            elapsed = (asyncio.get_event_loop().time() - start) * 1000

            return {
                "queryId": query_id,
                "name": query_info["name"],
                "success": True,
                "rowCount": len(rows),
                "executionTime": elapsed,
                "timestamp": datetime.now().isoformat(),
                "data": [dict(row) for row in rows],
                "queryInfo": {
                    "name": query_info["name"],
                    "description": query_info["description"],
                    "complexity": query_info["complexity"],
                    "estimatedTime": query_info["estimatedTime"],
                    "sql": sql
                }
            }
    except Exception as e:
        return {
            "queryId": query_id,
            "name": TPC_H_QUERIES[query_id]["name"],
            "success": False,
            "error": str(e),
            "rowCount": 0,
            "executionTime": 0,
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/tpch/query")
async def execute_query(request: Request):
    """执行单个TPC-H查询"""
    try:
        body = await request.json()
        query_id = body.get("queryId")
        parameters = body.get("parameters", {})

        if not query_id or query_id not in TPC_H_QUERIES:
            return {
                "success": False,
                "error": "Invalid query ID"
            }

        # 创建连接池
        pool = await asyncpg.create_pool(
            dsn=DB_URL,
            min_size=1,
            max_size=1
        )

        # 准备查询参数
        query_params = []
        if query_id in DEFAULT_PARAMS:
            query_params = DEFAULT_PARAMS[query_id]
            # 替换默认参数
            for i, param in enumerate(TPC_H_QUERIES[query_id].get("parameters", [])):
                if param["name"] in parameters:
                    query_params[i] = parameters[param["name"]]

        # 执行查询
        result = await run_query(pool, query_id, query_params)
        await pool.close()

        return result

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/tpch/concurrent")
async def tpch_concurrent(request: Request):
    """并发执行TPC-H查询"""
    try:
        body = await request.json()
        query_ids: List[str] = body.get("queryIds", ["Q1"])
        concurrency: int = body.get("concurrency", 1)
        duration: int = body.get("duration", 60)  # 测试持续时间（秒）
        params: Dict = body.get("params", {})  # 查询参数

        # 创建连接池
        pool = await asyncpg.create_pool(
            dsn=DB_URL,
            min_size=1,
            max_size=concurrency
        )

        # 执行并发查询
        start_time = asyncio.get_event_loop().time()
        end_time = start_time + duration
        results = []
        
        while asyncio.get_event_loop().time() < end_time:
            tasks = []
            for i in range(concurrency):
                qid = query_ids[i % len(query_ids)]
                query_params = params.get(qid, DEFAULT_PARAMS.get(qid, []))
                tasks.append(run_query(pool, qid, query_params))
            
            batch_results = await asyncio.gather(*tasks)
            results.extend(batch_results)
            
            # 短暂休眠以避免过度消耗资源
            await asyncio.sleep(0.1)

        await pool.close()

        # 计算统计信息
        successful_queries = [r for r in results if r["success"]]
        failed_queries = [r for r in results if not r["success"]]
        
        total_time = asyncio.get_event_loop().time() - start_time
        avg_response_time = sum(r["executionTime"] for r in successful_queries) / len(successful_queries) if successful_queries else 0
        throughput = len(successful_queries) / total_time if total_time > 0 else 0
        error_rate = len(failed_queries) / len(results) * 100 if results else 0

        return {
            "success": True,
            "summary": {
                "totalQueries": len(results),
                "successfulQueries": len(successful_queries),
                "failedQueries": len(failed_queries),
                "avgResponseTime": avg_response_time,
                "throughput": throughput,
                "errorRate": error_rate,
                "duration": total_time
            },
            "results": results
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/tpch/queries")
async def get_queries():
    """获取可用的TPC-H查询列表"""
    return {
        "queries": {
            qid: {
                "name": info["name"],
                "description": info["description"],
                "complexity": info["complexity"],
                "estimatedTime": info["estimatedTime"],
                "parameters": info.get("parameters", [])
            }
            for qid, info in TPC_H_QUERIES.items()
        }
    }

@app.get("/")
async def root():
    return {"message": "TPC API Server"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 