-- 完整升级SQL: 智能评分配置、文件上传、尽调checklist

-- 1. 改进评分配置表
DROP TABLE IF EXISTS scoring_config;
CREATE TABLE scoring_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,                -- 品类名称
  field_name TEXT NOT NULL,              -- 字段名（英文）
  field_label TEXT NOT NULL,             -- 字段标签（中文）
  field_type TEXT NOT NULL,              -- 字段类型：number/percentage/rating/months
  threshold_value REAL,                  -- 阈值
  comparison_operator TEXT DEFAULT '>=', -- 比较运算符：>=, <=, =, >, <
  max_score REAL NOT NULL,               -- 该字段最高分
  scoring_rule TEXT,                     -- 评分规则JSON（用于分段评分）
  is_required INTEGER DEFAULT 1,         -- 是否必填
  is_active INTEGER DEFAULT 1,           -- 是否启用
  display_order INTEGER DEFAULT 0,       -- 显示顺序
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 评分结果可手动修改标记
ALTER TABLE scoring_results ADD COLUMN is_manual_override INTEGER DEFAULT 0;
ALTER TABLE scoring_results ADD COLUMN manual_total_score REAL;
ALTER TABLE scoring_results ADD COLUMN override_reason TEXT;
ALTER TABLE scoring_results ADD COLUMN override_by INTEGER;
ALTER TABLE scoring_results ADD COLUMN override_at DATETIME;

-- 3. 尽调checklist表
CREATE TABLE IF NOT EXISTS due_diligence_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  section_name TEXT NOT NULL,            -- 'credit', 'traffic_data', 'other'
  section_label TEXT NOT NULL,           -- '主体信用/资质核验', '投流历史数据核验', '其他核验文件'
  notes TEXT,
  completed_by INTEGER,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- 4. 尽调文件表（已存在，确保完整）
CREATE TABLE IF NOT EXISTS due_diligence_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  checklist_id INTEGER,
  file_category TEXT NOT NULL,           -- 'credit', 'traffic_data', 'other'
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,                        -- 'image/png', 'application/pdf', etc.
  uploaded_by INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (checklist_id) REFERENCES due_diligence_checklist(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 5. 协议文件表（已存在，确保完整）
CREATE TABLE IF NOT EXISTS contract_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 6. 插入9个品类的完整评分配置（每个品类5个字段）
-- 女装
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('女装', 'roi', 'ROI(%)', 'percentage', 1.8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('女装', 'return_rate', '退货率(%)', 'percentage', 35, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('女装', 'profit_rate', '净利润率(%)', 'percentage', 15, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('女装', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('女装', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 男装
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('男装', 'roi', 'ROI(%)', 'percentage', 1.6, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('男装', 'return_rate', '退货率(%)', 'percentage', 25, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('男装', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('男装', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('男装', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 美妆
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('美妆', 'roi', 'ROI(%)', 'percentage', 2.0, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('美妆', 'return_rate', '退货率(%)', 'percentage', 30, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('美妆', 'profit_rate', '净利润率(%)', 'percentage', 20, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('美妆', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('美妆', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 食品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('食品', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('食品', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('食品', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('食品', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('食品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 日用品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('日用品', 'roi', 'ROI(%)', 'percentage', 1.4, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('日用品', 'return_rate', '退货率(%)', 'percentage', 20, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('日用品', 'profit_rate', '净利润率(%)', 'percentage', 10, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('日用品', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('日用品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 母婴
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('母婴', 'roi', 'ROI(%)', 'percentage', 2.0, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('母婴', 'return_rate', '退货率(%)', 'percentage', 25, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('母婴', 'profit_rate', '净利润率(%)', 'percentage', 18, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('母婴', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('母婴', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 家电
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家电', 'roi', 'ROI(%)', 'percentage', 1.3, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家电', 'return_rate', '退货率(%)', 'percentage', 10, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家电', 'profit_rate', '净利润率(%)', 'percentage', 8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家电', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('家电', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 家居
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('家居', 'roi', 'ROI(%)', 'percentage', 1.5, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('家居', 'return_rate', '退货率(%)', 'percentage', 15, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('家居', 'profit_rate', '净利润率(%)', 'percentage', 12, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('家居', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('家居', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 药品
INSERT INTO scoring_config (category, field_name, field_label, field_type, threshold_value, comparison_operator, max_score, scoring_rule, is_required, display_order) VALUES
('药品', 'roi', 'ROI(%)', 'percentage', 1.8, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 1),
('药品', 'return_rate', '退货率(%)', 'percentage', 5, '<=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 2),
('药品', 'profit_rate', '净利润率(%)', 'percentage', 25, '>=', 25, '{"type":"threshold","pass_score":25,"fail_score":0}', 1, 3),
('药品', 'shop_score', '店铺评分', 'rating', 3.5, '>=', 12.5, '{"type":"tiered","tiers":[{"min":4.5,"score":12.5},{"min":4.0,"score":10},{"min":3.5,"score":7.5},{"min":0,"score":0}]}', 1, 4),
('药品', 'operation_months', '运营时长(月)', 'months', 6, '>=', 12.5, '{"type":"tiered","tiers":[{"min":12,"score":12.5},{"min":6,"score":7.5},{"min":0,"score":0}]}', 1, 5);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_scoring_config_category ON scoring_config(category);
CREATE INDEX IF NOT EXISTS idx_scoring_config_active ON scoring_config(is_active);
CREATE INDEX IF NOT EXISTS idx_dd_checklist_project ON due_diligence_checklist(project_id);
CREATE INDEX IF NOT EXISTS idx_dd_files_project ON due_diligence_files(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_files_project ON contract_files(project_id);
