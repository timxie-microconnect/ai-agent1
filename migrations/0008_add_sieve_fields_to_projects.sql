-- 迁移文件：添加筛子系统准入字段到projects表
-- migrations/0008_add_sieve_fields_to_projects.sql

-- 添加筛子系统准入字段（其他字段已经存在）
ALTER TABLE projects ADD COLUMN admission_result TEXT;  -- '可评分' 或 '未准入/不通过'
ALTER TABLE projects ADD COLUMN admission_details TEXT;  -- JSON格式准入详情

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_projects_admission_result ON projects(admission_result);
