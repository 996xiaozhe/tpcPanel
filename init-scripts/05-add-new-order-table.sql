-- 设置搜索路径
SET search_path TO tpc, public;

-- 创建新订单表
CREATE TABLE IF NOT EXISTS tpcc_new_order (
    no_o_id INTEGER NOT NULL,
    no_d_id INTEGER NOT NULL,
    no_w_id INTEGER NOT NULL,
    PRIMARY KEY (no_w_id, no_d_id, no_o_id),
    FOREIGN KEY (no_w_id, no_d_id, no_o_id) REFERENCES tpcc_orders(o_w_id, o_d_id, o_id)
);

-- 创建索引
CREATE INDEX idx_tpcc_new_order ON tpcc_new_order(no_w_id, no_d_id);

-- 添加注释
COMMENT ON TABLE tpcc_new_order IS 'TPC-C 新订单表'; 