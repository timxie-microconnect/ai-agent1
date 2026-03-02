-- 创建挂牌信息表
CREATE TABLE IF NOT EXISTS listing_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  
  -- 挂牌主体工商信息
  company_name TEXT,
  registration_number TEXT,
  registered_address TEXT,
  establishment_date TEXT,
  business_format TEXT,
  business_intro TEXT,
  business_scope TEXT,
  
  -- 法定代表人
  legal_rep_name TEXT,
  legal_rep_id_type TEXT,
  legal_rep_id_number TEXT,
  legal_rep_address TEXT,
  legal_rep_email TEXT,
  legal_rep_phone TEXT,
  
  -- 实控人
  actual_controller_name TEXT,
  actual_controller_id_type TEXT,
  actual_controller_id_number TEXT,
  actual_controller_address TEXT,
  actual_controller_email TEXT,
  actual_controller_phone TEXT,
  
  -- 实益拥有人
  beneficial_owner_name TEXT,
  beneficial_owner_id_type TEXT,
  beneficial_owner_id_number TEXT,
  beneficial_owner_address TEXT,
  beneficial_owner_email TEXT,
  beneficial_owner_phone TEXT,
  
  -- 准入条件
  condition_1 TEXT,
  condition_1_note TEXT,
  condition_2 TEXT,
  condition_2_note TEXT,
  condition_3 TEXT,
  condition_4 TEXT,
  condition_5 TEXT,
  
  -- 企业预计营收信息
  revenue_2026 TEXT,
  revenue_2027 TEXT,
  revenue_2028 TEXT,
  revenue_2029 TEXT,
  
  -- 授权人信息
  authorizer_name TEXT,
  authorizer_id_type TEXT,
  authorizer_id_number TEXT,
  authorizer_address TEXT,
  authorizer_email TEXT,
  authorizer_phone TEXT,
  
  -- 元数据
  is_submitted BOOLEAN DEFAULT 0,
  submitted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_listing_info_project_id ON listing_info(project_id);
CREATE INDEX IF NOT EXISTS idx_listing_info_submitted ON listing_info(is_submitted);
