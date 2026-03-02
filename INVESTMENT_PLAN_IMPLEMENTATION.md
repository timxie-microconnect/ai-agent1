# 投资方案模块实现文档

## 功能概述

投资方案模块分为以下几个步骤：
1. **90天净成交数据上传** - 下载模板 → 填写 → 上传Excel
2. **投资方案设计** - 系统计算最高可联营金额 → 填写方案参数 → YITO封顶计算
3. **融资字段填写** - 其他融资相关信息（占位）

## 数据库结构

### projects表新增字段
- `daily_revenue_data` TEXT - 90天净成交数据（JSON）
- `daily_revenue_uploaded_at` DATETIME - 上传时间
- `daily_revenue_volatility` REAL - 波动率（第五个筛子指标）
- `max_investment_amount` REAL - 最高可联营金额
- `investment_amount` REAL - 联营资金总额
- `profit_share_ratio` REAL - 分成比例
- `payment_frequency` TEXT - 付款频率（daily/weekly/biweekly）
- `annual_rate` REAL - 年化收益率
- `estimated_days` INTEGER - 预计联营天数
- `total_return_amount` REAL - YITO封顶总额
- `investment_plan_created_at` DATETIME - 方案创建时间
- `financing_fields` TEXT - 融资字段（JSON）

### system_config表
- `max_partnership_days` = 60 - 最长联营期限
- `annual_rate_daily` = 0.13 - 每日付款年化13%
- `annual_rate_weekly` = 0.15 - 每周付款年化15%
- `annual_rate_biweekly` = 0.18 - 每两周付款年化18%

## API设计

### 1. 生成90天Excel模板
**GET** `/api/investment/template`
- 生成包含最近90天日期的Excel模板
- 返回文件下载

### 2. 上传90天数据
**POST** `/api/projects/:id/daily-revenue`
- 接收Excel文件
- 解析并验证数据
- 计算波动率
- 存储到数据库

### 3. 获取投资方案配置
**GET** `/api/investment/config`
- 返回系统配置（最长联营期限、年化收益率等）

### 4. 计算最高可联营金额
**POST** `/api/projects/:id/max-investment`
- 根据90天平均值 × 联营期限计算
- 返回计算结果

### 5. 创建投资方案
**POST** `/api/projects/:id/investment-plan`
- 接收：联营资金总额、分成比例、付款频率
- 计算：年化收益率、YITO封顶总额
- 存储方案

## YITO封顶公式

```
总支付金额 = 联营资金总额 × (1 + 年化收益率 × 预计联营天数 / 360)

其中：
- 年化收益率根据付款频率确定：
  - 每日：13%
  - 每周：15%
  - 每两周：18%
- 预计联营天数 = 最长联营期限（默认60天）
```

## 前端页面

### 1. /investment-plan/:id - 投资方案主页面
- 步骤1：上传90天数据
- 步骤2：投资方案设计
- 步骤3：融资字段填写
- 步骤4：提交审核

### 2. 状态流转
- `approved` → 点击"下一步" → 进入投资方案页面
- 上传90天数据 → 显示投资方案设计表单
- 填写方案 → 实时计算YITO封顶
- 提交 → 状态变为 `investment_plan_submitted`

## 实现优先级

### Phase 1 - 核心功能（当前）
- ✅ 数据库迁移
- ⏳ Excel模板生成（简化版CSV）
- ⏳ 数据上传和解析
- ⏳ 投资方案计算
- ⏳ 前端页面

### Phase 2 - 增强功能
- Excel库集成（真实Excel格式）
- 数据可视化图表
- 波动率详细分析
- 方案对比功能

### Phase 3 - 优化
- 文件上传进度条
- 数据验证增强
- 错误提示优化
- 移动端适配

## 技术选型

由于Cloudflare Workers环境限制：
- **Excel生成**: 前端使用SheetJS (xlsx)库或简化为CSV模板
- **文件上传**: 转为base64或使用multipart解析
- **数据存储**: JSON格式存储在SQLite TEXT字段

## 注意事项

1. **Excel格式**: Cloudflare Workers不支持node-xlsx等库，需要前端生成或用CSV替代
2. **文件大小**: 限制90天数据文件 < 1MB
3. **数据验证**: 必须验证日期连续性、数值有效性
4. **波动率计算**: 使用标准差/平均值作为简单波动率指标

