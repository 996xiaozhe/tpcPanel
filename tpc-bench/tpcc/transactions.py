import asyncio
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import asyncpg
import traceback

class TPCCTransaction:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def new_order(
        self,
        w_id: int,
        d_id: int,
        c_id: int,
        items: List[Dict],
        o_id: int  # 添加订单ID参数
    ):
        """新订单事务"""
        try:
            async with self.pool.acquire() as conn:
                # 检查客户是否存在
                customer = await conn.fetchrow("""
                    SELECT c_id, c_first, c_middle, c_last, c_balance
                    FROM tpcc_customer
                    WHERE c_w_id = $1 AND c_d_id = $2 AND c_id = $3
                """, w_id, d_id, c_id)

                if not customer:
                    raise ValueError(f"客户不存在: 仓库ID={w_id}, 区域ID={d_id}, 客户ID={c_id}")

                # 创建订单
                await conn.execute("""
                    INSERT INTO tpcc_orders (
                        o_w_id, o_d_id, o_id, o_c_id, o_carrier_id,
                        o_ol_cnt, o_all_local, o_entry_d
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                """, w_id, d_id, o_id, c_id, None, len(items), 1)

                # 创建订单项
                total_amount = 0
                for i, item in enumerate(items, 1):
                    # 获取商品价格
                    item_info = await conn.fetchrow("""
                        SELECT i_price
                        FROM tpcc_item
                        WHERE i_id = $1
                    """, item['i_id'])

                    if not item_info:
                        raise ValueError(f"商品不存在: ID={item['i_id']}")

                    # 计算订单项金额
                    amount = item_info['i_price'] * item['quantity']
                    total_amount += amount

                    await conn.execute("""
                        INSERT INTO tpcc_order_line (
                            ol_w_id, ol_d_id, ol_o_id, ol_number,
                            ol_i_id, ol_supply_w_id, ol_quantity,
                            ol_amount, ol_dist_info
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    """, w_id, d_id, o_id, i, item['i_id'], w_id, item['quantity'],
                        amount, f"DIST_{d_id}")

                return {
                    "order_id": o_id,
                    "customer_id": c_id,
                    "customer_name": f"{customer['c_first']} {customer['c_middle']} {customer['c_last']}",
                    "warehouse_id": w_id,
                    "district_id": d_id,
                    "items": items,
                    "total_amount": total_amount
                }

        except Exception as e:
            print(f"新订单事务执行失败: {str(e)}")
            print(traceback.format_exc())
            raise

    async def payment(self, w_id: int, d_id: int, c_id: int, amount: float) -> Dict:
        """付款事务"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.transaction():
                    # 1. 获取客户信息
                    customer = await conn.fetchrow(
                        "SELECT c_balance, c_ytd_payment, c_payment_cnt, c_credit, c_data FROM tpcc_customer WHERE c_w_id = $1 AND c_d_id = $2 AND c_id = $3",
                        w_id, d_id, c_id
                    )
                    if not customer:
                        return {
                            "success": False,
                            "message": f"客户不存在: w_id={w_id}, d_id={d_id}, c_id={c_id}",
                            "data": None
                        }

                    # 2. 更新客户余额
                    new_balance = float(customer['c_balance']) - float(amount)
                    new_ytd_payment = float(customer['c_ytd_payment']) + float(amount)
                    new_payment_cnt = customer['c_payment_cnt'] + 1

                    await conn.execute(
                        """
                        UPDATE tpcc_customer 
                        SET c_balance = $1, c_ytd_payment = $2, c_payment_cnt = $3
                        WHERE c_w_id = $4 AND c_d_id = $5 AND c_id = $6
                        """,
                        new_balance, new_ytd_payment, new_payment_cnt, w_id, d_id, c_id
                    )

                    # 3. 更新仓库和地区余额
                    await conn.execute(
                        "UPDATE tpcc_warehouse SET w_ytd = w_ytd + $1 WHERE w_id = $2",
                        float(amount), w_id
                    )
                    await conn.execute(
                        "UPDATE tpcc_district SET d_ytd = d_ytd + $1 WHERE d_w_id = $2 AND d_id = $3",
                        float(amount), w_id, d_id
                    )

                    # 4. 记录历史
                    current_time = datetime.now()
                    history_data = f"Payment {current_time.strftime('%Y%m%d%H%M%S')}"
                    await conn.execute(
                        """
                        INSERT INTO tpcc_history (h_c_id, h_c_d_id, h_c_w_id, h_d_id, h_w_id, h_date, h_amount, h_data)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        """,
                        c_id, d_id, w_id, d_id, w_id, current_time, float(amount), history_data[:24]
                    )

                    return {
                        "success": True,
                        "data": {
                            'customer': {
                                'id': c_id,
                                'balance': new_balance,
                                'ytd_payment': new_ytd_payment,
                                'payment_cnt': new_payment_cnt
                            },
                            'amount': float(amount)
                        }
                    }
        except Exception as e:
            print(f"支付事务执行失败: {str(e)}")
            print(traceback.format_exc())
            return {
                "success": False,
                "message": f"支付事务执行失败: {str(e)}",
                "data": None
            }

    async def order_status(self, w_id: int, d_id: int, c_id: int) -> Dict:
        """订单状态查询事务"""
        try:
            async with self.pool.acquire() as conn:
                # 1. 获取客户信息
                print(f"正在查询客户信息: w_id={w_id}, d_id={d_id}, c_id={c_id}")
                customer = await conn.fetchrow(
                    "SELECT c_balance, c_first, c_middle, c_last FROM tpcc_customer WHERE c_w_id = $1 AND c_d_id = $2 AND c_id = $3",
                    w_id, d_id, c_id
                )
                if not customer:
                    print(f"客户不存在: w_id={w_id}, d_id={d_id}, c_id={c_id}")
                    raise ValueError(f"Customer not found: w_id={w_id}, d_id={d_id}, c_id={c_id}")

                # 2. 获取最近订单（修改为获取最近10个订单）
                print(f"正在查询最近订单: w_id={w_id}, d_id={d_id}, c_id={c_id}")
                orders = await conn.fetch(
                    """
                    SELECT o_id, o_entry_d, o_carrier_id
                    FROM tpcc_orders
                    WHERE o_w_id = $1 AND o_d_id = $2 AND o_c_id = $3
                    ORDER BY o_id DESC
                    LIMIT 10
                    """,
                    w_id, d_id, c_id
                )

                if not orders:
                    print(f"客户没有订单记录: w_id={w_id}, d_id={d_id}, c_id={c_id}")
                    return {
                        'customer': {
                            'id': c_id,
                            'name': f"{customer['c_first']} {customer['c_middle']} {customer['c_last']}",
                            'balance': customer['c_balance']
                        },
                        'orders': []
                    }

                # 3. 获取所有订单的订单项
                order_results = []
                for order in orders:
                    print(f"正在查询订单项: w_id={w_id}, d_id={d_id}, o_id={order['o_id']}")
                    order_lines = await conn.fetch(
                        """
                        SELECT ol_number, ol_i_id, ol_supply_w_id, ol_quantity, ol_amount, ol_delivery_d
                        FROM tpcc_order_line
                        WHERE ol_w_id = $1 AND ol_d_id = $2 AND ol_o_id = $3
                        ORDER BY ol_number
                        """,
                        w_id, d_id, order['o_id']
                    )

                    order_results.append({
                        'order_id': order['o_id'],
                        'entry_date': order['o_entry_d'],
                        'carrier_id': order['o_carrier_id'],
                        'items': [{
                            'number': ol['ol_number'],
                            'item_id': ol['ol_i_id'],
                            'supply_w_id': ol['ol_supply_w_id'],
                            'quantity': ol['ol_quantity'],
                            'amount': ol['ol_amount'],
                            'delivery_date': ol['ol_delivery_d']
                        } for ol in order_lines]
                    })

                return {
                    'customer': {
                        'id': c_id,
                        'name': f"{customer['c_first']} {customer['c_middle']} {customer['c_last']}",
                        'balance': customer['c_balance']
                    },
                    'orders': order_results
                }
        except asyncpg.PostgresError as e:
            print(f"数据库错误: {str(e)}")
            print(f"错误详情: {traceback.format_exc()}")
            raise ValueError(f"数据库错误: {str(e)}")
        except Exception as e:
            print(f"未知错误: {str(e)}")
            print(f"错误详情: {traceback.format_exc()}")
            raise ValueError(f"未知错误: {str(e)}")

    async def delivery(self, w_id: int, d_id: int, o_id: int, carrier_id: int) -> Dict:
        """配送事务"""
        try:
            async with self.pool.acquire() as conn:
                async with conn.transaction():
                    # 1. 检查订单是否存在且未发货
                    order = await conn.fetchrow(
                        """
                        SELECT o_id, o_c_id
                        FROM tpcc_orders
                        WHERE o_w_id = $1 AND o_d_id = $2 AND o_id = $3 AND o_carrier_id IS NULL
                        """,
                        w_id, d_id, o_id
                    )

                    if not order:
                        return {
                            "success": False,
                            "message": f"订单不存在或已发货: 仓库ID={w_id}, 区域ID={d_id}, 订单ID={o_id}",
                            "data": None
                        }

                    # 2. 更新订单配送信息
                    await conn.execute(
                        """
                        UPDATE tpcc_orders
                        SET o_carrier_id = $1
                        WHERE o_w_id = $2 AND o_d_id = $3 AND o_id = $4
                        """,
                        carrier_id, w_id, d_id, o_id
                    )

                    # 3. 更新订单项配送信息
                    await conn.execute(
                        """
                        UPDATE tpcc_order_line
                        SET ol_delivery_d = $1
                        WHERE ol_w_id = $2 AND ol_d_id = $3 AND ol_o_id = $4
                        """,
                        datetime.now(), w_id, d_id, o_id
                    )

                    # 4. 更新客户配送计数
                    await conn.execute(
                        """
                        UPDATE tpcc_customer
                        SET c_delivery_cnt = c_delivery_cnt + 1
                        WHERE c_w_id = $1 AND c_d_id = $2 AND c_id = $3
                        """,
                        w_id, d_id, order['o_c_id']
                    )

                    return {
                        "success": True,
                        "data": {
                            'warehouse_id': w_id,
                            'district_id': d_id,
                            'order_id': o_id,
                            'carrier_id': carrier_id,
                            'customer_id': order['o_c_id'],
                            'delivery_date': datetime.now()
                        }
                    }
        except Exception as e:
            print(f"发货事务执行失败: {str(e)}")
            print(traceback.format_exc())
            return {
                "success": False,
                "message": f"发货事务执行失败: {str(e)}",
                "data": None
            }

    async def stock_level(self, w_id: int, d_id: int, threshold: int) -> Dict:
        """库存水平查询事务"""
        async with self.pool.acquire() as conn:
            # 1. 获取最近订单
            recent_orders = await conn.fetch(
                """
                SELECT o_id
                FROM tpcc_orders
                WHERE o_w_id = $1 AND o_d_id = $2
                ORDER BY o_id DESC
                LIMIT 20
                """,
                w_id, d_id
            )

            if not recent_orders:
                return {
                    'warehouse_id': w_id,
                    'district_id': d_id,
                    'threshold': threshold,
                    'low_stock_count': 0,
                    'items': []
                }

            # 2. 获取所有商品的库存信息
            stock_info = await conn.fetch(
                """
                SELECT 
                    s.s_i_id as item_id,
                    i.i_name as item_name,
                    s.s_quantity as quantity,
                    s.s_ytd as ytd,
                    s.s_order_cnt as order_count,
                    s.s_remote_cnt as remote_count,
                    CASE WHEN s.s_quantity < $3 THEN true ELSE false END as is_low_stock
                FROM tpcc_stock s
                JOIN tpcc_item i ON s.s_i_id = i.i_id
                WHERE s.s_w_id = $1
                AND s.s_i_id IN (
                    SELECT DISTINCT ol.ol_i_id
                    FROM tpcc_order_line ol
                    WHERE ol.ol_w_id = $1
                    AND ol.ol_d_id = $2
                    AND ol.ol_o_id IN (
                        SELECT o_id 
                        FROM tpcc_orders 
                        WHERE o_w_id = $1 
                        AND o_d_id = $2 
                        ORDER BY o_id DESC 
                        LIMIT 20
                    )
                )
                ORDER BY s.s_i_id
                """,
                w_id, d_id, threshold
            )

            # 3. 统计低于阈值的商品数量
            low_stock_count = sum(1 for item in stock_info if item['is_low_stock'])

            return {
                'warehouse_id': w_id,
                'district_id': d_id,
                'threshold': threshold,
                'low_stock_count': low_stock_count,
                'items': [{
                    'item_id': item['item_id'],
                    'item_name': item['item_name'],
                    'quantity': item['quantity'],
                    'ytd': item['ytd'],
                    'order_count': item['order_count'],
                    'remote_count': item['remote_count'],
                    'is_low_stock': item['is_low_stock']
                } for item in stock_info]
            } 