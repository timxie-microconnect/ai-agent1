-- 添加筛子评分结果字段到projects表
-- migrations/0009_add_sieve_score_fields.sql

ALTER TABLE projects ADD COLUMN sieve_score REAL;  -- 筛子总分（0-100）
ALTER TABLE projects ADD COLUMN sieve_score_details TEXT;  -- JSON格式的详细评分数据

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_projects_sieve_score ON projects(sieve_score);
