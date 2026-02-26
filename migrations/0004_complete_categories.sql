-- 完善抖音电商全品类评分标准配置
-- 基于2024年抖音电商实际品类数据

-- 先清空现有配置
DELETE FROM scoring_config;

-- ==================== 一、服饰鞋包类 ====================

-- 1. 女装
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('女装', 'roi', 'ROI(%)', 'percentage', 1.8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('女装', 'return_rate', '退货率(%)', 'percentage', 35, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('女装', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('女装', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('女装', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 2. 男装
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('男装', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('男装', 'return_rate', '退货率(%)', 'percentage', 25, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('男装', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('男装', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('男装', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 3. 内衣
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('内衣', 'roi', 'ROI(%)', 'percentage', 2.0, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('内衣', 'return_rate', '退货率(%)', 'percentage', 30, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('内衣', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('内衣', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('内衣', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 4. 鞋靴
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('鞋靴', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('鞋靴', 'return_rate', '退货率(%)', 'percentage', 20, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('鞋靴', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('鞋靴', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('鞋靴', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 5. 箱包
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('箱包', 'roi', 'ROI(%)', 'percentage', 1.7, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('箱包', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('箱包', 'profit_rate', '净利润率(%)', 'percentage', 22, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('箱包', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('箱包', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 二、美妆个护类 ====================

-- 6. 美妆
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('美妆', 'roi', 'ROI(%)', 'percentage', 2.0, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('美妆', 'return_rate', '退货率(%)', 'percentage', 30, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('美妆', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('美妆', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('美妆', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 7. 个护清洁
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('个护清洁', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('个护清洁', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('个护清洁', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('个护清洁', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('个护清洁', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 三、食品饮料类 ====================

-- 8. 食品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('食品', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('食品', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('食品', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('食品', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('食品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 9. 酒类
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('酒类', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('酒类', 'return_rate', '退货率(%)', 'percentage', 8, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('酒类', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('酒类', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('酒类', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 10. 生鲜
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('生鲜', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('生鲜', 'return_rate', '退货率(%)', 'percentage', 20, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('生鲜', 'profit_rate', '净利润率(%)', 'percentage', 10, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('生鲜', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('生鲜', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 四、居家日用类 ====================

-- 11. 日用品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('日用品', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('日用品', 'return_rate', '退货率(%)', 'percentage', 20, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('日用品', 'profit_rate', '净利润率(%)', 'percentage', 10, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('日用品', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('日用品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 12. 家居家纺
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家居家纺', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家居家纺', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家居家纺', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家居家纺', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('家居家纺', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 13. 家装建材
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家装建材', 'roi', 'ROI(%)', 'percentage', 1.2, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家装建材', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家装建材', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家装建材', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('家装建材', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 五、家用电器类 ====================

-- 14. 家电
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家电', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家电', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家电', 'profit_rate', '净利润率(%)', 'percentage', 8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家电', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('家电', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 15. 厨房电器
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('厨房电器', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('厨房电器', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('厨房电器', 'profit_rate', '净利润率(%)', 'percentage', 10, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('厨房电器', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('厨房电器', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 六、母婴玩具类 ====================

-- 16. 母婴
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('母婴', 'roi', 'ROI(%)', 'percentage', 2.0, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('母婴', 'return_rate', '退货率(%)', 'percentage', 25, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('母婴', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('母婴', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('母婴', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 17. 玩具乐器
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('玩具乐器', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('玩具乐器', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('玩具乐器', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('玩具乐器', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('玩具乐器', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 七、数码家电类 ====================

-- 18. 手机数码
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('手机数码', 'roi', 'ROI(%)', 'percentage', 1.2, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('手机数码', 'return_rate', '退货率(%)', 'percentage', 8, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('手机数码', 'profit_rate', '净利润率(%)', 'percentage', 6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('手机数码', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('手机数码', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 19. 电脑办公
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('电脑办公', 'roi', 'ROI(%)', 'percentage', 1.1, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('电脑办公', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('电脑办公', 'profit_rate', '净利润率(%)', 'percentage', 5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('电脑办公', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('电脑办公', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 八、运动户外类 ====================

-- 20. 运动户外
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('运动户外', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('运动户外', 'return_rate', '退货率(%)', 'percentage', 18, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('运动户外', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('运动户外', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('运动户外', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 九、汽车用品类 ====================

-- 21. 汽车用品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('汽车用品', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('汽车用品', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('汽车用品', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('汽车用品', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('汽车用品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 十、图书文娱类 ====================

-- 22. 图书音像
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('图书音像', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('图书音像', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('图书音像', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('图书音像', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('图书音像', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 23. 文具办公
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('文具办公', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('文具办公', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('文具办公', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('文具办公', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('文具办公', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 十一、珠宝配饰类 ====================

-- 24. 珠宝首饰
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('珠宝首饰', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('珠宝首饰', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('珠宝首饰', 'profit_rate', '净利润率(%)', 'percentage', 25, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('珠宝首饰', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('珠宝首饰', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 25. 钟表配饰
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('钟表配饰', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('钟表配饰', 'return_rate', '退货率(%)', 'percentage', 12, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('钟表配饰', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('钟表配饰', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('钟表配饰', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 十二、医药保健类 ====================

-- 26. 药品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('药品', 'roi', 'ROI(%)', 'percentage', 1.8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('药品', 'return_rate', '退货率(%)', 'percentage', 5, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('药品', 'profit_rate', '净利润率(%)', 'percentage', 25, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('药品', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('药品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 27. 医疗器械
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('医疗器械', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('医疗器械', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('医疗器械', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('医疗器械', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('医疗器械', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 28. 保健品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('保健品', 'roi', 'ROI(%)', 'percentage', 1.7, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('保健品', 'return_rate', '退货率(%)', 'percentage', 8, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('保健品', 'profit_rate', '净利润率(%)', 'percentage', 30, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('保健品', 'shop_score', '店铺评分', 'rating', 4.0, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('保健品', 'operation_months', '运营时长(月)', 'months', 9, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 十三、宠物用品类 ====================

-- 29. 宠物用品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('宠物用品', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('宠物用品', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('宠物用品', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('宠物用品', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('宠物用品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 十四、农资园艺类 ====================

-- 30. 农资园艺
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('农资园艺', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('农资园艺', 'return_rate', '退货率(%)', 'percentage', 18, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('农资园艺', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('农资园艺', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('农资园艺', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- ==================== 十五、其他品类（兜底） ====================

-- 31. 其他
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('其他', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('其他', 'return_rate', '退货率(%)', 'percentage', 20, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('其他', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('其他', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('其他', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_scoring_config_category ON scoring_config(category);
CREATE INDEX IF NOT EXISTS idx_scoring_config_active ON scoring_config(is_active);
