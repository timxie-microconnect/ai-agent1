-- Insert default users
INSERT OR IGNORE INTO users (username, password, company_name, contact_name, contact_phone, contact_email, is_admin) 
VALUES 
  ('testuser', 'test123', '测试企业有限公司', '张三', '13800138000', 'test@example.com', 0),
  ('admin', 'admin123', '系统管理员', '管理员', '13900139000', 'admin@example.com', 1);
