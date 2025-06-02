-- 设置搜索路径
SET search_path TO tpc, public;

-- 创建NATION表
CREATE TABLE IF NOT EXISTS nation (
    n_nationkey INTEGER PRIMARY KEY,
    n_name CHAR(25) NOT NULL,
    n_regionkey INTEGER NOT NULL,
    n_comment VARCHAR(152)
);

-- 创建REGION表
CREATE TABLE IF NOT EXISTS region (
    r_regionkey INTEGER PRIMARY KEY,
    r_name CHAR(25) NOT NULL,
    r_comment VARCHAR(152)
);

-- 创建PART表
CREATE TABLE IF NOT EXISTS part (
    p_partkey INTEGER PRIMARY KEY,
    p_name VARCHAR(55) NOT NULL,
    p_mfgr CHAR(25) NOT NULL,
    p_brand CHAR(10) NOT NULL,
    p_type VARCHAR(25) NOT NULL,
    p_size INTEGER NOT NULL,
    p_container CHAR(10) NOT NULL,
    p_retailprice DECIMAL(15,2) NOT NULL,
    p_comment VARCHAR(23) NOT NULL
);

-- 创建SUPPLIER表
CREATE TABLE IF NOT EXISTS supplier (
    s_suppkey INTEGER PRIMARY KEY,
    s_name CHAR(25) NOT NULL,
    s_address VARCHAR(40) NOT NULL,
    s_nationkey INTEGER NOT NULL,
    s_phone CHAR(15) NOT NULL,
    s_acctbal DECIMAL(15,2) NOT NULL,
    s_comment VARCHAR(101) NOT NULL,
    FOREIGN KEY (s_nationkey) REFERENCES nation(n_nationkey)
);

-- 创建PARTSUPP表
CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey INTEGER NOT NULL,
    ps_suppkey INTEGER NOT NULL,
    ps_availqty INTEGER NOT NULL,
    ps_supplycost DECIMAL(15,2) NOT NULL,
    ps_comment VARCHAR(199) NOT NULL,
    PRIMARY KEY (ps_partkey, ps_suppkey),
    FOREIGN KEY (ps_partkey) REFERENCES part(p_partkey),
    FOREIGN KEY (ps_suppkey) REFERENCES supplier(s_suppkey)
);

-- 创建CUSTOMER表
CREATE TABLE IF NOT EXISTS customer (
    c_custkey INTEGER PRIMARY KEY,
    c_name VARCHAR(25) NOT NULL,
    c_address VARCHAR(40) NOT NULL,
    c_nationkey INTEGER NOT NULL,
    c_phone CHAR(15) NOT NULL,
    c_acctbal DECIMAL(15,2) NOT NULL,
    c_mktsegment CHAR(10) NOT NULL,
    c_comment VARCHAR(117) NOT NULL,
    FOREIGN KEY (c_nationkey) REFERENCES nation(n_nationkey)
);

-- 创建ORDERS表
CREATE TABLE IF NOT EXISTS orders (
    o_orderkey INTEGER PRIMARY KEY,
    o_custkey INTEGER NOT NULL,
    o_orderstatus CHAR(1) NOT NULL,
    o_totalprice DECIMAL(15,2) NOT NULL,
    o_orderdate DATE NOT NULL,
    o_orderpriority CHAR(15) NOT NULL,
    o_clerk CHAR(15) NOT NULL,
    o_shippriority INTEGER NOT NULL,
    o_comment VARCHAR(79) NOT NULL,
    FOREIGN KEY (o_custkey) REFERENCES customer(c_custkey)
);

-- 创建LINEITEM表
CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey INTEGER NOT NULL,
    l_partkey INTEGER NOT NULL,
    l_suppkey INTEGER NOT NULL,
    l_linenumber INTEGER NOT NULL,
    l_quantity DECIMAL(15,2) NOT NULL,
    l_extendedprice DECIMAL(15,2) NOT NULL,
    l_discount DECIMAL(15,2) NOT NULL,
    l_tax DECIMAL(15,2) NOT NULL,
    l_returnflag CHAR(1) NOT NULL,
    l_linestatus CHAR(1) NOT NULL,
    l_shipdate DATE NOT NULL,
    l_commitdate DATE NOT NULL,
    l_receiptdate DATE NOT NULL,
    l_shipinstruct CHAR(25) NOT NULL,
    l_shipmode CHAR(10) NOT NULL,
    l_comment VARCHAR(44) NOT NULL,
    PRIMARY KEY (l_orderkey, l_linenumber),
    FOREIGN KEY (l_orderkey) REFERENCES orders(o_orderkey),
    FOREIGN KEY (l_partkey, l_suppkey) REFERENCES partsupp(ps_partkey, ps_suppkey)
);

-- 创建索引
CREATE INDEX idx_nation_regionkey ON nation(n_regionkey);
CREATE INDEX idx_supplier_nationkey ON supplier(s_nationkey);
CREATE INDEX idx_customer_nationkey ON customer(c_nationkey);
CREATE INDEX idx_orders_custkey ON orders(o_custkey);
CREATE INDEX idx_orders_orderdate ON orders(o_orderdate);
CREATE INDEX idx_lineitem_orderkey ON lineitem(l_orderkey);
CREATE INDEX idx_lineitem_partkey ON lineitem(l_partkey);
CREATE INDEX idx_lineitem_suppkey ON lineitem(l_suppkey);
CREATE INDEX idx_lineitem_shipdate ON lineitem(l_shipdate);
CREATE INDEX idx_lineitem_commitdate ON lineitem(l_commitdate);
CREATE INDEX idx_lineitem_receiptdate ON lineitem(l_receiptdate);
CREATE INDEX idx_partsupp_partkey ON partsupp(ps_partkey);
CREATE INDEX idx_partsupp_suppkey ON partsupp(ps_suppkey);

-- 添加注释
COMMENT ON TABLE nation IS '国家信息表';
COMMENT ON TABLE region IS '地区信息表';
COMMENT ON TABLE part IS '零件信息表';
COMMENT ON TABLE supplier IS '供应商信息表';
COMMENT ON TABLE partsupp IS '零件供应商关联表';
COMMENT ON TABLE customer IS '客户信息表';
COMMENT ON TABLE orders IS '订单信息表';
COMMENT ON TABLE lineitem IS '订单明细表';

-- TPC-C 表结构
-- 仓库表
CREATE TABLE IF NOT EXISTS tpcc_warehouse (
    w_id INTEGER PRIMARY KEY,
    w_name VARCHAR(10) NOT NULL,
    w_street_1 VARCHAR(20) NOT NULL,
    w_street_2 VARCHAR(20),
    w_city VARCHAR(20) NOT NULL,
    w_state CHAR(2) NOT NULL,
    w_zip CHAR(9) NOT NULL,
    w_tax DECIMAL(4,4) NOT NULL,
    w_ytd DECIMAL(12,2) NOT NULL
);

-- 地区表
CREATE TABLE IF NOT EXISTS tpcc_district (
    d_id INTEGER NOT NULL,
    d_w_id INTEGER NOT NULL,
    d_name VARCHAR(10) NOT NULL,
    d_street_1 VARCHAR(20) NOT NULL,
    d_street_2 VARCHAR(20),
    d_city VARCHAR(20) NOT NULL,
    d_state CHAR(2) NOT NULL,
    d_zip CHAR(9) NOT NULL,
    d_tax DECIMAL(4,4) NOT NULL,
    d_ytd DECIMAL(12,2) NOT NULL,
    d_next_o_id INTEGER NOT NULL,
    PRIMARY KEY (d_w_id, d_id),
    FOREIGN KEY (d_w_id) REFERENCES tpcc_warehouse(w_id)
);

-- 客户表
CREATE TABLE IF NOT EXISTS tpcc_customer (
    c_id INTEGER NOT NULL,
    c_d_id INTEGER NOT NULL,
    c_w_id INTEGER NOT NULL,
    c_first VARCHAR(16) NOT NULL,
    c_middle CHAR(2) NOT NULL,
    c_last VARCHAR(16) NOT NULL,
    c_street_1 VARCHAR(20) NOT NULL,
    c_street_2 VARCHAR(20),
    c_city VARCHAR(20) NOT NULL,
    c_state CHAR(2) NOT NULL,
    c_zip CHAR(9) NOT NULL,
    c_phone CHAR(16) NOT NULL,
    c_since TIMESTAMP NOT NULL,
    c_credit CHAR(2) NOT NULL,
    c_credit_lim DECIMAL(12,2) NOT NULL,
    c_discount DECIMAL(4,4) NOT NULL,
    c_balance DECIMAL(12,2) NOT NULL,
    c_ytd_payment DECIMAL(12,2) NOT NULL,
    c_payment_cnt INTEGER NOT NULL,
    c_delivery_cnt INTEGER NOT NULL,
    c_data VARCHAR(500) NOT NULL,
    PRIMARY KEY (c_w_id, c_d_id, c_id),
    FOREIGN KEY (c_w_id, c_d_id) REFERENCES tpcc_district(d_w_id, d_id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS tpcc_orders (
    o_id INTEGER NOT NULL,
    o_d_id INTEGER NOT NULL,
    o_w_id INTEGER NOT NULL,
    o_c_id INTEGER NOT NULL,
    o_entry_d TIMESTAMP NOT NULL,
    o_carrier_id INTEGER,
    o_ol_cnt INTEGER NOT NULL,
    o_all_local INTEGER NOT NULL,
    PRIMARY KEY (o_w_id, o_d_id, o_id),
    FOREIGN KEY (o_w_id, o_d_id, o_c_id) REFERENCES tpcc_customer(c_w_id, c_d_id, c_id)
);

-- 订单明细表
CREATE TABLE IF NOT EXISTS tpcc_order_line (
    ol_o_id INTEGER NOT NULL,
    ol_d_id INTEGER NOT NULL,
    ol_w_id INTEGER NOT NULL,
    ol_number INTEGER NOT NULL,
    ol_i_id INTEGER NOT NULL,
    ol_supply_w_id INTEGER NOT NULL,
    ol_delivery_d TIMESTAMP,
    ol_quantity INTEGER NOT NULL,
    ol_amount DECIMAL(6,2) NOT NULL,
    ol_dist_info CHAR(24) NOT NULL,
    PRIMARY KEY (ol_w_id, ol_d_id, ol_o_id, ol_number),
    FOREIGN KEY (ol_w_id, ol_d_id, ol_o_id) REFERENCES tpcc_orders(o_w_id, o_d_id, o_id)
);

-- 商品表
CREATE TABLE IF NOT EXISTS tpcc_item (
    i_id INTEGER PRIMARY KEY,
    i_im_id INTEGER NOT NULL,
    i_name VARCHAR(24) NOT NULL,
    i_price DECIMAL(5,2) NOT NULL,
    i_data VARCHAR(50) NOT NULL
);

-- 库存表
CREATE TABLE IF NOT EXISTS tpcc_stock (
    s_i_id INTEGER NOT NULL,
    s_w_id INTEGER NOT NULL,
    s_quantity INTEGER NOT NULL,
    s_dist_01 CHAR(24) NOT NULL,
    s_dist_02 CHAR(24) NOT NULL,
    s_dist_03 CHAR(24) NOT NULL,
    s_dist_04 CHAR(24) NOT NULL,
    s_dist_05 CHAR(24) NOT NULL,
    s_dist_06 CHAR(24) NOT NULL,
    s_dist_07 CHAR(24) NOT NULL,
    s_dist_08 CHAR(24) NOT NULL,
    s_dist_09 CHAR(24) NOT NULL,
    s_dist_10 CHAR(24) NOT NULL,
    s_ytd INTEGER NOT NULL,
    s_order_cnt INTEGER NOT NULL,
    s_remote_cnt INTEGER NOT NULL,
    s_data VARCHAR(50) NOT NULL,
    PRIMARY KEY (s_w_id, s_i_id),
    FOREIGN KEY (s_w_id) REFERENCES tpcc_warehouse(w_id),
    FOREIGN KEY (s_i_id) REFERENCES tpcc_item(i_id)
);

-- 历史记录表
CREATE TABLE IF NOT EXISTS tpcc_history (
    h_c_id INTEGER NOT NULL,
    h_c_d_id INTEGER NOT NULL,
    h_c_w_id INTEGER NOT NULL,
    h_d_id INTEGER NOT NULL,
    h_w_id INTEGER NOT NULL,
    h_date TIMESTAMP NOT NULL,
    h_amount DECIMAL(6,2) NOT NULL,
    h_data VARCHAR(24) NOT NULL,
    FOREIGN KEY (h_c_w_id, h_c_d_id, h_c_id) REFERENCES tpcc_customer(c_w_id, c_d_id, c_id),
    FOREIGN KEY (h_w_id, h_d_id) REFERENCES tpcc_district(d_w_id, d_id)
);

-- 创建索引
CREATE INDEX idx_tpcc_customer_name ON tpcc_customer(c_w_id, c_d_id, c_last, c_first);
CREATE INDEX idx_tpcc_orders_customer ON tpcc_orders(o_w_id, o_d_id, o_c_id, o_id);
CREATE INDEX idx_tpcc_order_line ON tpcc_order_line(ol_w_id, ol_d_id, ol_o_id);
CREATE INDEX idx_tpcc_stock_item ON tpcc_stock(s_w_id, s_i_id);

-- 添加注释
COMMENT ON TABLE tpcc_warehouse IS 'TPC-C 仓库信息表';
COMMENT ON TABLE tpcc_district IS 'TPC-C 地区信息表';
COMMENT ON TABLE tpcc_customer IS 'TPC-C 客户信息表';
COMMENT ON TABLE tpcc_orders IS 'TPC-C 订单信息表';
COMMENT ON TABLE tpcc_order_line IS 'TPC-C 订单明细表';
COMMENT ON TABLE tpcc_item IS 'TPC-C 商品信息表';
COMMENT ON TABLE tpcc_stock IS 'TPC-C 库存信息表';
COMMENT ON TABLE tpcc_history IS 'TPC-C 历史记录表'; 