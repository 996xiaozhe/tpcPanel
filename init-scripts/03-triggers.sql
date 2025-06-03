-- 设置搜索路径
SET search_path TO tpc, public;

-- 创建导入日志表
CREATE TABLE IF NOT EXISTS import_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    record_count INTEGER NOT NULL,
    import_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    error_message TEXT
);

-- 创建数据验证日志表
CREATE TABLE IF NOT EXISTS validation_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    validation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 为每个表创建导入触发器函数
CREATE OR REPLACE FUNCTION log_import_operation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO import_logs (table_name, operation, record_count, status)
    VALUES (TG_TABLE_NAME, TG_OP, 1, 'SUCCESS');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为每个表创建验证触发器函数
CREATE OR REPLACE FUNCTION validate_record()
RETURNS TRIGGER AS $$
DECLARE
    error_msg TEXT;
BEGIN
    -- 根据表名执行不同的验证
    CASE TG_TABLE_NAME
        WHEN 'customer' THEN
            -- 验证客户数据
            IF NEW.c_acctbal < 0 THEN
                error_msg := '账户余额不能为负数';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.c_custkey, 'c_acctbal', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
            
        WHEN 'orders' THEN
            -- 验证订单数据
            IF NEW.o_totalprice <= 0 THEN
                error_msg := '订单总价必须大于0';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.o_orderkey, 'o_totalprice', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
            
        WHEN 'lineitem' THEN
            -- 验证订单明细数据
            IF NEW.l_quantity <= 0 THEN
                error_msg := '商品数量必须大于0';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.l_orderkey, 'l_quantity', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
            
        WHEN 'part' THEN
            -- 验证零件数据
            IF NEW.p_retailprice <= 0 THEN
                error_msg := '零售价必须大于0';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.p_partkey, 'p_retailprice', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
            
        WHEN 'supplier' THEN
            -- 验证供应商数据
            IF NEW.s_acctbal < 0 THEN
                error_msg := '账户余额不能为负数';
                INSERT INTO validation_logs (table_name, record_id, field_name, error_message)
                VALUES (TG_TABLE_NAME, NEW.s_suppkey, 's_acctbal', error_msg);
                RAISE EXCEPTION '%', error_msg;
            END IF;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为每个表创建触发器
CREATE TRIGGER trg_log_customer_import
    AFTER INSERT ON customer
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_customer
    BEFORE INSERT OR UPDATE ON customer
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

CREATE TRIGGER trg_log_orders_import
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_orders
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

CREATE TRIGGER trg_log_lineitem_import
    AFTER INSERT ON lineitem
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_lineitem
    BEFORE INSERT OR UPDATE ON lineitem
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

CREATE TRIGGER trg_log_part_import
    AFTER INSERT ON part
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_part
    BEFORE INSERT OR UPDATE ON part
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

CREATE TRIGGER trg_log_supplier_import
    AFTER INSERT ON supplier
    FOR EACH ROW
    EXECUTE FUNCTION log_import_operation();

CREATE TRIGGER trg_validate_supplier
    BEFORE INSERT OR UPDATE ON supplier
    FOR EACH ROW
    EXECUTE FUNCTION validate_record();

-- 添加注释
COMMENT ON TABLE import_logs IS '数据导入日志表';
COMMENT ON TABLE validation_logs IS '数据验证日志表';
COMMENT ON FUNCTION log_import_operation() IS '记录数据导入操作';
COMMENT ON FUNCTION validate_record() IS '验证数据记录'; 