-- 抖音电商48个一级类目完整评分配置 V2
-- 基于现有scoring_config表结构，清除旧数据并插入新的48个类目

-- 第一步：清除旧数据
DELETE FROM scoring_config;

-- 第二步：插入新的48个类目评分配置（每个类目5个字段，共240条记录）

-- =============================
-- 服饰鞋包类（9个类目）
-- =============================

-- 1. 女装
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('女装', 'roi', 'ROI(%)', 'percentage', 1.8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('女装', 'return_rate', '退货率(%)', 'percentage', 35, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('女装', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('女装', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('女装', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 2. 男装
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('男装', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('男装', 'return_rate', '退货率(%)', 'percentage', 25, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('男装', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('男装', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('男装', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 3. 内衣
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('内衣', 'roi', 'ROI(%)', 'percentage', 2.0, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('内衣', 'return_rate', '退货率(%)', 'percentage', 30, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('内衣', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('内衣', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('内衣', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 4. 童装
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('童装', 'roi', 'ROI(%)', 'percentage', 1.7, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('童装', 'return_rate', '退货率(%)', 'percentage', 30, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('童装', 'profit_rate', '净利润率(%)', 'percentage', 16, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('童装', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('童装', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 5. 鞋靴
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('鞋靴', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('鞋靴', 'return_rate', '退货率(%)', 'percentage', 28, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('鞋靴', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('鞋靴', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('鞋靴', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 6. 箱包
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('箱包', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('箱包', 'return_rate', '退货率(%)', 'percentage', 20, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('箱包', 'profit_rate', '净利润率(%)', 'percentage', 22, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('箱包', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('箱包', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 7. 配饰
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('配饰', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('配饰', 'return_rate', '退货率(%)', 'percentage', 18, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('配饰', 'profit_rate', '净利润率(%)', 'percentage', 25, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('配饰', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('配饰', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 8. 运动服饰
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('运动服饰', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('运动服饰', 'return_rate', '退货率(%)', 'percentage', 25, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('运动服饰', 'profit_rate', '净利润率(%)', 'percentage', 16, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('运动服饰', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('运动服饰', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 9. 制服工装
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('制服工装', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('制服工装', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('制服工装', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('制服工装', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('制服工装', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 美妆个护类（4个类目）
-- =============================

-- 10. 美妆
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('美妆', 'roi', 'ROI(%)', 'percentage', 2.0, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('美妆', 'return_rate', '退货率(%)', 'percentage', 30, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('美妆', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('美妆', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('美妆', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 11. 个人护理
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('个人护理', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('个人护理', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('个人护理', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('个人护理', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('个人护理', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 12. 彩妆香水
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('彩妆香水', 'roi', 'ROI(%)', 'percentage', 2.2, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('彩妆香水', 'return_rate', '退货率(%)', 'percentage', 25, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('彩妆香水', 'profit_rate', '净利润率(%)', 'percentage', 25, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('彩妆香水', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('彩妆香水', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 13. 美容仪器
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('美容仪器', 'roi', 'ROI(%)', 'percentage', 2.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('美容仪器', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('美容仪器', 'profit_rate', '净利润率(%)', 'percentage', 30, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('美容仪器', 'shop_score', '店铺评分', 'rating', 4.2, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.2,"score":10},{"min":4.0,"score":5},{"min":0,"score":0}]}', 1, 4),
('美容仪器', 'operation_months', '运营时长(月)', 'months', 12, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 食品饮料类（6个类目）
-- =============================

-- 14. 食品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('食品', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('食品', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('食品', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('食品', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('食品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 15. 酒类
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('酒类', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('酒类', 'return_rate', '退货率(%)', 'percentage', 8, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('酒类', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('酒类', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('酒类', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 16. 生鲜
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('生鲜', 'roi', 'ROI(%)', 'percentage', 1.8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('生鲜', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('生鲜', 'profit_rate', '净利润率(%)', 'percentage', 10, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('生鲜', 'shop_score', '店铺评分', 'rating', 4.2, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.2,"score":10},{"min":4.0,"score":5},{"min":0,"score":0}]}', 1, 4),
('生鲜', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 17. 茶叶
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('茶叶', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('茶叶', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('茶叶', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('茶叶', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('茶叶', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 18. 保健食品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('保健食品', 'roi', 'ROI(%)', 'percentage', 1.7, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('保健食品', 'return_rate', '退货率(%)', 'percentage', 8, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('保健食品', 'profit_rate', '净利润率(%)', 'percentage', 30, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('保健食品', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('保健食品', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 19. 滋补品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('滋补品', 'roi', 'ROI(%)', 'percentage', 1.8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('滋补品', 'return_rate', '退货率(%)', 'percentage', 8, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('滋补品', 'profit_rate', '净利润率(%)', 'percentage', 35, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('滋补品', 'shop_score', '店铺评分', 'rating', 4.2, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.2,"score":10},{"min":4.0,"score":5},{"min":0,"score":0}]}', 1, 4),
('滋补品', 'operation_months', '运营时长(月)', 'months', 12, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 家居生活类（8个类目）
-- =============================

-- 20. 家居家纺
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家居家纺', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家居家纺', 'return_rate', '退货率(%)', 'percentage', 20, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家居家纺', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家居家纺', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('家居家纺', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 21. 家装建材
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家装建材', 'roi', 'ROI(%)', 'percentage', 1.2, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家装建材', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家装建材', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家装建材', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('家装建材', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 22. 厨房用品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('厨房用品', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('厨房用品', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('厨房用品', 'profit_rate', '净利润率(%)', 'percentage', 14, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('厨房用品', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('厨房用品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 23. 日用百货
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('日用百货', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('日用百货', 'return_rate', '退货率(%)', 'percentage', 18, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('日用百货', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('日用百货', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('日用百货', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 24. 家庭清洁
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家庭清洁', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家庭清洁', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家庭清洁', 'profit_rate', '净利润率(%)', 'percentage', 14, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家庭清洁', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('家庭清洁', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 25. 卫浴用品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('卫浴用品', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('卫浴用品', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('卫浴用品', 'profit_rate', '净利润率(%)', 'percentage', 16, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('卫浴用品', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('卫浴用品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 26. 家具
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家具', 'roi', 'ROI(%)', 'percentage', 1.2, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家具', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家具', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家具', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('家具', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 27. 灯具照明
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('灯具照明', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('灯具照明', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('灯具照明', 'profit_rate', '净利润率(%)', 'percentage', 14, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('灯具照明', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('灯具照明', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 电器数码类（6个类目）
-- =============================

-- 28. 家用电器
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家用电器', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家用电器', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家用电器', 'profit_rate', '净利润率(%)', 'percentage', 8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家用电器', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('家用电器', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 29. 厨房电器
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('厨房电器', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('厨房电器', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('厨房电器', 'profit_rate', '净利润率(%)', 'percentage', 10, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('厨房电器', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('厨房电器', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 30. 手机数码
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('手机数码', 'roi', 'ROI(%)', 'percentage', 1.2, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('手机数码', 'return_rate', '退货率(%)', 'percentage', 8, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('手机数码', 'profit_rate', '净利润率(%)', 'percentage', 6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('手机数码', 'shop_score', '店铺评分', 'rating', 4.2, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.2,"score":10},{"min":4.0,"score":5},{"min":0,"score":0}]}', 1, 4),
('手机数码', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 31. 电脑办公
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('电脑办公', 'roi', 'ROI(%)', 'percentage', 1.1, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('电脑办公', 'return_rate', '退货率(%)', 'percentage', 8, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('电脑办公', 'profit_rate', '净利润率(%)', 'percentage', 7, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('电脑办公', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('电脑办公', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 32. 智能设备
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('智能设备', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('智能设备', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('智能设备', 'profit_rate', '净利润率(%)', 'percentage', 10, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('智能设备', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('智能设备', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 33. 影音娱乐
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('影音娱乐', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('影音娱乐', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('影音娱乐', 'profit_rate', '净利润率(%)', 'percentage', 9, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('影音娱乐', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('影音娱乐', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 母婴玩具类（4个类目）
-- =============================

-- 34. 母婴用品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('母婴用品', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('母婴用品', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('母婴用品', 'profit_rate', '净利润率(%)', 'percentage', 16, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('母婴用品', 'shop_score', '店铺评分', 'rating', 4.2, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.2,"score":10},{"min":4.0,"score":5},{"min":0,"score":0}]}', 1, 4),
('母婴用品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 35. 玩具乐器
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('玩具乐器', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('玩具乐器', 'return_rate', '退货率(%)', 'percentage', 18, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('玩具乐器', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('玩具乐器', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('玩具乐器', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 36. 童车童床
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('童车童床', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('童车童床', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('童车童床', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('童车童床', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('童车童床', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 37. 营养辅食
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('营养辅食', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('营养辅食', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('营养辅食', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('营养辅食', 'shop_score', '店铺评分', 'rating', 4.2, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.2,"score":10},{"min":4.0,"score":5},{"min":0,"score":0}]}', 1, 4),
('营养辅食', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 运动户外类（3个类目）
-- =============================

-- 38. 运动户外
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('运动户外', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('运动户外', 'return_rate', '退货率(%)', 'percentage', 20, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('运动户外', 'profit_rate', '净利润率(%)', 'percentage', 16, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('运动户外', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('运动户外', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 39. 健身器材
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('健身器材', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('健身器材', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('健身器材', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('健身器材', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('健身器材', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 40. 户外装备
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('户外装备', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('户外装备', 'return_rate', '退货率(%)', 'percentage', 18, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('户外装备', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('户外装备', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('户外装备', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 汽车用品类（2个类目）
-- =============================

-- 41. 汽车用品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('汽车用品', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('汽车用品', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('汽车用品', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('汽车用品', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('汽车用品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 42. 汽车配件
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('汽车配件', 'roi', 'ROI(%)', 'percentage', 1.2, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('汽车配件', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('汽车配件', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('汽车配件', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('汽车配件', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 珠宝钟表类（2个类目）
-- =============================

-- 43. 珠宝首饰
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('珠宝首饰', 'roi', 'ROI(%)', 'percentage', 2.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('珠宝首饰', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('珠宝首饰', 'profit_rate', '净利润率(%)', 'percentage', 35, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('珠宝首饰', 'shop_score', '店铺评分', 'rating', 4.2, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.2,"score":10},{"min":4.0,"score":5},{"min":0,"score":0}]}', 1, 4),
('珠宝首饰', 'operation_months', '运营时长(月)', 'months', 12, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":5},{"min":0,"score":0}]}', 1, 5);

-- 44. 钟表眼镜
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('钟表眼镜', 'roi', 'ROI(%)', 'percentage', 2.0, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('钟表眼镜', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('钟表眼镜', 'profit_rate', '净利润率(%)', 'percentage', 28, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('钟表眼镜', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('钟表眼镜', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 图书文娱类（3个类目）
-- =============================

-- 45. 图书音像
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('图书音像', 'roi', 'ROI(%)', 'percentage', 1.2, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('图书音像', 'return_rate', '退货率(%)', 'percentage', 8, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('图书音像', 'profit_rate', '净利润率(%)', 'percentage', 10, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('图书音像', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('图书音像', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 46. 文具办公
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('文具办公', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('文具办公', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('文具办公', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('文具办公', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('文具办公', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 47. 乐器
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('乐器', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('乐器', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('乐器', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('乐器', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":5},{"min":0,"score":0}]}', 1, 4),
('乐器', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":9,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- =============================
-- 其他类（1个类目）
-- =============================

-- 48. 其他
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('其他', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('其他', 'return_rate', '退货率(%)', 'percentage', 20, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('其他', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('其他', 'shop_score', '店铺评分', 'rating', 3.8, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.8,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('其他', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 第三步：创建索引
CREATE INDEX IF NOT EXISTS idx_scoring_config_category_active ON scoring_config(category, is_active);
