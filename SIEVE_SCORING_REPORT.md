# 抖店投流融资准入筛子 + 智能评分系统 - 实施报告

## 📊 项目概述

本次升级将原有的"31个品类、5个维度评分"系统，重构为**"1487个二级类目、4个筛子指标准入+评分"**的专业化融资审核系统。

### 核心变化

| 维度 | 升级前 | 升级后 | 说明 |
|------|--------|--------|------|
| 评分字段 | ROI、退货率、利润率、店铺评分、运营时长 | **净成交ROI、14日结算ROI、14日订单结算率、历史消耗额** | 4个新筛子指标 |
| 类目结构 | 48个一级类目（扁平） | **13个主营类目 → 111个一级类目 → 1393个二级类目** | 三级层级 |
| 阈值数量 | 48 × 5 = 240条 | **1487条二级类目精确阈值** | 精确到二级类目 |
| 兜底机制 | 无 | **一级兜底、主营兜底**（取最严格阈值） | 支持不选二级 |
| 准入逻辑 | 无 | **四项阈值全部满足才准入** | 硬性门槛 |
| 评分算法 | 线性 | **边际递减（方案A-回款安全优先）** | 提升幅度映射0-100 |
| 前端交互 | 长列表滚动 | **三级级联+搜索+拼音** | 1487个类目可快速定位 |

## ✅ 已完成工作

### 1. 数据库设计与数据导入 ✅

**新增表结构：**
- `category_thresholds`：1487行三级类目阈值表
- `threshold_versions`：阈值版本管理表
- `scoring_rules`：评分规则配置表（方案A默认规则）
- `category_search_index`：类目搜索索引表（拼音+模糊搜索）

**扩展表结构：**
- `projects`表：新增8个筛子字段列
  - `main_category`, `level1_category`, `level2_category`
  - `net_roi`, `settle_roi`, `settle_rate`, `history_spend`
  - `is_admitted`, `not_admitted_reason`, `threshold_level`

- `scoring_results`表：新增20个筛子评分字段列
  - 4个子分：`*_score`
  - 4个实际值：`*_actual`
  - 4个阈值：`*_threshold`
  - 4个提升幅度：`*_uplift`
  - 元数据：`threshold_level`, `scoring_rule_id`, `is_admitted`

**数据导入：**
- ✅ 成功导入1487行阈值数据
- ✅ 13个主营类目
- ✅ 111个一级类目
- ✅ 1393个二级类目（去重）

**迁移脚本：**
- `migrations/0006_sieve_scoring_system.sql`（表结构）
- `migrations/0007_import_thresholds_data.sql`（1487行数据）

### 2. 后端API实现 ✅

**文件：**`src/api-sieve.ts`

**核心API（4个端点）：**

1. **GET `/api/sieve/categories/tree`**
   - 获取三级类目树结构（用于级联选择器）
   - 返回：主营类目 → 一级类目 → 二级类目的完整树

2. **GET `/api/sieve/categories/search?q=女装`**
   - 搜索类目（支持中文模糊搜索）
   - 返回：匹配的类目路径列表

3. **POST `/api/sieve/categories/get-thresholds`**
   - 获取阈值（精确匹配或兜底）
   - 请求体：`{ main_category, level1_category?, level2_category? }`
   - 兜底规则：
     - 选了二级：精确匹配二级阈值
     - 只选一级：取该一级下所有二级的 MAX(阈值)
     - 只选主营：取该主营下所有二级的 MAX(阈值)
   - 返回：`{ net_roi_min, settle_roi_min, settle_rate_min, history_spend_min, threshold_level }`

4. **POST `/api/sieve/check-admission`**
   - 准入检查（四项指标）
   - 请求体：类目 + 实际值
   - 返回：`{ is_admitted, checks, reasons, thresholds }`

### 3. 评分算法实现 ✅

**文件：**`src/scoring-sieve.ts`

**核心函数：**
```typescript
calculateSieveScore(actual, thresholds, rule): ScoringResult
```

**算法逻辑：**

1. **提升幅度计算（标准化，跨类目可比）**
   - 净成交ROI：`u_net = max(0, actual/min - 1)`
   - 14日结算ROI：`u_settle = max(0, actual/min - 1)`
   - 14日结算率：`u_sr = max(0, (actual-min)/(1-min))`（剩余空间标准化）
   - 历史消耗额：`u_spend = max(0, log10(actual/min))`（对数压缩）

2. **子分映射（边际递减，0-100）**
   - `Score(u, k) = 100 * (1 - exp(-k * u))`
   - k值可配置（默认：3, 4, 4, 1.5）

3. **加权总分（方案A权重）**
   - 净成交ROI：20%
   - 14日结算ROI：35%
   - 14日订单结算率：30%
   - 历史消耗额：15%
   - 总分 = 0.20×S_net + 0.35×S_settle + 0.30×S_sr + 0.15×S_spend

4. **返回结果**
   - `total_score`：总分（0-100，保留1位小数）
   - 4个子分、4个提升幅度
   - `details`：详细评分说明（文本）

### 4. 默认评分规则配置 ✅

已写入数据库 `scoring_rules` 表：

```sql
规则名称: 方案A-回款安全优先
权重: ROI(20%), 结算ROI(35%), 结算率(30%), 消耗额(15%)
k值: k_net=3, k_settle=4, k_sr=4, k_spend=1.5
未准入是否评分: 否（is_admitted=0则总分=0）
```

## 🚧 待实施部分

由于响应长度限制，以下部分需要继续实现：

### 5. 融资方表单重构 ⏳
- [ ] 三级级联选择器（Cascader组件）
- [ ] 搜索框（支持拼音首字母）
- [ ] 新筛子字段表单（4个数值输入框）
- [ ] 实时阈值提示（选择类目后显示要求）
- [ ] 前端兜底规则提示

### 6. 后台配置管理页重构 ⏳
- [ ] 阈值管理表格（1487行可编辑）
- [ ] 搜索+三级筛选
- [ ] Excel/CSV批量导入
- [ ] 版本管理（回滚功能）
- [ ] 打分规则配置界面（权重+k值可调）

### 7. 项目列表与详情页改造 ⏳
- [ ] 列表新增列：类目路径、准入状态、总分
- [ ] 详情弹窗：显示4项指标+提升幅度+子分
- [ ] 未准入原因显示（红色警告）
- [ ] 评分依据展示（阈值版本、兜底层级）
- [ ] "重新评分"按钮（使用新算法）

### 8. 评分流程集成 ⏳
- [ ] 项目提交时自动调用 `/check-admission`
- [ ] 准入通过才调用 `calculateSieveScore`
- [ ] 评分结果保存到 `scoring_results` 表
- [ ] 工作流状态更新（待评分→已评分→审批中）

## 📝 快速集成指南

### 在主应用中集成筛子API

**`src/index.tsx`（主文件）：**
```typescript
import { Hono } from 'hono'
import sieveAPI from './api-sieve'  // 筛子API
import { calculateSieveScore, DEFAULT_SCORING_RULE } from './scoring-sieve'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

// 挂载筛子API路由
app.route('/api/sieve', sieveAPI)

// 项目提交端点（集成准入+评分）
app.post('/api/projects', async (c) => {
  const data = await c.req.json()
  const db = c.env.DB
  
  // 1. 调用准入检查
  const admissionRes = await app.fetch(
    new Request(new URL('/api/sieve/check-admission', c.req.url).toString(), {
      method: 'POST',
      body: JSON.stringify({
        main_category: data.main_category,
        level1_category: data.level1_category,
        level2_category: data.level2_category,
        net_roi: data.net_roi,
        settle_roi: data.settle_roi,
        settle_rate: data.settle_rate,
        history_spend: data.history_spend
      })
    }),
    c.env
  )
  const admission = await admissionRes.json() as any
  
  // 2. 插入项目记录
  const projectResult = await db.prepare(`
    INSERT INTO projects (
      user_id, company_name,
      main_category, level1_category, level2_category,
      net_roi, settle_roi, settle_rate, history_spend,
      is_admitted, not_admitted_reason, threshold_level,
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    data.user_id, data.company_name,
    data.main_category, data.level1_category, data.level2_category,
    data.net_roi, data.settle_roi, data.settle_rate, data.history_spend,
    admission.data.is_admitted ? 1 : 0,
    admission.data.reasons.join('; '),
    admission.data.threshold_level,
    admission.data.is_admitted ? 'pending_score' : 'not_admitted'
  ).run()
  
  const projectId = projectResult.meta.last_row_id
  
  // 3. 如果准入通过，计算评分
  if (admission.data.is_admitted) {
    const scoreResult = calculateSieveScore(
      {
        net_roi: data.net_roi,
        settle_roi: data.settle_roi,
        settle_rate: data.settle_rate,
        history_spend: data.history_spend
      },
      admission.data.thresholds,
      DEFAULT_SCORING_RULE
    )
    
    // 保存评分结果
    await db.prepare(`
      INSERT INTO scoring_results (
        project_id,
        total_score, passed, is_admitted,
        net_roi_score, net_roi_actual, net_roi_threshold, net_roi_uplift,
        settle_roi_score, settle_roi_actual, settle_roi_threshold, settle_roi_uplift,
        settle_rate_score, settle_rate_actual, settle_rate_threshold, settle_rate_uplift,
        history_spend_score, history_spend_actual, history_spend_threshold, history_spend_uplift,
        threshold_level, scoring_rule_id, evaluation_suggestion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      projectId,
      scoreResult.total_score, scoreResult.total_score >= 60 ? 1 : 0, 1,
      scoreResult.net_roi_score, data.net_roi, admission.data.thresholds.net_roi_min, scoreResult.net_roi_uplift,
      scoreResult.settle_roi_score, data.settle_roi, admission.data.thresholds.settle_roi_min, scoreResult.settle_roi_uplift,
      scoreResult.settle_rate_score, data.settle_rate, admission.data.thresholds.settle_rate_min, scoreResult.settle_rate_uplift,
      scoreResult.history_spend_score, data.history_spend, admission.data.thresholds.history_spend_min, scoreResult.history_spend_uplift,
      admission.data.threshold_level, 1, scoreResult.details
    ).run()
  }
  
  return c.json({ success: true, projectId })
})

export default app
```

## 🧪 测试场景

### 场景1：高分通过（水果生鲜 > 水产肉类 > 半成品菜）
```json
{
  "main_category": "水果生鲜",
  "level1_category": "水产肉类/新鲜蔬果/熟食",
  "level2_category": "半成品菜",
  "net_roi": 2.5,
  "settle_roi": 2.0,
  "settle_rate": 0.85,
  "history_spend": 500000
}
```
**预期结果：**
- 准入：✅ 通过（阈值：1.6, 1.47, 0.79, 100000）
- 总分：~85分
- 评分等级：优秀

### 场景2：低分拒绝（同类目，数值不达标）
```json
{
  "main_category": "水果生鲜",
  "level1_category": "水产肉类/新鲜蔬果/熟食",
  "level2_category": "半成品菜",
  "net_roi": 1.2,
  "settle_roi": 1.0,
  "settle_rate": 0.60,
  "history_spend": 50000
}
```
**预期结果：**
- 准入：❌ 未通过
- 原因：4项指标全部不达标
- 总分：0分（未准入不评分）

### 场景3：一级兜底（只选一级类目）
```json
{
  "main_category": "水果生鲜",
  "level1_category": "水产肉类/新鲜蔬果/熟食",
  "level2_category": null,  // 不选二级
  "net_roi": 2.0,
  "settle_roi": 1.8,
  "settle_rate": 0.82,
  "history_spend": 300000
}
```
**预期结果：**
- 使用兜底阈值：该一级下所有二级的 MAX(阈值)
- 阈值更严格（例如：1.8, 1.6, 0.85, 100000）
- 准入：取决于实际值是否满足兜底阈值

## 📚 数据库查询示例

### 查询所有主营类目
```sql
SELECT DISTINCT main_category 
FROM category_thresholds 
WHERE version = 1 AND is_active = 1
ORDER BY main_category;
```

### 查询某主营类目下的一级类目
```sql
SELECT DISTINCT level1_category
FROM category_thresholds
WHERE main_category = '水果生鲜' AND version = 1 AND is_active = 1
ORDER BY level1_category;
```

### 查询某一级类目的兜底阈值
```sql
SELECT 
  MAX(net_roi_min) as net_roi_min,
  MAX(settle_roi_min) as settle_roi_min,
  MAX(settle_rate_min) as settle_rate_min,
  100000 as history_spend_min
FROM category_thresholds
WHERE main_category = '水果生鲜' 
  AND level1_category = '水产肉类/新鲜蔬果/熟食'
  AND version = 1 AND is_active = 1;
```

### 查询某项目的评分详情
```sql
SELECT 
  p.company_name,
  p.main_category, p.level1_category, p.level2_category,
  p.is_admitted, p.not_admitted_reason, p.threshold_level,
  sr.total_score, sr.passed,
  sr.net_roi_actual, sr.net_roi_threshold, sr.net_roi_score,
  sr.settle_roi_actual, sr.settle_roi_threshold, sr.settle_roi_score,
  sr.settle_rate_actual, sr.settle_rate_threshold, sr.settle_rate_score,
  sr.history_spend_actual, sr.history_spend_threshold, sr.history_spend_score,
  sr.evaluation_suggestion
FROM projects p
LEFT JOIN scoring_results sr ON p.id = sr.project_id
WHERE p.id = ?;
```

## 🎯 下一步工作计划

1. **完成前端表单重构**（估计2-3小时）
   - 实现Cascader组件
   - 集成搜索API
   - 表单验证

2. **完成后台配置页**（估计3-4小时）
   - 阈值管理表格
   - Excel导入功能
   - 打分规则配置UI

3. **集成评分流程**（估计1-2小时）
   - 修改项目提交逻辑
   - 更新项目列表
   - 改造详情弹窗

4. **端到端测试**（估计1小时）
   - 测试10个典型场景
   - 验证兜底规则正确性
   - 检查评分算法准确性

**总估时：7-10小时**

## 📞 技术支持

如有问题，请查看：
- 数据库表结构：`migrations/0006_sieve_scoring_system.sql`
- API文档：`src/api-sieve.ts`（代码即文档）
- 评分算法：`src/scoring-sieve.ts`
- 测试数据：Excel原始文件1487行

---

**当前进度：40%**（数据库+后端API+算法完成，前端+集成待实施）  
**下次启动时优先完成：融资方表单重构**
