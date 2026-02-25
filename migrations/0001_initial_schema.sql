-- Users table (用户表)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table (项目表)
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  submission_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  
  -- Step 1: 主体关系
  is_same_entity TEXT,
  has_income_sharing TEXT,
  relationship_type TEXT,
  fund_usage TEXT,
  
  -- Step 2: 主体A信息
  company_name_a TEXT,
  credit_code_a TEXT,
  address_a TEXT,
  established_date_a TEXT,
  industry_a TEXT,
  introduction_a TEXT,
  business_scope_a TEXT,
  business_description_a TEXT,
  
  -- 评分字段
  product_category TEXT,
  roi REAL,
  return_rate REAL,
  profit_rate REAL,
  shop_score REAL,
  operation_months INTEGER,
  
  -- Step 3: 主体B信息
  company_name_b TEXT,
  credit_code_b TEXT,
  address_b TEXT,
  introduction_b TEXT,
  shop_model_b TEXT,
  
  -- Step 6: 联系方式
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  wechat TEXT,
  remark TEXT,
  
  -- Step 7: 银行与开票
  bank_name TEXT,
  bank_account TEXT,
  bank_address TEXT,
  invoice_type TEXT,
  tax_id TEXT,
  invoice_address TEXT,
  invoice_phone TEXT,
  
  -- Step 9: 商业条款
  total_amount REAL,
  batch_count INTEGER,
  batch_amount REAL,
  first_amount REAL,
  subsequent_amount REAL,
  roi_target REAL,
  roi_recovery_days INTEGER,
  roi_maintain_days INTEGER,
  profit_share REAL,
  annual_rate REAL,
  repayment_frequency TEXT,
  repayment_rules TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Legal Representatives table (法定代表人)
CREATE TABLE IF NOT EXISTS legal_representatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  entity_type TEXT,
  name TEXT NOT NULL,
  id_type TEXT,
  id_number TEXT NOT NULL,
  address TEXT,
  email TEXT,
  phone TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Actual Controllers table (实控人)
CREATE TABLE IF NOT EXISTS actual_controllers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  id_type TEXT,
  id_number TEXT NOT NULL,
  address TEXT,
  email TEXT,
  phone TEXT,
  shareholding REAL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Platform Accounts table (平台账号)
CREATE TABLE IF NOT EXISTS platform_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  platform_name TEXT,
  account_description TEXT,
  has_qianchuan TEXT,
  remark TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Scoring Results table (评分结果)
CREATE TABLE IF NOT EXISTS scoring_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  roi_score REAL DEFAULT 0,
  return_rate_score REAL DEFAULT 0,
  profit_score REAL DEFAULT 0,
  shop_score_value REAL DEFAULT 0,
  operation_score REAL DEFAULT 0,
  total_score REAL DEFAULT 0,
  passed INTEGER DEFAULT 0,
  evaluation_suggestion TEXT,
  scored_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Workflow History table (工作流历史)
CREATE TABLE IF NOT EXISTS workflow_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  from_status TEXT,
  to_status TEXT,
  operator_id INTEGER,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_submission_code ON projects(submission_code);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_legal_representatives_project_id ON legal_representatives(project_id);
CREATE INDEX IF NOT EXISTS idx_actual_controllers_project_id ON actual_controllers(project_id);
CREATE INDEX IF NOT EXISTS idx_platform_accounts_project_id ON platform_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_scoring_results_project_id ON scoring_results(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_project_id ON workflow_history(project_id);
