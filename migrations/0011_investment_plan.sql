-- 投资方案模块相关表结构
-- 创建时间：2026-03-02

-- 1. 添加项目的90天净成交数据字段
ALTER TABLE projects ADD COLUMN daily_revenue_data TEXT;
ALTER TABLE projects ADD COLUMN daily_revenue_uploaded_at DATETIME;
ALTER TABLE projects ADD COLUMN daily_revenue_volatility REAL;

-- 2. 添加投资方案字段
ALTER TABLE projects ADD COLUMN max_investment_amount REAL;
ALTER TABLE projects ADD COLUMN investment_amount REAL;
ALTER TABLE projects ADD COLUMN profit_share_ratio REAL;
ALTER TABLE projects ADD COLUMN payment_frequency TEXT;
ALTER TABLE projects ADD COLUMN annual_rate REAL;
ALTER TABLE projects ADD COLUMN estimated_days INTEGER;
ALTER TABLE projects ADD COLUMN total_return_amount REAL;
ALTER TABLE projects ADD COLUMN investment_plan_created_at DATETIME;

-- 4. 创建系统配置表（如果不存在）
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 插入默认配置：最长联营期限
INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('max_partnership_days', '60', '最长联营期限（天）');

-- 6. 插入年化收益率配置
INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('annual_rate_daily', '0.13', '每日分成付款的年化收益率（13%）');

INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('annual_rate_weekly', '0.15', '每周分成付款的年化收益率（15%）');

INSERT OR IGNORE INTO system_config (config_key, config_value, description) 
VALUES ('annual_rate_biweekly', '0.18', '每两周分成付款的年化收益率（18%）');

-- 7. 创建索引
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);


