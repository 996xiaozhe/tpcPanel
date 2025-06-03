-- 禁用客户表触发器
ALTER TABLE customer DISABLE TRIGGER trg_log_customer_import;
ALTER TABLE customer DISABLE TRIGGER trg_validate_customer;

-- 禁用订单表触发器
ALTER TABLE orders DISABLE TRIGGER trg_log_orders_import;
ALTER TABLE orders DISABLE TRIGGER trg_validate_orders;

-- 禁用订单明细表触发器
ALTER TABLE lineitem DISABLE TRIGGER trg_log_lineitem_import;
ALTER TABLE lineitem DISABLE TRIGGER trg_validate_lineitem;

-- 禁用零件表触发器
ALTER TABLE part DISABLE TRIGGER trg_log_part_import;
ALTER TABLE part DISABLE TRIGGER trg_validate_part;

-- 禁用供应商表触发器
ALTER TABLE supplier DISABLE TRIGGER trg_log_supplier_import;
ALTER TABLE supplier DISABLE TRIGGER trg_validate_supplier;