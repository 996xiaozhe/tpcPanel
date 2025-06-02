import os
import asyncio
import asyncpg
from datetime import datetime

# 数据库配置
DB_URL = os.getenv("DATABASE_URL", "postgresql://tpc_user:tpc_password@localhost:5432/tpc_db")

async def truncate_tables():
    """清空TPC-H表"""
    try:
        # 连接数据库
        conn = await asyncpg.connect(DB_URL)
        
        print("开始清空表...")
        start_time = datetime.now()
        
        # 读取并执行SQL文件
        with open('scripts/truncate_tables.sql', 'r') as f:
            sql = f.read()
            await conn.execute(sql)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"表清空完成！耗时: {duration:.2f} 秒")
        
        # 验证表是否已清空
        tables = ['nation', 'region', 'customer', 'orders', 'lineitem', 'part', 'supplier', 'partsupp']
        for table in tables:
            count = await conn.fetchval(f'SELECT COUNT(*) FROM tpc.{table}')
            print(f"{table}表: {count} 条记录")
        
    except Exception as e:
        print(f"清空表过程中出错: {str(e)}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(truncate_tables()) 