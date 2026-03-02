-- 插入测试阈值数据
INSERT OR IGNORE INTO category_thresholds (
  main_category, level1_category, level2_category,
  net_roi_min, settle_roi_min, settle_rate_min, history_spend_min,
  is_active, version
) VALUES 
('水果生鲜', '水产肉类/新鲜蔬果/熟食', '半成品菜', 1.6, 1.47, 0.79, 100000, 1, 1),
('水果生鲜', '水产肉类/新鲜蔬果/熟食', '水果', 1.5, 1.4, 0.75, 80000, 1, 1),
('水果生鲜', '水产肉类/新鲜蔬果/熟食', '蔬菜', 1.5, 1.4, 0.75, 80000, 1, 1);

-- 插入评分配置
INSERT OR IGNORE INTO sieve_system_config (id, config_type, config_data) VALUES
(1, 'weights', '{"net_roi":0.20,"settle_roi":0.35,"settle_rate":0.30,"history_spend":0.15}'),
(2, 'k_values', '{"k_net_roi":3.0,"k_settle_roi":4.0,"k_settle_rate":4.0,"k_history_spend":1.5}');
