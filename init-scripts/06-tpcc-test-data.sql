-- 设置搜索路径
SET search_path TO tpc, public;

-- 插入仓库数据
INSERT INTO tpcc_warehouse (w_id, w_name, w_street_1, w_street_2, w_city, w_state, w_zip, w_tax, w_ytd)
VALUES 
(1, '仓库1', '街道1', '街道2', '城市1', 'ST', '123456789', 0.1, 1000000.00),
(2, '仓库2', '街道3', '街道4', '城市2', 'ST', '987654321', 0.1, 1000000.00);

-- 插入区域数据
INSERT INTO tpcc_district (d_id, d_w_id, d_name, d_street_1, d_street_2, d_city, d_state, d_zip, d_tax, d_ytd, d_next_o_id)
VALUES 
(1, 1, '区域1', '街道1', '街道2', '城市1', 'ST', '123456789', 0.1, 100000.00, 1),
(2, 1, '区域2', '街道3', '街道4', '城市1', 'ST', '123456789', 0.1, 100000.00, 1),
(1, 2, '区域1', '街道1', '街道2', '城市2', 'ST', '987654321', 0.1, 100000.00, 1),
(2, 2, '区域2', '街道3', '街道4', '城市2', 'ST', '987654321', 0.1, 100000.00, 1);

-- 插入客户数据
INSERT INTO tpcc_customer (c_id, c_d_id, c_w_id, c_first, c_middle, c_last, c_street_1, c_street_2, c_city, c_state, c_zip, c_phone, c_since, c_credit, c_credit_lim, c_discount, c_balance, c_ytd_payment, c_payment_cnt, c_delivery_cnt, c_data)
VALUES 
(1, 1, 1, '张', '三', '客户1', '街道1', '街道2', '城市1', 'ST', '123456789', '1234567890', CURRENT_TIMESTAMP, 'GC', 50000.00, 0.1, 0.00, 0.00, 0, 0, '客户数据1'),
(2, 1, 1, '李', '四', '客户2', '街道3', '街道4', '城市1', 'ST', '123456789', '1234567891', CURRENT_TIMESTAMP, 'GC', 50000.00, 0.1, 0.00, 0.00, 0, 0, '客户数据2'),
(1, 1, 2, '王', '五', '客户3', '街道1', '街道2', '城市2', 'ST', '987654321', '1234567892', CURRENT_TIMESTAMP, 'GC', 50000.00, 0.1, 0.00, 0.00, 0, 0, '客户数据3'),
(2, 1, 2, '赵', '六', '客户4', '街道3', '街道4', '城市2', 'ST', '987654321', '1234567893', CURRENT_TIMESTAMP, 'GC', 50000.00, 0.1, 0.00, 0.00, 0, 0, '客户数据4');

-- 插入商品数据
INSERT INTO tpcc_item (i_id, i_im_id, i_name, i_price, i_data)
VALUES 
(1, 1, '商品1', 100.00, '商品数据1'),
(2, 2, '商品2', 200.00, '商品数据2'),
(3, 3, '商品3', 300.00, '商品数据3');

-- 插入库存数据
INSERT INTO tpcc_stock (s_i_id, s_w_id, s_quantity, s_dist_01, s_dist_02, s_dist_03, s_dist_04, s_dist_05, s_dist_06, s_dist_07, s_dist_08, s_dist_09, s_dist_10, s_ytd, s_order_cnt, s_remote_cnt, s_data)
VALUES 
(1, 1, 100, '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', '库存数据1', 0, 0, 0, '库存数据1'),
(2, 1, 100, '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', '库存数据2', 0, 0, 0, '库存数据2'),
(3, 1, 100, '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', '库存数据3', 0, 0, 0, '库存数据3');

-- 插入订单数据
INSERT INTO tpcc_orders (o_id, o_d_id, o_w_id, o_c_id, o_entry_d, o_carrier_id, o_ol_cnt, o_all_local)
VALUES 
(1, 1, 1, 1, CURRENT_TIMESTAMP, NULL, 1, 1);

-- 插入订单明细数据
INSERT INTO tpcc_order_line (ol_o_id, ol_d_id, ol_w_id, ol_number, ol_i_id, ol_supply_w_id, ol_delivery_d, ol_quantity, ol_amount, ol_dist_info)
VALUES 
(1, 1, 1, 1, 1, 1, NULL, 1, 100.00, '订单明细数据1');

-- 插入新订单数据
INSERT INTO tpcc_new_order (no_o_id, no_d_id, no_w_id)
VALUES 
(1, 1, 1);

-- 插入历史记录数据
INSERT INTO tpcc_history (h_c_id, h_c_d_id, h_c_w_id, h_d_id, h_w_id, h_date, h_amount, h_data)
VALUES 
(1, 1, 1, 1, 1, CURRENT_TIMESTAMP, 100.00, '历史记录数据1'); 