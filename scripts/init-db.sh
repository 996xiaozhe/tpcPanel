#!/bin/bash

# 检查 PostgreSQL 是否已安装
if ! command -v psql &> /dev/null; then
    echo "错误: PostgreSQL 未安装"
    exit 1
fi

# 检查是否以 postgres 用户运行
if [ "$(whoami)" != "postgres" ]; then
    echo "请以 postgres 用户运行此脚本"
    echo "使用: sudo -u postgres ./scripts/init-db.sh"
    exit 1
fi

# 执行数据库初始化脚本
echo "正在初始化数据库..."
psql -f init-scripts/00-init-db.sql

# 执行管理员账号初始化脚本
echo "正在创建管理员账号..."
psql -d tpc_db -f init-scripts/01-init-admin.sql

echo "数据库初始化完成！"
echo "数据库名: tpc_db"
echo "用户名: tpc_user"
echo "密码: tpc_password"
echo "管理员账号:"
echo "用户名: admin"
echo "密码: admin123" 