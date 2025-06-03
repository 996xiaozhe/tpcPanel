-- 启用客户表触发器
ALTER TABLE customer ENABLE TRIGGER trg_log_customer_import;
ALTER TABLE customer ENABLE TRIGGER trg_validate_customer;

-- 启用订单表触发器
ALTER TABLE orders ENABLE TRIGGER trg_log_orders_import;
ALTER TABLE orders ENABLE TRIGGER trg_validate_orders;

-- 启用订单明细表触发器
ALTER TABLE lineitem ENABLE TRIGGER trg_log_lineitem_import;
ALTER TABLE lineitem ENABLE TRIGGER trg_validate_lineitem;

-- 启用零件表触发器
ALTER TABLE part ENABLE TRIGGER trg_log_part_import;
ALTER TABLE part ENABLE TRIGGER trg_validate_part;

-- 启用供应商表触发器
ALTER TABLE supplier ENABLE TRIGGER trg_log_supplier_import;
ALTER TABLE supplier ENABLE TRIGGER trg_validate_supplier;