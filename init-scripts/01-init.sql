-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建模式
CREATE SCHEMA IF NOT EXISTS tpc;

-- 设置搜索路径
ALTER DATABASE tpc_db SET search_path TO tpc, public;

-- 为当前会话设置搜索路径
SET search_path TO tpc, public;

-- 创建表空间（如果需要）
-- CREATE TABLESPACE tpc_tablespace LOCATION '/var/lib/postgresql/data/tpc_tablespace';

-- 设置默认表空间（如果需要）
-- SET default_tablespace = tpc_tablespace;

-- 创建用户和权限
-- CREATE USER tpc_app WITH PASSWORD 'tpc_app_password';
-- GRANT ALL PRIVILEGES ON DATABASE tpc_db TO tpc_app;
-- GRANT ALL PRIVILEGES ON SCHEMA tpc TO tpc_app; 