# 数据库访问指南

## 本地数据库位置

### SQLite 文件路径
```
/home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
```

### 数据库名称
- `webapp-production` (生产数据库，本地开发用 `--local` 标志)

## 访问方式

### 1. 使用 Wrangler CLI（推荐）

#### 查询数据
```bash
cd /home/user/webapp

# 查看所有项目
npx wrangler d1 execute webapp-production --local --command="SELECT id, submission_code, project_name, main_category, admission_result, sieve_score FROM projects ORDER BY id DESC LIMIT 10"

# 查看单个项目详情
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM projects WHERE id = 16"

# 查看筛子评分结果
npx wrangler d1 execute webapp-production --local --command="SELECT id, sieve_score, sieve_score_details, admission_result FROM projects WHERE sieve_score IS NOT NULL"

# 查看类目阈值配置
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM category_thresholds WHERE main_category = '水果生鲜' LIMIT 5"

# 查看系统配置
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM sieve_system_config"
```

#### 修改数据
```bash
# 更新项目评分
npx wrangler d1 execute webapp-production --local --command="UPDATE projects SET sieve_score = NULL, sieve_score_details = NULL WHERE id = 16"

# 插入测试数据
npx wrangler d1 execute webapp-production --local --file=./test-data.sql
```

### 2. 使用 SQLite 客户端

```bash
cd /home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject

# 找到最新的数据库文件
ls -lt *.sqlite | head -1

# 使用 sqlite3 打开
sqlite3 d7e7dad26bda2eb41e10f2b5b0776873c53023ab37e537e0aca2622a0a57c851.sqlite

# 在 sqlite3 shell 中
.tables                  # 查看所有表
.schema projects         # 查看 projects 表结构
SELECT * FROM projects;  # 查询数据
.exit                    # 退出
```

### 3. 通过 API 访问（需要登录）

```bash
# 登录获取 token
TOKEN=$(curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  2>/dev/null | jq -r '.token')

# 获取所有项目
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/projects | jq '.'

# 获取单个项目
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/projects/16 | jq '.'

# 触发筛子评分
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/sieve/scoring/calculate/16 | jq '.'
```

## 常用查询

### 项目统计
```sql
-- 总项目数
SELECT COUNT(*) as total FROM projects;

-- 按准入状态统计
SELECT admission_result, COUNT(*) as count 
FROM projects 
WHERE admission_result IS NOT NULL 
GROUP BY admission_result;

-- 按主营类目统计
SELECT main_category, COUNT(*) as count, 
       AVG(sieve_score) as avg_score
FROM projects 
WHERE main_category IS NOT NULL 
GROUP BY main_category 
ORDER BY count DESC;
```

### 筛子系统数据
```sql
-- 查看阈值配置数量
SELECT COUNT(*) as total FROM category_thresholds WHERE is_active = 1;

-- 查看主营类目列表
SELECT DISTINCT main_category FROM category_thresholds 
WHERE is_active = 1 AND version = 1 
ORDER BY main_category;

-- 查看特定类目的阈值
SELECT * FROM category_thresholds 
WHERE main_category = '水果生鲜' 
  AND level1_category = '水产肉类/新鲜蔬果/熟食'
  AND level2_category = '半成品菜';
```

### 评分系统配置
```sql
-- 查看当前权重配置
SELECT config_type, config_data, updated_at 
FROM sieve_system_config 
WHERE config_type = 'weights';

-- 查看当前 k 值配置
SELECT config_type, config_data, updated_at 
FROM sieve_system_config 
WHERE config_type = 'k_values';
```

## 数据库表结构

### 主要表
1. **projects** - 项目信息
   - 基础字段：id, username, company_name, project_name
   - 筛子字段：main_category, level1_category, level2_category
   - 指标字段：net_roi, settle_roi, settle_rate, history_spend
   - 结果字段：admission_result, admission_details, sieve_score, sieve_score_details

2. **category_thresholds** - 1487条类目阈值配置
   - 类目：main_category, level1_category, level2_category
   - 阈值：net_roi_min, settle_roi_min, settle_rate_min, history_spend_min
   - 元数据：is_active, version

3. **sieve_system_config** - 筛子系统配置（权重、k值）
   - config_type: 'weights' | 'k_values'
   - config_data: JSON 字符串

4. **users** - 用户表（融资方和管理员）
5. **scoring_results** - 旧评分结果（10步表单，已弃用）
6. **workflow_history** - 工作流历史记录
7. **contract_files** - 协议文件记录

## 迁移文件

```
/home/user/webapp/migrations/
├── 0001_initial_schema.sql
├── 0002_scoring_config_and_files.sql
├── 0003_complete_upgrade.sql
├── 0004_complete_categories.sql
├── 0005_douyin_48_categories.sql
├── 0006_sieve_scoring_system.sql
├── 0007_import_thresholds_data.sql
├── 0008_add_sieve_fields_to_projects.sql
├── 0009_add_sieve_score_fields.sql
└── 0010_sieve_system_config.sql
```

## 备份与恢复

### 导出数据
```bash
cd /home/user/webapp

# 导出整个数据库
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite .dump > backup.sql

# 导出特定表
npx wrangler d1 export webapp-production --local --table=projects --output=projects.sql
```

### 导入数据
```bash
# 从 SQL 文件导入
npx wrangler d1 execute webapp-production --local --file=backup.sql
```

## 注意事项

⚠️ **本地开发始终使用 `--local` 标志！**

```bash
# ✅ 正确（本地开发）
npx wrangler d1 execute webapp-production --local --command="..."

# ❌ 错误（会操作生产数据库）
npx wrangler d1 execute webapp-production --command="..."
```

⚠️ **数据库文件会定期重新生成**

本地开发的 SQLite 文件可能在重启服务时重新生成，文件名会改变。如需持久化测试数据，请使用迁移文件或种子脚本。
