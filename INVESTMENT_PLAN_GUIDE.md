# 投资方案模块 - 完整实现文档

## 📊 功能概述

投资方案模块已完整实现，包含以下核心功能：

### 1. 90天净成交数据上传
- ✅ CSV模板自动生成（包含最近90天日期）
- ✅ 文件上传和数据解析
- ✅ 数据验证（90行、数值有效性）
- ✅ 波动率计算（标准差/平均值）

### 2. 投资方案设计
- ✅ 最高可联营金额计算
- ✅ YITO封顶计算器（实时显示）
- ✅ 三档年化收益率支持
- ✅ 方案保存和查询

### 3. 融资字段填写
- ⏳ 占位界面（待后续扩展）

---

## 🗄️ 数据库结构

### projects表新增字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `daily_revenue_data` | TEXT | 90天数据（JSON格式） |
| `daily_revenue_uploaded_at` | DATETIME | 上传时间 |
| `daily_revenue_volatility` | REAL | 波动率（0-1） |
| `max_investment_amount` | REAL | 最高可联营金额 |
| `investment_amount` | REAL | 联营资金总额 |
| `profit_share_ratio` | REAL | 分成比例（0-1） |
| `payment_frequency` | TEXT | 付款频率（daily/weekly/biweekly） |
| `annual_rate` | REAL | 年化收益率（0-1） |
| `estimated_days` | INTEGER | 预计联营天数 |
| `total_return_amount` | REAL | YITO封顶总额 |
| `investment_plan_created_at` | DATETIME | 方案创建时间 |
| `financing_fields` | TEXT | 融资字段（JSON，占位） |

### system_config表配置

| 配置键 | 默认值 | 说明 |
|--------|--------|------|
| `max_partnership_days` | 60 | 最长联营期限（天） |
| `annual_rate_daily` | 0.13 | 每日付款年化13% |
| `annual_rate_weekly` | 0.15 | 每周付款年化15% |
| `annual_rate_biweekly` | 0.18 | 每两周付款年化18% |

---

## 🔌 API接口

### 1. 下载CSV模板
```
GET /api/investment/template
```

**响应**: CSV文件下载
```csv
日期,净成交金额（元）
2025-12-04,
2025-12-05,
...
```

---

### 2. 获取系统配置
```
GET /api/investment/config
```

**响应**:
```json
{
  "success": true,
  "data": {
    "maxPartnershipDays": 60,
    "annualRates": {
      "daily": 0.13,
      "weekly": 0.15,
      "biweekly": 0.18
    }
  }
}
```

---

### 3. 上传90天数据
```
POST /api/investment/projects/:id/daily-revenue
```

**请求体**:
```json
{
  "data": [
    {"date": "2025-12-04", "amount": 5000},
    {"date": "2025-12-05", "amount": 5200},
    ...
  ]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "count": 90,
    "average": 5100.50,
    "volatility": 12.34,
    "standardDeviation": 629.81
  }
}
```

---

### 4. 计算最高可联营金额
```
POST /api/investment/projects/:id/max-investment
```

**请求体**:
```json
{
  "profitShareRatio": 0.15
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "avgDailyRevenue": 5100.50,
    "maxPartnershipDays": 60,
    "profitShareRatio": 0.15,
    "maxInvestmentAmount": 45904.50
  }
}
```

**计算公式**:
```
最高可联营金额 = 平均每日净成交 × 联营期限 × 分成比例
             = 5100.50 × 60 × 0.15
             = 45904.50
```

---

### 5. 创建投资方案
```
POST /api/investment/projects/:id/investment-plan
```

**请求体**:
```json
{
  "investmentAmount": 40000,
  "paymentFrequency": "daily"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "investmentAmount": 40000,
    "paymentFrequency": "daily",
    "annualRate": 0.13,
    "estimatedDays": 60,
    "totalReturnAmount": 40866.67,
    "paymentsCount": 60,
    "paymentAmount": 681.11
  }
}
```

**YITO封顶公式**:
```
总支付金额 = 联营资金总额 × (1 + 年化收益率 × 预计联营天数 / 360)
          = 40000 × (1 + 0.13 × 60 / 360)
          = 40000 × 1.02167
          = 40866.67
```

---

### 6. 获取投资方案详情
```
GET /api/investment/projects/:id/investment-plan
```

**响应**:
```json
{
  "success": true,
  "data": {
    "hasRevenueData": true,
    "revenueDataUploadedAt": "2026-03-02 10:30:00",
    "volatility": 0.1234,
    "maxInvestmentAmount": 45904.50,
    "investmentAmount": 40000,
    "profitShareRatio": 0.15,
    "paymentFrequency": "daily",
    "annualRate": 0.13,
    "estimatedDays": 60,
    "totalReturnAmount": 40866.67,
    "investmentPlanCreatedAt": "2026-03-02 11:00:00"
  }
}
```

---

## 🎨 前端页面

### 访问路径（待集成）
```
/investment-plan/:projectId
```

### 页面结构

#### 步骤1：上传90天数据
- 下载CSV模板按钮
- 文件上传区域（支持拖拽）
- 上传进度提示
- 数据统计显示（平均值、波动率）

#### 步骤2：投资方案设计
- 分成比例输入（计算最高可联营金额）
- 最高可联营金额显示（紫色卡片）
- 投资方案表单：
  - 联营资金总额输入
  - 分成付款频率选择
- YITO计算器（实时显示）：
  - 年化成本
  - 每日分成支出
  - 预计联营天数
  - 总支付金额（封顶）
  - YITO公式展示

#### 步骤3：融资字段填写
- 占位界面
- 最终提交按钮

---

## 📐 计算公式详解

### 1. 波动率计算
```
波动率 = 标准差 / 平均值

标准差 = √(Σ(xi - x̄)² / n)

其中：
- xi: 第i天的净成交金额
- x̄: 90天平均净成交金额
- n: 90
```

### 2. 最高可联营金额
```
最高可联营金额 = 平均每日净成交 × 联营期限 × 分成比例

示例：
平均每日净成交 = 5000元
联营期限 = 60天
分成比例 = 15%
最高可联营金额 = 5000 × 60 × 0.15 = 45000元
```

### 3. YITO封顶总额
```
总支付金额 = 联营资金总额 × (1 + 年化收益率 × 预计联营天数 / 360)

示例（每日付款，年化13%）：
联营资金 = 40000元
年化率 = 13%
天数 = 60天
总支付额 = 40000 × (1 + 0.13 × 60 / 360)
         = 40000 × 1.02167
         = 40866.67元
```

### 4. 每次付款金额
```
每次付款 = 总支付金额 / 付款次数

付款次数：
- 每日：60次（60天）
- 每周：9次（60天/7，向上取整）
- 每两周：5次（60天/14，向上取整）
```

---

## 🔧 使用流程

### 融资方操作流程

1. **审批通过后**
   - 在用户仪表盘看到"审批通过"状态
   - 点击"下一步"按钮
   - 进入投资方案页面

2. **步骤1：上传90天数据**
   ```
   1. 点击"下载CSV模板"
   2. 用Excel打开模板
   3. 填写每日净成交金额（90行）
   4. 保存为CSV或Excel
   5. 上传文件
   6. 系统自动验证和计算波动率
   ```

3. **步骤2：设计投资方案**
   ```
   1. 输入分成比例（如15%）
   2. 点击"计算最高可联营金额"
   3. 系统显示最高金额（紫色卡片）
   4. 填写"联营资金总额"（不超过最高金额）
   5. 选择"分成付款频率"
   6. 实时查看YITO计算结果
   7. 点击"保存投资方案"
   ```

4. **步骤3：融资字段填写**
   ```
   1. 填写其他融资相关信息（暂时占位）
   2. 点击"提交投资方案"
   3. 等待管理员审核
   ```

---

## 🧪 测试示例

### 测试数据准备

```bash
# 1. 下载CSV模板
curl -O http://localhost:3000/api/investment/template

# 2. 手动填写或用脚本生成测试数据
# （在Excel中填写或用Python/Node.js生成90行数据）

# 3. 测试上传（需要项目ID）
# 假设项目ID = 22
```

### 测试API

```bash
# 1. 获取配置
curl http://localhost:3000/api/investment/config | jq '.'

# 2. 模拟上传数据（简化）
curl -X POST http://localhost:3000/api/investment/projects/22/daily-revenue \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"date": "2025-12-04", "amount": 5000},
      {"date": "2025-12-05", "amount": 5200}
      // ... 共90行
    ]
  }' | jq '.'

# 3. 计算最高可联营金额
curl -X POST http://localhost:3000/api/investment/projects/22/max-investment \
  -H "Content-Type: application/json" \
  -d '{"profitShareRatio": 0.15}' | jq '.'

# 4. 创建投资方案
curl -X POST http://localhost:3000/api/investment/projects/22/investment-plan \
  -H "Content-Type: application/json" \
  -d '{
    "investmentAmount": 40000,
    "paymentFrequency": "daily"
  }' | jq '.'

# 5. 获取方案详情
curl http://localhost:3000/api/investment/projects/22/investment-plan | jq '.'
```

---

## ⚙️ 管理员配置

### 修改联营期限
```sql
-- 修改为90天
UPDATE system_config 
SET config_value = '90' 
WHERE config_key = 'max_partnership_days';
```

### 修改年化收益率
```sql
-- 修改每日付款年化为15%
UPDATE system_config 
SET config_value = '0.15' 
WHERE config_key = 'annual_rate_daily';

-- 修改每周付款年化为18%
UPDATE system_config 
SET config_value = '0.18' 
WHERE config_key = 'annual_rate_weekly';

-- 修改每两周付款年化为20%
UPDATE system_config 
SET config_value = '0.20' 
WHERE config_key = 'annual_rate_biweekly';
```

---

## 📝 后续集成任务

### 待完成事项

1. **前端集成** ⏳
   - [ ] 在 app.js 中添加路由 `/investment-plan/:id`
   - [ ] 在用户仪表盘添加"下一步"按钮
   - [ ] 加载 investment-plan.js 脚本

2. **状态流转** ⏳
   - [ ] `approved` → 显示"下一步"
   - [ ] 创建投资方案后 → 状态变为 `investment_plan_submitted`
   - [ ] 管理员后台显示投资方案详情

3. **增强功能** 🔮
   - [ ] Excel模板生成（替代CSV）
   - [ ] 数据可视化图表（90天趋势）
   - [ ] 波动率详细分析
   - [ ] 多方案对比功能

4. **优化** 🎨
   - [ ] 文件上传进度条
   - [ ] 数据验证增强（日期连续性）
   - [ ] 错误提示优化
   - [ ] 移动端适配

---

## 🎯 核心文件清单

### 后端
- `src/api-investment.ts` - 投资方案API模块（251行）
- `src/index.tsx` - 主应用（已添加投资API路由）
- `migrations/0011_investment_plan.sql` - 数据库迁移

### 前端
- `public/static/investment-plan.js` - 投资方案页面（672行）
- `public/static/app.js` - 主应用（待添加路由）

### 文档
- `INVESTMENT_PLAN_IMPLEMENTATION.md` - 实现文档
- 本文档 - 使用指南

---

## 📞 问题排查

### CSV模板为空
- 检查日期生成逻辑
- 确认today日期正确

### 上传失败
- 检查数据格式（90行）
- 确认数值为有效数字
- 查看浏览器控制台错误

### YITO计算错误
- 验证年化收益率配置
- 检查联营天数设置
- 确认公式实现正确

### API调用失败
- 检查项目ID是否存在
- 确认数据库字段已迁移
- 查看服务器日志

---

**文档版本**: v1.0  
**创建时间**: 2026-03-02  
**作者**: AI Assistant  
**状态**: ✅ 核心功能完成，待前端集成
