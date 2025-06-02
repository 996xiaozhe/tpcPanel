-- 创建系统用户表（如果不存在）
CREATE TABLE IF NOT EXISTS system_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建初始管理员账号（密码为 admin123）
-- 使用 bcrypt 加密的密码
INSERT INTO system_users (username, password, role, status)
VALUES (
    'admin',
    '$2b$10$BEJNn0lezOr9adnvFDvOyOel6fTpIuwbZVzkBC/rt9644SABG5OP2',
    'admin',
    'active'
) ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password; 