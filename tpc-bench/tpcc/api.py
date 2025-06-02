from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncpg
from .transactions import TPCCTransaction
import traceback
from fastapi.responses import JSONResponse
import asyncio
from datetime import datetime
import json

router = APIRouter()

# 数据库连接池
pool = None

# 读取数据库配置
def get_db_config():
    try:
        with open("config/database.json", "r") as f:
            config = json.load(f)
            return {
                "user": config["username"],
                "password": config["password"],
                "database": config["database"],
                "host": config["host"],
                "port": config["port"]
            }
    except:
        # 如果配置文件不存在，使用默认配置
        return {
            "user": "tpc_user",
            "password": "tpc_password",
            "database": "tpc_db",
            "host": "localhost",
            "port": 5432
        }

async def get_pool():
    global pool
    if pool is None:
        try:
            config = get_db_config()
            pool = await asyncpg.create_pool(**config)
        except Exception as e:
            print(f"数据库连接错误: {str(e)}")
            print(f"错误详情: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"数据库连接错误: {str(e)}")
    return pool

# 请求模型
class NewOrderRequest(BaseModel):
    w_id: int
    d_id: int
    c_id: int
    items: List[Dict]
    o_id: int

class PaymentRequest(BaseModel):
    w_id: int
    d_id: int
    c_id: int
    amount: float

class OrderStatusRequest(BaseModel):
    w_id: int
    d_id: int
    c_id: int

class DeliveryRequest(BaseModel):
    w_id: int
    d_id: int
    o_id: int
    carrier_id: int

class StockLevelRequest(BaseModel):
    w_id: int
    d_id: int
    threshold: int

class MaxOrderIdRequest(BaseModel):
    w_id: int
    d_id: int

# 添加并发测试请求模型
class ConcurrentTestRequest(BaseModel):
    transaction_types: List[str]  # 要测试的事务类型列表
    concurrency: int  # 并发数
    duration: int  # 测试持续时间（秒）
    params: Dict  # 测试参数

# 路由处理函数
@router.post("/new-order")
async def new_order(request: NewOrderRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.new_order(
            request.w_id,
            request.d_id,
            request.c_id,
            request.items,
            request.o_id
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/payment")
async def payment(request: PaymentRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.payment(
            request.w_id,
            request.d_id,
            request.c_id,
            request.amount
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/order-status")
async def order_status(request: OrderStatusRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.order_status(
            request.w_id,
            request.d_id,
            request.c_id
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/delivery")
async def delivery(request: DeliveryRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.delivery(
            request.w_id,
            request.d_id,
            request.o_id,
            request.carrier_id
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/stock-level")
async def stock_level(request: StockLevelRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        result = await tpcc.stock_level(
            request.w_id,
            request.d_id,
            request.threshold
        )
        return {"success": True, "data": result}
    except asyncpg.PostgresError as e:
        print(f"数据库错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"数据库错误: {str(e)}")
    except ValueError as e:
        print(f"业务逻辑错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"未知错误: {str(e)}")
        print(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@router.post("/max-order-id")
async def get_max_order_id(request: MaxOrderIdRequest):
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            # 查询当前最大订单ID
            max_order_id = await conn.fetchval("""
                SELECT COALESCE(MAX(o_id), 0)
                FROM tpcc_orders
                WHERE o_w_id = $1 AND o_d_id = $2
            """, request.w_id, request.d_id)
            
            return {
                "success": True,
                "data": {
                    "max_order_id": max_order_id
                }
            }
    except Exception as e:
        print(f"获取最大订单ID失败: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(e)}
        )

# 添加并发测试路由
@router.post("/concurrent")
async def concurrent_test(request: ConcurrentTestRequest):
    try:
        pool = await get_pool()
        tpcc = TPCCTransaction(pool)
        
        # 记录开始时间
        start_time = asyncio.get_event_loop().time()
        end_time = start_time + request.duration
        results = []
        
        # 执行并发测试
        while asyncio.get_event_loop().time() < end_time:
            tasks = []
            for i in range(request.concurrency):
                # 随机选择一个事务类型
                transaction_type = request.transaction_types[i % len(request.transaction_types)]
                
                # 根据事务类型准备参数
                if transaction_type == "NEW_ORDER":
                    # 获取最大订单ID
                    max_order_id = await pool.fetchval("""
                        SELECT COALESCE(MAX(o_id), 0)
                        FROM tpcc_orders
                        WHERE o_w_id = $1 AND o_d_id = $2
                    """, 1, 1)  # 使用默认的仓库和区域ID
                    
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "c_id": 1,
                        "o_id": max_order_id + 1,
                        "items": [{"i_id": 1, "quantity": 1}]
                    }
                elif transaction_type == "PAYMENT":
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "c_id": 1,
                        "amount": 100.0
                    }
                elif transaction_type == "ORDER_STATUS":
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "c_id": 1
                    }
                elif transaction_type == "DELIVERY":
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "o_id": 1,
                        "carrier_id": 1
                    }
                else:  # STOCK_LEVEL
                    params = {
                        "w_id": 1,
                        "d_id": 1,
                        "threshold": 10
                    }
                
                # 创建任务
                if transaction_type == "NEW_ORDER":
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.new_order(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
                elif transaction_type == "PAYMENT":
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.payment(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
                elif transaction_type == "ORDER_STATUS":
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.order_status(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
                elif transaction_type == "DELIVERY":
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.delivery(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
                else:  # STOCK_LEVEL
                    start_time = asyncio.get_event_loop().time()
                    result = await tpcc.stock_level(**params)
                    execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    results.append({
                        "transaction_type": transaction_type,
                        "success": result.get("success", True),
                        "data": result.get("data"),
                        "message": result.get("message"),
                        "executionTime": execution_time,
                        "timestamp": datetime.now().isoformat()
                    })
            
            # 短暂休眠以避免过度消耗资源
            await asyncio.sleep(0.1)
        
        # 计算统计信息
        successful_transactions = [r for r in results if r["success"]]
        failed_transactions = [r for r in results if not r["success"]]
        
        total_time = asyncio.get_event_loop().time() - start_time
        throughput = len(successful_transactions) / total_time if total_time > 0 else 0
        error_rate = len(failed_transactions) / len(results) * 100 if results else 0
        
        # 计算平均响应时间
        avg_response_time = 0
        if successful_transactions:
            total_response_time = sum(r.get("executionTime", 0) for r in successful_transactions)
            avg_response_time = total_response_time / len(successful_transactions)
        
        return {
            "success": True,
            "summary": {
                "totalTransactions": len(results),
                "successfulTransactions": len(successful_transactions),
                "failedTransactions": len(failed_transactions),
                "throughput": throughput,
                "errorRate": error_rate,
                "avgResponseTime": avg_response_time,
                "duration": total_time
            },
            "results": results
        }
        
    except Exception as e:
        print(f"并发测试执行失败: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        ) 