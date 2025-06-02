import asyncio
import random
from datetime import datetime, timedelta
import asyncpg
from typing import List, Dict

class TPCCDataGenerator:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def generate_warehouse(self, w_id: int) -> None:
        """生成仓库数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_warehouse (w_id, w_name, w_street_1, w_street_2, w_city, w_state, w_zip, w_tax, w_ytd)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """,
            w_id,
            f"WAREHOUSE{w_id}",
            f"Street {w_id}",
            None,
            f"City {w_id}",
            "ST",
            f"{w_id:05d}",
            random.uniform(0.1, 0.2),
            300000.00
        )

    async def generate_district(self, w_id: int, d_id: int) -> None:
        """生成地区数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_district (d_id, d_w_id, d_name, d_street_1, d_street_2, d_city, d_state, d_zip, d_tax, d_ytd, d_next_o_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """,
            d_id,
            w_id,
            f"DISTRICT{d_id}",
            f"Street {d_id}",
            None,
            f"City {d_id}",
            "ST",
            f"{d_id:05d}",
            random.uniform(0.1, 0.2),
            30000.00,
            3001
        )

    async def generate_customer(self, w_id: int, d_id: int, c_id: int) -> None:
        """生成客户数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_customer (c_id, c_d_id, c_w_id, c_first, c_middle, c_last, c_street_1, c_street_2, c_city, c_state, c_zip, c_phone, c_since, c_credit, c_credit_lim, c_discount, c_balance, c_ytd_payment, c_payment_cnt, c_delivery_cnt, c_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            """,
            c_id,
            d_id,
            w_id,
            f"First{c_id}",
            "OE",
            f"Last{c_id}",
            f"Street {c_id}",
            None,
            f"City {c_id}",
            "ST",
            f"{c_id:05d}",
            f"{c_id:010d}",
            datetime.now(),
            "GC",
            50000.00,
            random.uniform(0.0, 0.5),
            0.00,
            0.00,
            0,
            0,
            f"Customer data for {c_id}"
        )

    async def generate_item(self, i_id: int) -> None:
        """生成商品数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_item (i_id, i_im_id, i_name, i_price, i_data)
            VALUES ($1, $2, $3, $4, $5)
            """,
            i_id,
            random.randint(1, 10000),
            f"Item {i_id}",
            random.uniform(1.00, 100.00),
            f"Item data for {i_id}"
        )

    async def generate_stock(self, w_id: int, i_id: int) -> None:
        """生成库存数据"""
        await self.pool.execute(
            """
            INSERT INTO tpcc_stock (s_i_id, s_w_id, s_quantity, s_dist_01, s_dist_02, s_dist_03, s_dist_04, s_dist_05, s_dist_06, s_dist_07, s_dist_08, s_dist_09, s_dist_10, s_ytd, s_order_cnt, s_remote_cnt, s_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            """,
            i_id,
            w_id,
            random.randint(10, 100),
            f"Dist {w_id}-1",
            f"Dist {w_id}-2",
            f"Dist {w_id}-3",
            f"Dist {w_id}-4",
            f"Dist {w_id}-5",
            f"Dist {w_id}-6",
            f"Dist {w_id}-7",
            f"Dist {w_id}-8",
            f"Dist {w_id}-9",
            f"Dist {w_id}-10",
            0,
            0,
            0,
            f"Stock data for {w_id}-{i_id}"
        )

    async def generate_data(self, num_warehouses: int = 1) -> None:
        """生成完整的 TPC-C 测试数据"""
        # 生成仓库
        for w_id in range(1, num_warehouses + 1):
            await self.generate_warehouse(w_id)
            
            # 生成地区
            for d_id in range(1, 11):
                await self.generate_district(w_id, d_id)
                
                # 生成客户
                for c_id in range(1, 3001):
                    await self.generate_customer(w_id, d_id, c_id)

        # 生成商品
        for i_id in range(1, 100001):
            await self.generate_item(i_id)
            
            # 生成库存
            for w_id in range(1, num_warehouses + 1):
                await self.generate_stock(w_id, i_id)

async def main():
    # 创建数据库连接池
    pool = await asyncpg.create_pool(
        user="tpc_user",
        password="tpc_password",
        database="tpc_db",
        host="localhost",
        port=5432
    )

    # 创建数据生成器
    generator = TPCCDataGenerator(pool)

    # 生成数据
    print("开始生成 TPC-C 测试数据...")
    await generator.generate_data(num_warehouses=1)
    print("数据生成完成！")

    # 关闭连接池
    await pool.close()

if __name__ == "__main__":
    asyncio.run(main()) 