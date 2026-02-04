# webapp - 滴灌通·投流通

## 项目概述
- **名称**：滴灌通·投流通
- **目标**：以金融科技赋能电商投流增长，连接全球资本与小微企业
- **核心功能**：
  - 抖音电商投流融资展示
  - 投流ROI计算器
  - IRR投资回报率计算器（支持日/周/两周打款频率）

## 项目URLs
- **开发环境**：http://localhost:3000
- **生产环境**：待部署

## 核心商业模式

### RBF收入分成融资
- **非股非债**：不稀释股权，无固定还款压力
- **风险共担**：按日营收分成，业绩好多分，业绩差少分
- **专款专用**：资金直连抖音投流账户
- **生态协同**：联动优质投流代理商

### YITO投资机制
- **收益锚定**：目标年化收益率 18%
- **期限灵活**：达到目标收益即退出
- **分成比例**：15%-29% 按GMV分成
- **打款灵活**：支持每日/每周/两周打款

## 功能特性

### 1. 投流ROI计算器
- 输入广告投放金额和ROI倍数
- 计算销售金额、利润和利润率
- 实时反馈投放效果

### 2. IRR投资回报计算器
- 输入投资金额、日均GMV、分成比例
- 支持三种打款频率（日/周/两周）
- 计算年化IRR、回收天数、打款次数
- 使用牛顿迭代法精确计算内部收益率

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
# 清理端口
npm run clean-port

# 构建项目
npm run build

# 启动PM2服务
pm2 start ecosystem.config.cjs

# 查看日志
pm2 logs --nostream

# 测试服务
npm test
```

### 直接使用Vite开发（仅本地机器）
```bash
npm run dev
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
│   ├── index.tsx          # 主应用入口和API路由
│   └── renderer.tsx       # JSX渲染器配置
├── public/
│   └── static/
│       ├── app.js         # 前端JavaScript
│       └── style.css      # 自定义样式
├── dist/                  # 构建输出目录
├── ecosystem.config.cjs   # PM2配置
├── wrangler.jsonc         # Cloudflare配置
├── package.json           # 项目依赖
├── vite.config.ts         # Vite配置
└── README.md             # 项目文档
```

## API接口

### POST /api/calculate-roi
计算投流ROI

**请求体：**
```json
{
  "adSpend": 100000,
  "roi": 3.0
}
```

**响应：**
```json
{
  "adSpend": 100000,
  "roi": 3.0,
  "salesAmount": 300000,
  "profit": 200000,
  "profitMargin": 66.67
}
```

### POST /api/calculate-irr
计算IRR投资回报率

**请求体：**
```json
{
  "investmentAmount": 1000000,
  "dailyGMV": 500000,
  "revenueSharingRate": 20,
  "targetReturnRate": 18,
  "paymentFrequency": "daily"
}
```

**响应：**
```json
{
  "investmentAmount": 1000000,
  "targetReturnRate": 18,
  "targetTotalReturn": 1180000,
  "dailyGMV": 500000,
  "dailyRevenue": 100000,
  "revenueSharingRate": 20,
  "daysToBreakEven": 12,
  "paymentFrequency": "每日",
  "paymentInterval": 1,
  "paymentCount": 12,
  "paymentAmount": 100000,
  "irr": 8760.5,
  "actualReturnRate": 18
}
```

## 计算逻辑说明

### IRR计算方法
使用牛顿迭代法（Newton-Raphson Method）求解内部收益率：
- 构建现金流数组：初始投资为负值，后续为回款
- 通过迭代计算使NPV=0的折现率
- 根据打款频率转换为年化IRR

### 打款频率影响
- **每日**：365期，现金流频繁，IRR较高
- **每周**：52期，现金流周期适中
- **每两周**：26期，现金流周期较长，IRR相对较低

## 数据说明

### 典型参数
- **ROI范围**：成熟期 2-3，成长期 3-4.5
- **分成比例**：15%-29%
- **目标年化收益**：18%
- **市场规模**：抖音电商GMV 3.5万亿+，投流市场 1万亿+

## 最近更新
- **2025-02-04**：项目初始化，实现核心功能
  - 完成项目介绍页面
  - 实现投流ROI计算器
  - 实现IRR投资回报率计算器
  - 支持三种打款频率（日/周/两周）
  - 集成Tailwind CSS和Font Awesome

## 待实现功能
- [ ] 用户认证系统
- [ ] 历史计算记录保存
- [ ] 数据可视化图表
- [ ] 移动端优化
- [ ] 多语言支持

## 联系方式
- **公司**：滴灌通投资（海南）有限公司
- **创始人**：李小加（前香港交易所行政总裁）

## 许可证
Copyright © 2025 滴灌通集团
