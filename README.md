# webapp - 滴灌通·投流通

## 项目概述
- **名称**：滴灌通·投流通
- **目标**：为抖音电商定制的投流资金解决方案
- **核心功能**：
  - 公司和产品介绍
  - **融资方计算器**：帮助商家评估融资成本（YITO机制）
  - **投资方计算器**：帮助投资人评估CFO资产回报（IRR计算）

## 项目URLs
- **开发环境**：https://3000-ix8ugcegod23x3fqqk0dd-0e616f0a.sandbox.novita.ai
- **生产环境**：待部署

## 核心商业模式

### 双面平台设计

#### 1️⃣ 融资方（品牌商家）
**需求**：需要投流资金的抖音电商卖家

**YITO机制特点**：
- **非股非债**：不稀释股权，无固定还款压力
- **收入分成**：按GMV分成，风险共担
- **资金直达**：直达抖音广告账户
- **灵活年化成本**：
  - 每日打款：13%
  - 每周打款：15%
  - 每两周打款：18%

**计算功能**：
- 输入融资金额、日均GMV、分成比例、年化成本
- 计算每日分成支出、联营天数、总支付金额
- 显示实际融资成本和实际年化成本率

#### 2️⃣ 投资方（现金权投资者）
**需求**：购买CFO资产（Cash Flow Obligation）的资本方

**投资特点**：
- 购买滴灌通投出的现金权资产
- 获得稳定的分成回款
- 明确的IRR和回款周期
- 完整的现金流时间表

**计算功能**：
- 输入投资金额、标的日均GMV、分成比例、目标回报率
- 计算年化IRR、预计联营时间、回款次数
- 展示现金流时间表（前12期详细）

## 功能特性

### 融资方计算器
```
输入参数：
- 融资金额：如 500,000 元
- 日均GMV：如 300,000 元
- 分成比例：如 15%
- 年化成本：13%, 15%, 18%（可选）
- 打款频率：每日/每周/每两周

输出结果：
- 每日分成支出
- 预计联营天数
- 总支付金额
- 实际融资成本
- 实际年化成本率
- 打款详情
```

### 投资方计算器
```
输入参数：
- 投资金额：如 500,000 元
- 标的日均GMV：如 300,000 元
- 分成比例：如 15%
- 目标回报率：如 18%
- 回款频率：每日/每周/每两周

输出结果：
- 每日分成收入
- 预计回收天数/月数
- 目标回收总额
- 年化IRR
- 回款详情
- 现金流时间表（前12期）
```

## 技术架构
- **前端**：HTML + Tailwind CSS + Vanilla JavaScript
- **后端**：Hono (轻量级Web框架)
- **部署**：Cloudflare Pages
- **运行时**：Cloudflare Workers

## 本地开发

### 安装依赖
```bash
npm install
```

### 构建项目
```bash
npm run build
```

### 启动开发服务器（使用PM2）
```bash
# 清理端口和服务
fuser -k 3000/tcp 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 构建项目
npm run build

# 启动PM2服务
pm2 start ecosystem.config.cjs

# 查看日志
pm2 logs --nostream

# 测试服务
curl http://localhost:3000
```

## 部署到Cloudflare Pages

### 前置条件
1. 注册Cloudflare账号
2. 安装并配置wrangler CLI
3. 设置Cloudflare API密钥

### 部署步骤
```bash
# 构建项目
npm run build

# 部署到Cloudflare Pages
npm run deploy:prod
```

## 项目结构
```
webapp/
├── src/
│   ├── index.tsx          # 主应用（双面平台UI + API）
│   └── renderer.tsx       # JSX渲染器配置
├── public/
│   └── static/
│       ├── app.js         # 前端交互逻辑（双计算器）
│       └── style.css      # 自定义样式
├── dist/                  # 构建输出目录
├── ecosystem.config.cjs   # PM2配置
├── wrangler.jsonc         # Cloudflare配置
├── package.json           # 项目依赖
├── vite.config.ts         # Vite配置
└── README.md             # 项目文档
```

## API接口

### POST /api/calculate-financing
融资方计算（YITO机制）

**请求体：**
```json
{
  "investmentAmount": 500000,
  "dailyGMV": 300000,
  "revenueSharingRate": 15,
  "annualReturnRate": 15,
  "paymentFrequency": "weekly"
}
```

**响应：**
```json
{
  "investmentAmount": 500000,
  "dailyGMV": 300000,
  "dailyCost": 45000,
  "revenueSharingRate": 15,
  "annualReturnRate": 15,
  "daysToComplete": 13,
  "totalPayment": 501266.52,
  "actualCost": 1266.52,
  "actualAnnualRate": 7.01,
  "paymentFrequency": "每周",
  "paymentInterval": 7,
  "paymentCount": 2,
  "paymentAmount": 315000
}
```

### POST /api/calculate-investment
投资方计算（CFO资产）

**请求体：**
```json
{
  "investmentAmount": 500000,
  "dailyGMV": 300000,
  "revenueSharingRate": 15,
  "targetReturnRate": 18,
  "paymentFrequency": "weekly"
}
```

**响应：**
```json
{
  "investmentAmount": 500000,
  "targetReturnRate": 18,
  "targetTotalReturn": 590000,
  "dailyGMV": 300000,
  "dailyRevenue": 45000,
  "revenueSharingRate": 15,
  "daysToBreakEven": 14,
  "monthsToBreakEven": "0.5",
  "paymentFrequency": "每周",
  "paymentInterval": 7,
  "paymentCount": 2,
  "paymentAmount": 315000,
  "irr": 335116.39,
  "cashFlowSchedule": [
    {
      "period": 1,
      "date": "第1周",
      "inflow": 315000,
      "cumulative": 315000
    },
    {
      "period": 2,
      "date": "第2周",
      "inflow": 315000,
      "cumulative": 630000
    }
  ]
}
```

## 计算逻辑说明

### 融资方YITO计算
- 使用每日复利计算融资成本
- 每日成本 = 本金余额 × (年化成本率 / 360)
- 每日分成支出 = 日均GMV × 分成比例
- 当累计分成达到本金+利息时，联营结束

### 投资方IRR计算
- 使用牛顿迭代法计算内部收益率
- 构建现金流：初始投资为负，后续为回款
- 根据回款频率转换为年化IRR
- 生成详细的现金流时间表

## 典型案例

### 融资方案例
```
融资金额：500,000 元
日均GMV：300,000 元
分成比例：15%
年化成本：15%
打款频率：每周

结果：
- 每日分成支出：45,000 元
- 预计联营天数：13 天
- 总支付金额：501,266.52 元
- 实际成本：1,266.52 元
- 实际年化成本率：7.01%
```

### 投资方案例
```
投资金额：500,000 元
标的日均GMV：300,000 元
分成比例：15%
目标回报率：18%
回款频率：每周

结果：
- 每日分成收入：45,000 元
- 预计回收天数：14 天（0.5个月）
- 目标回收总额：590,000 元
- 年化IRR：335,116.39%（极高，因回收周期极短）
- 回款次数：2次，每次315,000元
```

## UI设计特点

### 配色方案
- **主色调**：红色渐变（参考宣发方案）
- **融资方卡片**：红色边框，强调"需要资金"
- **投资方卡片**：蓝色边框，强调"投资回报"
- **强调色**：橙色、黄色（用于重点提示）

### 交互设计
- 双计算器并排展示
- 实时计算，即时反馈
- 现金流时间表可视化
- 响应式设计，适配移动端

## 业务数据

### 核心指标
- **服务品牌**：25,000+
- **年营收**：30亿+
- **合作城市**：300+
- **抖音电商GMV**：3.5万亿+
- **投流市场规模**：1万亿+

### 分成方案
| 打款频率 | 年化成本 | 日度成本 | 适用场景 |
|---------|---------|---------|---------|
| 每日 | 13% | 0.036% | 高频回款，灵活性最高 |
| 每周 | 15% | 0.042% | 标准方案，平衡成本与灵活性 |
| 每两周 | 18% | 0.050% | 降低管理成本 |

## 最近更新
- **2025-02-05**：重大更新 - 双面平台设计
  - 分离融资方和投资方计算器
  - 新增CFO资产投资计算功能
  - 添加现金流时间表展示
  - 优化UI设计（红色主题）
  - 完善YITO机制计算逻辑

## 待实现功能
- [ ] 用户认证系统（融资方/投资方分别登录）
- [ ] 历史计算记录保存
- [ ] 数据可视化图表（IRR曲线、现金流图）
- [ ] 实际案例展示（十月稻田等）
- [ ] 在线申请表单
- [ ] 移动端优化

## 联系方式
- **公司**：滴灌通投资（海南）有限公司
- **创始人**：李小加（前香港交易所行政总裁）
- **愿景**：以金融科技连接全球资本与中小微企业

## 许可证
Copyright © 2025 滴灌通集团
