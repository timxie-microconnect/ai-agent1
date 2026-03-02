-- 投资方案模块增强：添加波动率作为第5个筛子指标
-- Migration: 0012_add_volatility_indicator.sql
-- Date: 2026-03-02

-- 1. 为category_thresholds表添加波动率上限字段
ALTER TABLE category_thresholds ADD COLUMN volatility_max REAL DEFAULT 0.15;

-- 2. 更新现有测试数据的波动率阈值（15%为上限）
UPDATE category_thresholds SET volatility_max = 0.15 WHERE is_active = 1;

-- 3. 更新评分配置权重（从4个指标改为5个指标）
-- 删除旧的权重配置
DELETE FROM sieve_system_config WHERE config_type = 'weights';

-- 插入新的5指标权重配置
INSERT INTO sieve_system_config (config_type, config_data) VALUES
('weights', '{"net_roi":0.15,"settle_roi":0.25,"settle_rate":0.25,"history_spend":0.15,"volatility":0.20}');

-- 4. 添加波动率的k值配置
UPDATE sieve_system_config 
SET config_data = '{"k_net_roi":3.0,"k_settle_roi":4.0,"k_settle_rate":4.0,"k_history_spend":1.5,"k_volatility":2.0}'
WHERE config_type = 'k_values';

-- 5. 为projects表添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_projects_daily_revenue_volatility ON projects(daily_revenue_volatility);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);

-- 说明：
-- volatility_max: 波动率上限（例如0.15表示15%）
-- 权重分配：
--   净成交ROI: 15%
--   14日结算ROI: 25%
--   14日订单结算率: 25%
--   历史消耗: 15%
--   90天波动率: 20%
-- 总计: 100%
