-- 创建测试数据
-- 地区数据
INSERT INTO tpc.region (r_regionkey, r_name, r_comment) VALUES
(0, 'AFRICA', '非洲地区'),
(1, 'AMERICA', '美洲地区'),
(2, 'ASIA', '亚洲地区'),
(3, 'EUROPE', '欧洲地区'),
(4, 'MIDDLE EAST', '中东地区');

-- 国家数据
INSERT INTO tpc.nation (n_nationkey, n_name, n_regionkey, n_comment) VALUES
(0, 'ALGERIA', 0, '阿尔及利亚'),
(1, 'ARGENTINA', 1, '阿根廷'),
(2, 'BRAZIL', 1, '巴西'),
(3, 'CANADA', 1, '加拿大'),
(4, 'EGYPT', 0, '埃及'),
(5, 'ETHIOPIA', 0, '埃塞俄比亚'),
(6, 'FRANCE', 3, '法国'),
(7, 'GERMANY', 3, '德国'),
(8, 'INDIA', 2, '印度'),
(9, 'INDONESIA', 2, '印度尼西亚'),
(10, 'IRAN', 4, '伊朗'),
(11, 'IRAQ', 4, '伊拉克'),
(12, 'JAPAN', 2, '日本'),
(13, 'JORDAN', 4, '约旦'),
(14, 'KENYA', 0, '肯尼亚'),
(15, 'MOROCCO', 0, '摩洛哥'),
(16, 'MOZAMBIQUE', 0, '莫桑比克'),
(17, 'PERU', 1, '秘鲁'),
(18, 'CHINA', 2, '中国'),
(19, 'ROMANIA', 3, '罗马尼亚'),
(20, 'SAUDI ARABIA', 4, '沙特阿拉伯'),
(21, 'VIETNAM', 2, '越南'),
(22, 'RUSSIA', 3, '俄罗斯'),
(23, 'UNITED KINGDOM', 3, '英国'),
(24, 'UNITED STATES', 1, '美国');

-- 供应商数据
INSERT INTO tpc.supplier (s_suppkey, s_name, s_address, s_nationkey, s_phone, s_acctbal, s_comment) VALUES
(1, 'Supplier#000000001', '北京市朝阳区', 18, '86-10-12345678', 1000.00, '中国供应商'),
(2, 'Supplier#000000002', '上海市浦东新区', 18, '86-21-87654321', 2000.00, '上海供应商'),
(3, 'Supplier#000000003', '东京都', 12, '81-3-12345678', 3000.00, '日本供应商'),
(4, 'Supplier#000000004', '纽约市', 24, '1-212-1234567', 4000.00, '美国供应商'),
(5, 'Supplier#000000005', '柏林市', 7, '49-30-12345678', 5000.00, '德国供应商');

-- 客户数据
INSERT INTO tpc.customer (c_custkey, c_name, c_address, c_nationkey, c_phone, c_acctbal, c_mktsegment, c_comment) VALUES
(1, 'Customer#000000001', '北京市海淀区', 18, '86-10-11111111', 1000.00, 'BUILDING', '建筑行业客户'),
(2, 'Customer#000000002', '上海市徐汇区', 18, '86-21-22222222', 2000.00, 'AUTOMOBILE', '汽车行业客户'),
(3, 'Customer#000000003', '东京都', 12, '81-3-33333333', 3000.00, 'MACHINERY', '机械行业客户'),
(4, 'Customer#000000004', '纽约市', 24, '1-212-4444444', 4000.00, 'HOUSEHOLD', '家居行业客户'),
(5, 'Customer#000000005', '柏林市', 7, '49-30-55555555', 5000.00, 'FURNITURE', '家具行业客户');

-- 订单数据
INSERT INTO tpc.orders (o_orderkey, o_custkey, o_orderstatus, o_totalprice, o_orderdate, o_orderpriority, o_clerk, o_shippriority, o_comment) VALUES
(1, 1, 'O', 1000.00, '1994-01-01', '1-URGENT', 'Clerk#000000001', 0, '紧急订单'),
(2, 2, 'F', 2000.00, '1994-02-01', '2-HIGH', 'Clerk#000000002', 1, '高优先级订单'),
(3, 3, 'O', 3000.00, '1994-03-01', '3-MEDIUM', 'Clerk#000000003', 2, '中等优先级订单'),
(4, 4, 'F', 4000.00, '1994-04-01', '4-NOT SPECIFIED', 'Clerk#000000004', 3, '普通订单'),
(5, 5, 'O', 5000.00, '1994-05-01', '5-LOW', 'Clerk#000000005', 4, '低优先级订单');


INSERT INTO tpc.part (p_partkey, p_name, p_mfgr, p_brand, p_type, p_size, p_container, p_retailprice, p_comment) VALUES
(1, 'Part#000000001', 'Manufacturer#1', 'Brand#1', 'STANDARD', 10, 'SM BOX', 100.00, '零件1'),
(2, 'Part#000000002', 'Manufacturer#2', 'Brand#2', 'STANDARD', 20, 'SM BOX', 200.00, '零件2'),
(3, 'Part#000000003', 'Manufacturer#3', 'Brand#3', 'STANDARD', 30, 'SM BOX', 300.00, '零件3'),
(4, 'Part#000000004', 'Manufacturer#4', 'Brand#4', 'STANDARD', 40, 'SM BOX', 400.00, '零件4'),
(5, 'Part#000000005', 'Manufacturer#5', 'Brand#5', 'STANDARD', 50, 'SM BOX', 500.00, '零件5');

-- 零件供应商数据
INSERT INTO tpc.partsupp (ps_partkey, ps_suppkey, ps_availqty, ps_supplycost, ps_comment) VALUES
(1, 1, 100, 10.00, '零件1供应商1'),
(2, 2, 200, 20.00, '零件2供应商2'),
(3, 3, 300, 30.00, '零件3供应商3'),
(4, 4, 400, 40.00, '零件4供应商4'),
(5, 5, 500, 50.00, '零件5供应商5');

-- 订单明细数据
INSERT INTO tpc.lineitem (l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag, l_linestatus, l_shipdate, l_commitdate, l_receiptdate, l_shipinstruct, l_shipmode, l_comment) VALUES
(1, 1, 1, 1, 10, 1000.00, 0.05, 0.10, 'N', 'O', '1994-01-15', '1994-01-10', '1994-01-20', 'DELIVER IN PERSON', 'TRUCK', '正常发货'),
(2, 2, 2, 1, 20, 2000.00, 0.10, 0.15, 'R', 'F', '1994-02-15', '1994-02-10', '1994-02-20', 'COLLECT COD', 'SHIP', '退货'),
(3, 3, 3, 1, 30, 3000.00, 0.15, 0.20, 'A', 'O', '1994-03-15', '1994-03-10', '1994-03-20', 'TAKE BACK RETURN', 'AIR', '退货'),
(4, 4, 4, 1, 40, 4000.00, 0.20, 0.25, 'N', 'F', '1994-04-15', '1994-04-10', '1994-04-20', 'NONE', 'RAIL', '正常发货'),
(5, 5, 5, 1, 50, 5000.00, 0.25, 0.30, 'R', 'O', '1994-05-15', '1994-05-10', '1994-05-20', 'DELIVER IN PERSON', 'TRUCK', '退货'); 