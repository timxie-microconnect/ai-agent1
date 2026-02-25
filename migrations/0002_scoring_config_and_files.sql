-- 评分配置表 (scoring_config)
CREATE TABLE IF NOT EXISTS scoring_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'number', 'select', 'date', etc.
  is_scoring_field INTEGER DEFAULT 1,
  weight REAL DEFAULT 0, -- 该字段的权重/满分
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 评分标准表 (scoring_standards)
CREATE TABLE IF NOT EXISTS scoring_standards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL, -- 品类名称
  field_name TEXT NOT NULL, -- 对应的字段名
  comparison_type TEXT NOT NULL, -- '>=' '>  ' '<=' '<' '=='
  threshold_value REAL NOT NULL, -- 阈值
  score_if_met REAL NOT NULL, -- 达标得分
  score_if_not_met REAL DEFAULT 0, -- 不达标得分
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 尽调文件表 (due_diligence_files)
CREATE TABLE IF NOT EXISTS due_diligence_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  file_category TEXT NOT NULL, -- 'credit', 'traffic_data', 'other'
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 协议文件表 (contract_files)
CREATE TABLE IF NOT EXISTS contract_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 插入默认评分字段配置
INSERT INTO scoring_config (field_name, field_label, field_type, is_scoring_field, weight, display_order) VALUES
  ('roi', '投流ROI(%)', 'number', 1, 25, 1),
  ('returnRate', '退货率(%)', 'number', 1, 25, 2),
  ('profitRate', '净利润率(%)', 'number', 1, 25, 3),
  ('shopScore', '店铺评分(1-5)', 'number', 1, 12.5, 4),
  ('operationMonths', '运营时间(月)', 'number', 1, 12.5, 5);

-- 插入默认评分标准（美妆类示例）
INSERT INTO scoring_standards (category, field_name, comparison_type, threshold_value, score_if_met, score_if_not_met) VALUES
  ('美妆', 'roi', '>=', 2.0, 25, 0),
  ('美妆', 'returnRate', '<=', 30, 25, 0),
  ('美妆', 'profitRate', '>=', 20, 25, 0),
  ('美妆', 'shopScore', '>=', 4.5, 12.5, 0),
  ('美妆', 'shopScore', '>=', 4.0, 10, 0),
  ('美妆', 'shopScore', '>=', 3.5, 7.5, 0),
  ('美妆', 'operationMonths', '>=', 12, 12.5, 0),
  ('美妆', 'operationMonths', '>=', 6, 7.5, 0);

-- 为其他品类插入标准（女装、男装等）
INSERT INTO scoring_standards (category, field_name, comparison_type, threshold_value, score_if_met, score_if_not_met) VALUES
  ('女装', 'roi', '>=', 1.8, 25, 0),
  ('女装', 'returnRate', '<=', 35, 25, 0),
  ('女装', 'profitRate', '>=', 15, 25, 0),
  ('女装', 'shopScore', '>=', 3.5, 7.5, 0),
  ('女装', 'operationMonths', '>=', 6, 7.5, 0);

CREATE INDEX IF NOT EXISTS idx_scoring_config_active ON scoring_config(is_active);
CREATE INDEX IF NOT EXISTS idx_scoring_standards_category ON scoring_standards(category);
CREATE INDEX IF NOT EXISTS idx_due_diligence_project ON due_diligence_files(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_files_project ON contract_files(project_id);
