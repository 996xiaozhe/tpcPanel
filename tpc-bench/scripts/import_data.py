import os
import asyncio
import asyncpg
from datetime import datetime

# 数据库配置
DB_URL = os.getenv("DATABASE_URL", "postgresql://tpc_user:tpc_password@localhost:5432/tpc_db")

async def import_data():
    """导入TPC-H测试数据"""
    try:
        # 连接数据库
        conn = await asyncpg.connect(DB_URL)
        
        # 开始导入
        print("开始导入数据...")
        start_time = datetime.now()
        
        # 导入nation表
        print("导入nation表...")
        with open('TPC-H V3.0.1/ref_data/nation.tbl', 'r') as f:
            await conn.copy_to_table('tpc.nation', source=f, format='csv', delimiter='|')
        
        # 导入region表
        print("导入region表...")
        with open('TPC-H V3.0.1/ref_data/region.tbl', 'r') as f:
            await conn.copy_to_table('tpc.region', source=f, format='csv', delimiter='|')
        
        # 导入customer表
        print("导入customer表...")
        with open('TPC-H V3.0.1/dbgen/customer.tbl', 'r') as f:
            await conn.copy_to_table('tpc.customer', source=f, format='csv', delimiter='|')
        
        # 导入orders表
        print("导入orders表...")
        with open('TPC-H V3.0.1/dbgen/orders.tbl', 'r') as f:
            await conn.copy_to_table('tpc.orders', source=f, format='csv', delimiter='|')
        
        # 导入lineitem表
        print("导入lineitem表...")
        with open('TPC-H V3.0.1/dbgen/lineitem.tbl', 'r') as f:
            await conn.copy_to_table('tpc.lineitem', source=f, format='csv', delimiter='|')
        
        # 导入part表
        print("导入part表...")
        with open('TPC-H V3.0.1/dbgen/part.tbl', 'r') as f:
            await conn.copy_to_table('tpc.part', source=f, format='csv', delimiter='|')
        
        # 导入supplier表
        print("导入supplier表...")
        with open('TPC-H V3.0.1/dbgen/supplier.tbl', 'r') as f:
            await conn.copy_to_table('tpc.supplier', source=f, format='csv', delimiter='|')
        
        # 导入partsupp表
        print("导入partsupp表...")
        with open('TPC-H V3.0.1/dbgen/partsupp.tbl', 'r') as f:
            await conn.copy_to_table('tpc.partsupp', source=f, format='csv', delimiter='|')
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"数据导入完成！耗时: {duration:.2f} 秒")
        
        # 验证数据
        print("\n验证数据...")
        tables = ['nation', 'region', 'customer', 'orders', 'lineitem', 'part', 'supplier', 'partsupp']
        for table in tables:
            count = await conn.fetchval(f'SELECT COUNT(*) FROM tpc.{table}')
            print(f"{table}表: {count} 条记录")
        
    except Exception as e:
        print(f"导入过程中出错: {str(e)}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(import_data()) 