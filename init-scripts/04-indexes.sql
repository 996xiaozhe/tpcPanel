-- 设置搜索路径
SET search_path TO tpc, public;

-- LINEITEM表索引
CREATE INDEX IF NOT EXISTS idx_lineitem_orderkey ON lineitem (l_orderkey);
CREATE INDEX IF NOT EXISTS idx_lineitem_partkey_suppkey ON lineitem (l_partkey, l_suppkey);
CREATE INDEX IF NOT EXISTS idx_lineitem_shipdate ON lineitem (l_shipdate);
CREATE INDEX IF NOT EXISTS idx_lineitem_returnflag_linestatus ON lineitem (l_returnflag, l_linestatus);
CREATE INDEX IF NOT EXISTS idx_lineitem_commitdate ON lineitem (l_commitdate);
CREATE INDEX IF NOT EXISTS idx_lineitem_receiptdate ON lineitem (l_receiptdate);
CREATE INDEX IF NOT EXISTS idx_lineitem_suppkey ON lineitem (l_suppkey);
CREATE INDEX IF NOT EXISTS idx_lineitem_partkey ON lineitem (l_partkey);

-- ORDERS表索引
CREATE INDEX IF NOT EXISTS idx_orders_custkey ON orders (o_custkey);
CREATE INDEX IF NOT EXISTS idx_orders_orderdate ON orders (o_orderdate);
CREATE INDEX IF NOT EXISTS idx_orders_orderstatus ON orders (o_orderstatus);
CREATE INDEX IF NOT EXISTS idx_orders_orderpriority ON orders (o_orderpriority);
CREATE INDEX IF NOT EXISTS idx_orders_clerk ON orders (o_clerk);

-- CUSTOMER表索引
CREATE INDEX IF NOT EXISTS idx_customer_nationkey ON customer (c_nationkey);
CREATE INDEX IF NOT EXISTS idx_customer_mktsegment ON customer (c_mktsegment);
CREATE INDEX IF NOT EXISTS idx_customer_acctbal ON customer (c_acctbal);
CREATE INDEX IF NOT EXISTS idx_customer_name ON customer (c_name);

-- PART表索引
CREATE INDEX IF NOT EXISTS idx_part_brand ON part (p_brand);
CREATE INDEX IF NOT EXISTS idx_part_type ON part (p_type);
CREATE INDEX IF NOT EXISTS idx_part_container ON part (p_container);
CREATE INDEX IF NOT EXISTS idx_part_size ON part (p_size);
CREATE INDEX IF NOT EXISTS idx_part_retailprice ON part (p_retailprice);

-- SUPPLIER表索引
CREATE INDEX IF NOT EXISTS idx_supplier_nationkey ON supplier (s_nationkey);
CREATE INDEX IF NOT EXISTS idx_supplier_acctbal ON supplier (s_acctbal);
CREATE INDEX IF NOT EXISTS idx_supplier_name ON supplier (s_name);

-- PARTSUPP表索引
CREATE INDEX IF NOT EXISTS idx_partsupp_partkey ON partsupp (ps_partkey);
CREATE INDEX IF NOT EXISTS idx_partsupp_suppkey ON partsupp (ps_suppkey);
CREATE INDEX IF NOT EXISTS idx_partsupp_availqty ON partsupp (ps_availqty);
CREATE INDEX IF NOT EXISTS idx_partsupp_supplycost ON partsupp (ps_supplycost);

-- NATION表索引
CREATE INDEX IF NOT EXISTS idx_nation_regionkey ON nation (n_regionkey);
CREATE INDEX IF NOT EXISTS idx_nation_name ON nation (n_name);

-- REGION表索引
CREATE INDEX IF NOT EXISTS idx_region_name ON region (r_name);

-- TPC-C表索引
-- WAREHOUSE表索引
CREATE INDEX IF NOT EXISTS idx_warehouse_name ON tpcc_warehouse (w_name);
CREATE INDEX IF NOT EXISTS idx_warehouse_ytd ON tpcc_warehouse (w_ytd);

-- DISTRICT表索引
CREATE INDEX IF NOT EXISTS idx_district_warehouse ON tpcc_district (d_w_id);
CREATE INDEX IF NOT EXISTS idx_district_name ON tpcc_district (d_name);
CREATE INDEX IF NOT EXISTS idx_district_ytd ON tpcc_district (d_ytd);

-- CUSTOMER表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_warehouse ON tpcc_customer (c_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_district ON tpcc_customer (c_d_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_name ON tpcc_customer (c_last, c_first);
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_credit ON tpcc_customer (c_credit);
CREATE INDEX IF NOT EXISTS idx_tpcc_customer_balance ON tpcc_customer (c_balance);

-- ORDERS表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_warehouse ON tpcc_orders (o_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_district ON tpcc_orders (o_d_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_customer ON tpcc_orders (o_c_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_entry_d ON tpcc_orders (o_entry_d);
CREATE INDEX IF NOT EXISTS idx_tpcc_orders_carrier ON tpcc_orders (o_carrier_id);

-- ORDER_LINE表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_warehouse ON tpcc_order_line (ol_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_district ON tpcc_order_line (ol_d_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_order ON tpcc_order_line (ol_o_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_item ON tpcc_order_line (ol_i_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_order_line_amount ON tpcc_order_line (ol_amount);

-- ITEM表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_item_name ON tpcc_item (i_name);
CREATE INDEX IF NOT EXISTS idx_tpcc_item_price ON tpcc_item (i_price);
CREATE INDEX IF NOT EXISTS idx_tpcc_item_data ON tpcc_item (i_data);

-- STOCK表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_warehouse ON tpcc_stock (s_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_item ON tpcc_stock (s_i_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_quantity ON tpcc_stock (s_quantity);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_ytd ON tpcc_stock (s_ytd);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_order_cnt ON tpcc_stock (s_order_cnt);
CREATE INDEX IF NOT EXISTS idx_tpcc_stock_remote_cnt ON tpcc_stock (s_remote_cnt);

-- HISTORY表索引
CREATE INDEX IF NOT EXISTS idx_tpcc_history_warehouse ON tpcc_history (h_w_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_history_district ON tpcc_history (h_d_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_history_customer ON tpcc_history (h_c_id);
CREATE INDEX IF NOT EXISTS idx_tpcc_history_date ON tpcc_history (h_date);
CREATE INDEX IF NOT EXISTS idx_tpcc_history_amount ON tpcc_history (h_amount);

-- 添加注释
COMMENT ON INDEX idx_lineitem_orderkey IS 'LINEITEM表订单号索引';
COMMENT ON INDEX idx_lineitem_partkey_suppkey IS 'LINEITEM表零件号和供应商号复合索引';
COMMENT ON INDEX idx_lineitem_shipdate IS 'LINEITEM表发货日期索引';
COMMENT ON INDEX idx_lineitem_returnflag_linestatus IS 'LINEITEM表退货标志和行状态复合索引';
COMMENT ON INDEX idx_orders_custkey IS 'ORDERS表客户号索引';
COMMENT ON INDEX idx_orders_orderdate IS 'ORDERS表订单日期索引';
COMMENT ON INDEX idx_customer_nationkey IS 'CUSTOMER表国家号索引';
COMMENT ON INDEX idx_customer_mktsegment IS 'CUSTOMER表市场分区索引'; 