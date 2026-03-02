-- 筛子系统配置表
CREATE TABLE IF NOT EXISTS sieve_system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_type TEXT NOT NULL,  -- 'weights' 或 'k_values'
  config_data TEXT NOT NULL,  -- JSON格式存储配置
  updated_by INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT INTO sieve_system_config (config_type, config_data) VALUES 
('weights', '{"net_roi":0.20,"settle_roi":0.35,"settle_rate":0.30,"history_spend":0.15}'),
('k_values', '{"net_roi":3.0,"settle_roi":4.0,"settle_rate":4.0,"history_spend":1.5}');

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sieve_config_type ON sieve_system_config(config_type);
