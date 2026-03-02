-- 抖店投流垫资准入筛子 + 智能评分系统
-- 数据库迁移脚本 v0006

-- ============================================
-- 1. 三级类目阈值表（1487行数据）
-- ============================================
DROP TABLE IF EXISTS category_thresholds;
CREATE TABLE category_thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  main_category TEXT NOT NULL,              -- 主营类目
  level1_category TEXT NOT NULL,            -- 一级类目
  level2_category TEXT NOT NULL,            -- 二级类目
  
  -- 四个准入阈值
  net_roi_min REAL NOT NULL,                -- 净成交ROI最低值
  settle_roi_min REAL NOT NULL,             -- 14日结算ROI最低值
  settle_rate_min REAL NOT NULL,            -- 14日订单结算率最低值（0-1小数）
  history_spend_min INTEGER NOT NULL DEFAULT 100000, -- 历史消耗额最低值（固定10万）
  
  -- 元数据
  is_active INTEGER DEFAULT 1,              -- 是否启用
  version INTEGER DEFAULT 1,                -- 版本号
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 唯一约束：同一版本下，三级类目唯一
  UNIQUE(main_category, level1_category, level2_category, version)
);

-- 索引
CREATE INDEX idx_cat_thresh_main ON category_thresholds(main_category, is_active);
CREATE INDEX idx_cat_thresh_level1 ON category_thresholds(level1_category, is_active);
CREATE INDEX idx_cat_thresh_level2 ON category_thresholds(level2_category, is_active);
CREATE INDEX idx_cat_thresh_version ON category_thresholds(version, is_active);

-- ============================================
-- 2. 评分规则配置表
-- ============================================
DROP TABLE IF EXISTS scoring_rules;
CREATE TABLE scoring_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL UNIQUE,           -- 规则名称（如"方案A-回款安全优先"）
  
  -- 权重（四项合计必须=100）
  weight_net_roi REAL NOT NULL DEFAULT 20,          -- 净成交ROI权重%
  weight_settle_roi REAL NOT NULL DEFAULT 35,       -- 14日结算ROI权重%
  weight_settle_rate REAL NOT NULL DEFAULT 30,      -- 14日结算率权重%
  weight_history_spend REAL NOT NULL DEFAULT 15,    -- 历史消耗额权重%
  
  -- 加分曲线参数（k值）
  k_net_roi REAL NOT NULL DEFAULT 3,                -- 净成交ROI边际递减系数
  k_settle_roi REAL NOT NULL DEFAULT 4,             -- 14日结算ROI边际递减系数
  k_settle_rate REAL NOT NULL DEFAULT 4,            -- 14日结算率边际递减系数
  k_history_spend REAL NOT NULL DEFAULT 1.5,        -- 历史消耗额边际递减系数
  
  -- 其他配置
  allow_score_if_not_admitted INTEGER DEFAULT 0,    -- 未准入是否允许评分（0=不允许）
  is_active INTEGER DEFAULT 1,                      -- 是否启用
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认规则（方案A）
INSERT INTO scoring_rules (
  rule_name, 
  weight_net_roi, weight_settle_roi, weight_settle_rate, weight_history_spend,
  k_net_roi, k_settle_roi, k_settle_rate, k_history_spend,
  allow_score_if_not_admitted, is_active
) VALUES (
  '方案A-回款安全优先',
  20, 35, 30, 15,
  3, 4, 4, 1.5,
  0, 1
);

-- ============================================
-- 3. 项目表扩展（新增筛子字段）
-- ============================================

-- 新增筛子字段列
ALTER TABLE projects ADD COLUMN main_category TEXT;              -- 主营类目
ALTER TABLE projects ADD COLUMN level1_category TEXT;            -- 一级类目
ALTER TABLE projects ADD COLUMN level2_category TEXT;            -- 二级类目

ALTER TABLE projects ADD COLUMN net_roi REAL;                    -- 净成交ROI
ALTER TABLE projects ADD COLUMN settle_roi REAL;                 -- 14日结算ROI
ALTER TABLE projects ADD COLUMN settle_rate REAL;                -- 14日订单结算率（0-1）
ALTER TABLE projects ADD COLUMN history_spend INTEGER;           -- 历史消耗额

ALTER TABLE projects ADD COLUMN is_admitted INTEGER DEFAULT 0;   -- 是否通过准入（0=未通过，1=通过）
ALTER TABLE projects ADD COLUMN not_admitted_reason TEXT;        -- 未通过准入原因
ALTER TABLE projects ADD COLUMN threshold_level TEXT;            -- 使用的阈值层级（level2/level1_fallback/main_fallback）

-- ============================================
-- 4. 评分结果表扩展
-- ============================================

-- 清空旧评分结果（因为字段变化）
DELETE FROM scoring_results;

-- 新增筛子评分字段
ALTER TABLE scoring_results ADD COLUMN net_roi_score REAL DEFAULT 0;           -- 净成交ROI子分
ALTER TABLE scoring_results ADD COLUMN settle_roi_score REAL DEFAULT 0;        -- 14日结算ROI子分
ALTER TABLE scoring_results ADD COLUMN settle_rate_score REAL DEFAULT 0;       -- 14日结算率子分
ALTER TABLE scoring_results ADD COLUMN history_spend_score REAL DEFAULT 0;     -- 历史消耗额子分

ALTER TABLE scoring_results ADD COLUMN net_roi_actual REAL;                    -- 实际净成交ROI
ALTER TABLE scoring_results ADD COLUMN net_roi_threshold REAL;                 -- 阈值净成交ROI
ALTER TABLE scoring_results ADD COLUMN net_roi_uplift REAL;                    -- 提升幅度u

ALTER TABLE scoring_results ADD COLUMN settle_roi_actual REAL;                 -- 实际14日结算ROI
ALTER TABLE scoring_results ADD COLUMN settle_roi_threshold REAL;              -- 阈值14日结算ROI
ALTER TABLE scoring_results ADD COLUMN settle_roi_uplift REAL;                 -- 提升幅度u

ALTER TABLE scoring_results ADD COLUMN settle_rate_actual REAL;                -- 实际14日结算率
ALTER TABLE scoring_results ADD COLUMN settle_rate_threshold REAL;             -- 阈值14日结算率
ALTER TABLE scoring_results ADD COLUMN settle_rate_uplift REAL;                -- 提升幅度u

ALTER TABLE scoring_results ADD COLUMN history_spend_actual INTEGER;           -- 实际历史消耗额
ALTER TABLE scoring_results ADD COLUMN history_spend_threshold INTEGER;        -- 阈值历史消耗额
ALTER TABLE scoring_results ADD COLUMN history_spend_uplift REAL;              -- 提升幅度u（对数）

ALTER TABLE scoring_results ADD COLUMN threshold_level TEXT;                   -- 阈值层级
ALTER TABLE scoring_results ADD COLUMN scoring_rule_id INTEGER;                -- 使用的评分规则ID
ALTER TABLE scoring_results ADD COLUMN is_admitted INTEGER DEFAULT 0;          -- 是否通过准入

-- ============================================
-- 5. 版本管理表（阈值版本控制）
-- ============================================
DROP TABLE IF EXISTS threshold_versions;
CREATE TABLE threshold_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,          -- 版本号
  description TEXT,                         -- 版本描述
  import_source TEXT,                       -- 导入来源（file/manual/api）
  import_file_name TEXT,                    -- 导入文件名
  record_count INTEGER DEFAULT 0,           -- 记录数量
  is_active INTEGER DEFAULT 0,              -- 是否当前生效版本（只能有一个=1）
  created_by INTEGER,                       -- 创建人ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 插入初始版本
INSERT INTO threshold_versions (version, description, import_source, record_count, is_active)
VALUES (1, '初始版本-筛子评分规则大表', 'file', 0, 1);

-- ============================================
-- 6. 类目搜索辅助表（拼音+模糊搜索）
-- ============================================
DROP TABLE IF EXISTS category_search_index;
CREATE TABLE category_search_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  main_category TEXT NOT NULL,
  level1_category TEXT NOT NULL,
  level2_category TEXT NOT NULL,
  
  -- 拼音首字母
  main_pinyin TEXT,
  level1_pinyin TEXT,
  level2_pinyin TEXT,
  
  -- 全拼
  main_full_pinyin TEXT,
  level1_full_pinyin TEXT,
  level2_full_pinyin TEXT,
  
  -- 搜索关键词（空格分隔）
  search_keywords TEXT,
  
  UNIQUE(main_category, level1_category, level2_category)
);

CREATE INDEX idx_cat_search_main ON category_search_index(main_category);
CREATE INDEX idx_cat_search_level1 ON category_search_index(level1_category);
CREATE INDEX idx_cat_search_level2 ON category_search_index(level2_category);
CREATE INDEX idx_cat_search_keywords ON category_search_index(search_keywords);
