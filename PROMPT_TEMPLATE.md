# 滴灌通·投流通网页完整创建指南
## 从零到部署的对话式 Prompt 模板

本文档提供完整的对话式 prompt，让 AI 助手从零开始创建滴灌通投流通展示网站。

---

## 📋 项目背景与核心概念

### 项目简介
滴灌通·投流通是一个双面抖音电商投流资金解决方案展示平台，基于 YITO（You Invest, Till Over）收入分成融资模式。

### 核心概念
- **YITO (You Invest, Till Over)**: 收入分成融资模式，投资方与融资方按比例分享收入直到达到约定回报上限
- **RBF (Revenue-Based Financing)**: 基于收入的融资，非股权、非债权
- **封顶机制**: 回款总额 = 本金 × (1 + 年化成本率 × 联营天数 / 360)
- **年化成本锚定**: 每日13%、每周15%、每两周18%

### 核心功能模块
1. **融资方准入评估**: 9大品类差异化标准筛选
2. **融资方计算器**: 计算融资成本、回款周期
3. **投资方计算器**: 计算投资收益、现金流预测
4. **协议预填项收集**: 生成协议草案

---

## 🎯 完整对话流程

### Prompt 1.0: 项目初始化与基础架构

```
我需要创建一个名为"滴灌通·投流通"的网页应用。这是一个抖音电商投流资金解决方案展示平台。

**项目要求：**
1. 使用 Hono 框架 + TypeScript + Cloudflare Workers
2. 前端使用 Vanilla JavaScript + Tailwind CSS (CDN)
3. 项目目录：/home/user/webapp

**核心功能需求：**

**1. 融资方计算器 (Financing Calculator)**
- 输入项：
  - 融资金额 (investmentAmount)
  - 日均GMV (dailyGMV)
  - 分成比例 (revenueSharingRate，百分比)
  - 打款频率 (paymentFrequency: 每日/每周/每两周)
  
- 年化成本自动锚定：
  - 每日打款 → 13%
  - 每周打款 → 15%
  - 每两周打款 → 18%
  
- 输出项：
  - 年化成本（锚定值）
  - 每日分成支出
  - 预计联营天数
  - 总支付金额（YITO封顶）
  - 实际融资成本金额
  - 打款方式详情

- YITO封顶计算公式：
  ```
  封顶金额 = 本金 × (1 + 年化成本率 × 联营天数 / 360)
  ```

**2. 投资方计算器 (Investor Calculator)**
- 输入项：
  - 投资金额 (investmentAmount)
  - 标的日均GMV (dailyGMV)
  - 分成比例 (revenueSharingRate)
  - 目标回报率 (targetReturnRate)
  - 回款频率 (paymentFrequency)

- 输出项：
  - 每日分成收入
  - 预计联营天数
  - 目标回收总额
  - 投资周期总收益率（非年化）
  - 总收益金额
  - 回款详情
  - 现金流时间表（前12期）

**3. 一键套用功能**
从融资方计算器一键复制数据到投资方计算器，并根据打款频率自动设定目标回报率（13%/15%/18%）。

**后端 API 要求：**
- POST /api/calculate-financing
- POST /api/calculate-investment

**页面结构：**
1. Hero 区域：滴灌通品牌介绍
2. 公司介绍：YITO模式、优势说明
3. 双计算器模块
4. 协议预填项收集区

请开始创建项目。
```

---

### Prompt 2.0: 核心计算逻辑实现

```
现在需要实现准确的计算逻辑：

**融资方计算逻辑：**
```javascript
// 1. 根据打款频率自动设定年化成本
const annualReturnRate = {
  'daily': 13,
  'weekly': 15,
  'biweekly': 18
}[paymentFrequency]

// 2. 计算每日分成
const dailyRevenue = dailyGMV * (revenueSharingRate / 100)

// 3. 循环计算直到达到封顶
let cumulativeRevenue = 0
let days = 0
const maxDays = 365 * 3  // 最多3年

while (cumulativeRevenue < investmentAmount && days < maxDays) {
  const cap = investmentAmount * (1 + (annualReturnRate / 100) * (days / 360))
  
  if (cumulativeRevenue + dailyRevenue >= cap) {
    // 达到封顶
    const finalPayment = cap - cumulativeRevenue
    cumulativeRevenue = cap
    break
  }
  
  cumulativeRevenue += dailyRevenue
  days++
}

// 4. 计算实际成本
const actualCost = cumulativeRevenue - investmentAmount
```

**投资方计算逻辑：**
```javascript
// 1. 计算目标总回收额（YITO封顶）
const yitoTarget = investmentAmount * (1 + (targetReturnRate / 100) * (days / 360))

// 2. 计算投资周期总收益率
const totalReturn = ((yitoTarget - investmentAmount) / investmentAmount) * 100

// 3. 计算总收益金额
const totalProfit = yitoTarget - investmentAmount

// 4. 生成现金流时间表
const cashFlowSchedule = []
let cumulative = 0

for (let period = 1; period <= 12 && cumulative < yitoTarget; period++) {
  const periodDays = paymentInterval
  const periodRevenue = Math.min(dailyRevenue * periodDays, yitoTarget - cumulative)
  cumulative += periodRevenue
  
  cashFlowSchedule.push({
    date: `第${period}${frequencyText}`,
    inflow: periodRevenue,
    cumulative: cumulative
  })
}
```

请更新后端 API 实现这些计算逻辑。
```

---

### Prompt 2.1: 修正显示逻辑

```
需要进行以下关键修正：

**融资方计算器修正：**
1. **删除"实际年化成本率"显示** - 这个指标容易误导，只保留锚定的年化成本（13%/15%/18%）
2. **保留"实际融资成本金额"显示** - 显示具体金额（如：¥2,500）
3. **显示YITO封顶公式** - 在结果中明确展示封顶计算公式

**投资方计算器修正：**
1. **删除"年化IRR"显示** - 短周期（10-20天）的年化IRR会爆炸式增长（如1000%+），严重误导投资者
2. **新增"投资周期总收益率"** - 显示整个投资周期的总收益率（如：12天周期，总收益率 0.60%）
3. **新增"总收益金额"** - 显示具体收益金额（如：¥3,000）
4. **保留现金流时间表** - 展示前12期的现金流情况

**修正原因：**
- 短周期投资的年化计算会产生极端数值，不符合实际业务理解
- 投资者更关心"这12天我能赚多少钱"，而不是"年化收益率多少"
- 总收益率更直观、更符合商业直觉

请修改前端和后端代码。
```

---

### Prompt 3.0: 新增融资方准入评估

```
需要在两个计算器**上方**新增"融资方准入评估"模块。

**功能需求：**

**1. 输入项（6项）：**
- 商品品类（下拉选择）：女装、男装、美妆、食品、日用品、母婴、家电、家居、药品
- 近三个月日均投流ROI（数字输入，百分比）
- 近三个月日均抖音店铺退货率（数字输入，百分比）
- 近三个月商品平均净利（数字输入，百分比）
- 抖音店铺当前评分（数字输入，1-5分）
- 店铺运营时间（数字输入，月数）

**2. 品类差异化标准：**

| 品类 | ROI标准 | 退货率上限 | 净利标准 |
|------|---------|------------|----------|
| 女装 | ≥1.8 | ≤35% | ≥15% |
| 男装 | ≥1.6 | ≤25% | ≥18% |
| 美妆 | ≥2.0 | ≤30% | ≥20% |
| 食品 | ≥1.5 | ≤15% | ≥12% |
| 日用品 | ≥1.4 | ≤20% | ≥10% |
| 母婴 | ≥2.0 | ≤25% | ≥18% |
| 家电 | ≥1.3 | ≤10% | ≥8% |
| 家居 | ≥1.5 | ≤15% | ≥12% |
| 药品 | ≥1.8 | ≤5% | ≥25% |

**3. 通用标准（所有品类）：**
- 抖音店铺当前评分 ≥ 3.5
- 店铺运营时间 ≥ 6个月

**4. 评估结果展示：**
- **通过**：绿色提示框，显示所有指标达标
- **不通过**：红色提示框，列出所有未达标项和建议
- 通过后智能引导进入融资方计算器

**5. 后端API：**
```
POST /api/check-qualification

输入：
{
  "category": "美妆",
  "avgROI": 2.5,
  "avgReturnRate": 25,
  "avgNetProfit": 22,
  "shopRating": 4.5,
  "operatingMonths": 12
}

输出：
{
  "qualified": true,
  "checks": {
    "roi": { "passed": true, "value": 2.5, "standard": 2.0 },
    "returnRate": { "passed": true, "value": 25, "standard": 30 },
    "netProfit": { "passed": true, "value": 22, "standard": 20 },
    "shopRating": { "passed": true, "value": 4.5, "standard": 3.5 },
    "operatingMonths": { "passed": true, "value": 12, "standard": 6 }
  },
  "message": "恭喜！您的店铺符合准入标准！"
}
```

**6. UI设计要求：**
- 使用绿色主题（与融资方计算器区分）
- 卡片式布局，表单清晰
- 品类标准对照表展示
- 评估按钮明显
- 结果动画效果

请实现这个模块。
```

---

### Prompt 4.0: 修复协议下载功能

```
协议预填项收集模块存在问题：

**问题1：字段ID不匹配**
- HTML 使用 partner_company_name
- JavaScript 使用 ag_company_name
- 导致"生成协议草案"按钮无响应

**问题2：缺少下载功能**
- 只有预览，无法下载

**修复需求：**

**1. 统一字段ID：**
请检查 HTML 表单和 JavaScript 代码，确保所有字段ID一致：
- agency_company_name
- agency_credit_code
- agency_legal_rep
- partner_company_name
- partner_credit_code
- partner_legal_rep
- total_investment
- revenue_sharing_rate
- payment_frequency
- annual_return_rate
- (其他所有字段...)

**2. 新增下载功能：**
```javascript
// 生成协议内容
const agreementText = `
滴灌通·投流通联营协议

一、联营方信息
企业名称：${data.agency_company_name}
统一社会信用代码：${data.agency_credit_code}
法定代表人：${data.agency_legal_rep}
...

二、合作方信息
...

三、联营资金安排
联营资金总额：¥${data.total_investment}
分成比例：${data.revenue_sharing_rate}%
打款频率：${data.payment_frequency}
年化成本：${data.annual_return_rate}%

四、YITO封顶机制
封顶金额 = ${data.total_investment} × (1 + ${data.annual_return_rate}% × 联营天数 / 360)
累计分成达到封顶金额时，自动终止分成。

...
`

// 创建下载链接
const blob = new Blob([agreementText], { type: 'text/plain;charset=utf-8' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `滴灌通联营协议_${data.agency_company_name}_${new Date().toISOString().split('T')[0]}.txt`
a.click()
URL.revokeObjectURL(url)
```

**3. 新增按钮：**
- "预览协议" - 弹窗显示
- "下载协议草案" - 下载 .txt 文件

请修复这些问题。
```

---

### Prompt 5.0: GitHub 部署

```
现在需要将代码保存到 GitHub。

**操作步骤：**

1. 首先调用 setup_github_environment 配置 GitHub 认证
2. 初始化 Git 仓库（如果未初始化）
3. 创建 .gitignore 文件（排除 node_modules、.env 等）
4. 提交所有更改
5. 推送到 GitHub

**Git 操作：**
```bash
# 初始化
cd /home/user/webapp
git init
git add .
git commit -m "Initial commit: 滴灌通投流通完整版"

# 配置远程仓库（使用我的 GitHub 账号）
git remote add origin https://github.com/YOUR_USERNAME/ai-agent1.git
git branch -M main
git push -u origin main
```

请帮我完成 GitHub 部署。
```

---

### Prompt 6.0: Cloudflare Pages 生产部署

```
最后一步：部署到 Cloudflare Pages。

**前提条件：**
- 我已经通过 Deploy 标签配置了 Cloudflare API Key

**部署步骤：**

1. 调用 setup_cloudflare_api_key 配置认证
2. 构建项目
3. 创建 Cloudflare Pages 项目
4. 部署到生产环境
5. 更新 meta_info 保存项目名

**具体命令：**
```bash
# 1. 构建
cd /home/user/webapp
npm run build

# 2. 创建项目
npx wrangler pages project create webapp \
  --production-branch main \
  --compatibility-date 2024-01-01

# 3. 部署
npx wrangler pages deploy dist --project-name webapp

# 4. 保存项目名
meta_info(action="write", key="cloudflare_project_name", value="webapp")
```

**部署后验证：**
```bash
# 测试 API
curl https://webapp-bpq.pages.dev/api/calculate-financing

# 测试页面
curl https://webapp-bpq.pages.dev
```

请帮我完成生产部署。
```

---

## 📊 测试验证用例

### 测试用例 1: 融资方准入评估（美妆类，通过）
```json
{
  "category": "美妆",
  "avgROI": 2.5,
  "avgReturnRate": 25,
  "avgNetProfit": 22,
  "shopRating": 4.5,
  "operatingMonths": 12
}
```
**预期结果**: qualified: true

### 测试用例 2: 融资方计算器（每周打款）
```json
{
  "investmentAmount": 500000,
  "dailyGMV": 300000,
  "revenueSharingRate": 15,
  "paymentFrequency": "weekly"
}
```
**预期结果**:
- annualReturnRate: 15
- dailyRevenue: 45000
- daysToComplete: 12
- totalPayment: 502500
- actualCost: 2500

### 测试用例 3: 投资方计算器（每周回款）
```json
{
  "investmentAmount": 500000,
  "dailyGMV": 300000,
  "revenueSharingRate": 15,
  "targetReturnRate": 18,
  "paymentFrequency": "weekly"
}
```
**预期结果**:
- targetTotalReturn: 503000
- daysToBreakEven: 12
- totalReturn: 0.60 (%)
- totalProfit: 3000

---

## 🎨 技术栈与项目结构

### 技术栈
- **后端**: Hono + TypeScript + Cloudflare Workers
- **前端**: Vanilla JavaScript + Tailwind CSS (CDN)
- **部署**: Cloudflare Pages
- **版本控制**: Git + GitHub

### 项目结构
```
webapp/
├── src/
│   ├── index.tsx          # 主应用（API 路由和页面渲染）
│   └── renderer.tsx       # HTML 渲染器
├── public/static/
│   ├── app.js             # 前端交互逻辑
│   └── style.css          # 自定义样式
├── dist/                  # 构建输出
├── ecosystem.config.cjs   # PM2 配置
├── wrangler.jsonc         # Cloudflare 配置
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── CHANGELOG_v1.3.0.md
└── .git/
```

---

## 🚀 预期产出

完成所有 Prompt 后，你将获得：

1. ✅ 完整的 Hono + TypeScript 项目
2. ✅ 融资方准入评估模块（9大品类）
3. ✅ 融资方计算器（YITO封顶机制）
4. ✅ 投资方计算器（投资周期总收益率）
5. ✅ 协议预填项收集与下载功能
6. ✅ 一键套用功能
7. ✅ 本地开发环境（PM2 + Wrangler）
8. ✅ GitHub 仓库
9. ✅ Cloudflare Pages 生产部署

### 访问地址
- **生产环境**: https://webapp-bpq.pages.dev
- **GitHub**: https://github.com/YOUR_USERNAME/ai-agent1
- **沙盒环境**: https://3000-xxx.sandbox.novita.ai

---

## 💡 常见问题处理

### Q1: PM2 启动失败
```bash
# 清理端口
fuser -k 3000/tcp 2>/dev/null || true

# 重新构建
cd /home/user/webapp && npm run build

# 重启 PM2
pm2 start ecosystem.config.cjs
```

### Q2: GitHub 认证失败
```bash
# 重新配置
setup_github_environment

# 验证
gh auth status
```

### Q3: Cloudflare 部署失败
```bash
# 重新配置
setup_cloudflare_api_key

# 验证
npx wrangler whoami

# 重新部署
npx wrangler pages deploy dist --project-name webapp \
  --commit-message "Deploy webapp" \
  --branch main
```

---

## 📝 更新日志

### v1.4.0 (2026-02-11)
- ✅ 新增融资方准入评估模块（9大品类）
- ✅ 修复协议下载功能
- ✅ 部署到 Cloudflare Pages
- ✅ 完整文档和测试用例

### v1.3.0 (2025-02-05)
- ✅ 删除融资方"实际年化成本率"显示
- ✅ 投资方改为显示"投资周期总收益率"
- ✅ 新增协议预填项收集模块
- ✅ 实现一键套用功能

---

## 🎯 使用建议

1. **按顺序执行 Prompt**: 从 1.0 到 6.0 依次执行，不要跳过
2. **测试验证**: 每个 Prompt 完成后进行测试
3. **保存进度**: 每个阶段完成后 git commit
4. **文档同步**: 及时更新 README 和 CHANGELOG
5. **问题记录**: 遇到问题记录在 GitHub Issues

---

## 📞 联系与支持

- **GitHub**: https://github.com/timxie-microconnect/ai-agent1
- **生产环境**: https://webapp-bpq.pages.dev
- **文档**: 本 PROMPT_TEMPLATE.md

---

**🎉 祝你成功创建滴灌通投流通网页！**

---

## 附录：核心计算公式速查

### YITO 封顶公式
```
封顶金额 = 本金 × (1 + 年化成本率 × 联营天数 / 360)
```

### 年化成本锚定
- 每日打款: 13%
- 每周打款: 15%
- 每两周打款: 18%

### 投资周期总收益率
```
总收益率 = (总回收金额 - 投资本金) / 投资本金 × 100%
总收益金额 = 总回收金额 - 投资本金
```

### 准入评估通用标准
- 店铺评分 ≥ 3.5
- 运营时间 ≥ 6个月
- 品类标准见 Prompt 3.0

---

**最后更新**: 2026-02-11  
**版本**: v1.4.0  
**作者**: Claude Code Agent
