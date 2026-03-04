# 滴灌通-投流通信息收集系统

## 项目概述

滴灌通-投流通信息收集系统是一个完整的投资信息收集和审批管理系统，包含用户端和管理员端两个独立界面。系统提供10步表单收集、智能评分、工作流审批等核心功能。

**🆕 V3.0 新增：抖店投流融资准入筛子系统**
- 基于1487个二级类目的精确阈值准入评分
- 三级类目联动选择（13主营→111一级→1393二级）
- 智能兜底规则（精确匹配 → 一级兜底 → 主营兜底）
- 四维度评分模型（净ROI、14日ROI、结算率、历史消耗）

## 技术栈

- **后端框架**: Hono (Cloudflare Workers)
- **数据库**: Cloudflare D1 (SQLite)
- **前端**: Vanilla JavaScript + TailwindCSS
- **部署平台**: Cloudflare Pages
- **开发工具**: Vite + TypeScript

## 功能特性

### 用户端功能
✅ 用户注册/登录
✅ 项目信息收集表单（简化版包含关键评分字段）
✅ **🔥 抖店投流融资申请表单（筛子系统）**
✅ 用户仪表盘（查看所有项目）
✅ 项目详情页（查看评分结果和状态）
✅ 实时状态跟踪

### 管理员端功能
✅ 管理员登录
✅ 查看所有提交记录
✅ **智能评分系统（可配置）**
✅ **评分配置管理界面**
✅ 审批操作（通过/拒绝）
✅ **尽调Checklist（三部分）**
✅ 工作流管理（协议上传、确认出资）
✅ **真实文件上传（协议PDF、尽调文件）**
✅ **筛子系统集成（项目列表、详情、评分）**
✅ **阈值配置管理（查看类目阈值）**
✅ 删除记录功能

### 🆕 抖店投流融资准入筛子系统

**用户端功能：**
- 📊 **1487条精确阈值**：覆盖13个主营类目、111个一级类目、1393个二级类目
- 🎯 **智能兜底规则**：精确匹配 → 一级类目最严 → 主营类目最严
- 🔍 **三级联动选择器**：支持中文、拼音搜索，实时阈值预览（仅管理员可见）
- ⚡ **四维度准入评分**：净成交ROI、14日结算ROI、14日订单结算率、历史消耗金额

**管理员端功能：**
- 📋 **项目列表增强**：显示类目路径、准入状态、筛子评分
- 🔎 **项目详情增强**：展示四项指标实际值、准入结果、失败原因
- 🎯 **智能评分按钮**：一键计算筛子评分（边际递减算法）
- 📊 **评分详情展示**：四项指标分项得分、总分、通过/未达标标识
- ⚙️ **阈值配置页面**：查看13个主营类目及其下级类目统计

**评分算法：**
```
提升幅度 u = max(0, 实际值/阈值 - 1)
单项分数 S = 100 × (1 - exp(-k × u))  # 边际递减函数
总分 = 0.20×S_净ROI + 0.35×S_14日ROI + 0.30×S_结算率 + 0.15×S_消耗
```

**准入规则：**
- 四项指标**必须全部达标**才能通过准入审核
- 未达标项目直接标记为"未准入/不通过"，评分为0
- 通过准入后进行智能评分（满分100分）

**13个主营类目：**
1. 水果生鲜
2. 服装内衣
3. 运动户外
4. 食品饮料
5. 美妆
6. 家居家装
7. 医药健康
8. 数码家电
9. 珠宝文玩
10. 母婴
11. 汽车配件
12. 图书文娱
13. 本地生活

详见：[SIEVE_SCORING_REPORT.md](./SIEVE_SCORING_REPORT.md)

### 智能评分系统（全面可配置）

**支持48个抖音电商品类的智能评分：**

**服饰鞋包类（9个）**：女装、男装、内衣、童装、鞋靴、箱包、配饰、运动服饰、制服工装

**美妆个护类（4个）**：美妆、个人护理、彩妆香水、美容仪器

**食品饮料类（6个）**：食品、酒类、生鲜、茶叶、保健食品、滋补品

**家居生活类（8个）**：家居家纺、家装建材、厨房用品、日用百货、家庭清洁、卫浴用品、家具、灯具照明

**电器数码类（6个）**：家用电器、厨房电器、手机数码、电脑办公、智能设备、影音娱乐

**母婴玩具类（4个）**：母婴用品、玩具乐器、童车童床、营养辅食

**运动户外类（3个）**：运动户外、健身器材、户外装备

**汽车用品类（2个）**：汽车用品、汽车配件

**珠宝钟表类（2个）**：珠宝首饰、钟表眼镜

**图书文娱类（3个）**：图书音像、文具办公、乐器

**其他品类（1个）**：其他（兜底分类）

详见：[CATEGORIES_V2.md](./CATEGORIES_V2.md)

**前端交互优化：**
- ✅ 搜索型下拉框（输入即时过滤）
- ✅ 支持拼音首字母搜索（如输入"nz"可找到"女装"和"男装"）
- ✅ 分组标签展示，响应式换行
- ✅ 48个品类无需滚动，一目了然

**评分维度（总分100分）：**
- ROI评分：25分
- 退货率评分：25分
- 净利润评分：25分
- 店铺评分：12.5分
- 运营时间评分：12.5分

**通过标准：** 总分 ≥ 60分（低于60分自动拒绝）

**配置管理功能：**
- ✅ 管理员可在后台配置每个品类的评分标准
- ✅ 支持调整阈值、权重、比较运算符
- ✅ 支持添加/删除评分字段
- ✅ 前端表单字段动态适配配置
- ✅ 支持手动修改评分结果

### 工作流状态
```
待评分 → 评分中 → 审批通过/自动拒绝 → [尽调Checklist] → 协议已上传 → 已完成出资
```

**尽调Checklist三部分：**
1. 主体信用/资质核验（文件上传）
2. 投流历史数据核验（文件上传）
3. 其他核验文件（文件上传）

## 项目访问

### 🌐 在线访问
**公网地址**: https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai

### 📱 快速导航
- **🏠 导航页（推荐）**: [/nav](https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai/nav)
- **💰 筛子融资申请**: 已集成到用户端首页表单
- **🔥 筛子系统演示**: [/sieve-demo](https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai/sieve-demo)
- **👤 用户登录**: [/login](https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai/login)
- **🛡️ 管理员登录**: [/admin/login](https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai/admin/login)
- **📊 管理后台**: [/admin](https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai/admin)
- **⚙️ 评分配置**: [/admin/scoring-config](https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai/admin/scoring-config)
- **🗄️ 阈值配置**: [/admin/thresholds](https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai/admin/thresholds)

### 默认测试账号

**用户账号**:
- 用户名: `testuser`
- 密码: `test123`

**管理员账号**:
- 用户名: `admin`
- 密码: `admin123`

## 快速开始

### 安装依赖
```bash
npm install
```

### 初始化数据库
```bash
# 应用迁移
npm run db:migrate:local

# 填充测试数据
npm run db:seed
```

### 本地开发
```bash
# 构建项目
npm run build

# 使用PM2启动（推荐）
pm2 start ecosystem.config.cjs

# 或直接启动
npm run dev:sandbox
```

### 访问应用
- **导航页（推荐）**: http://localhost:3000/nav
- 用户端首页: http://localhost:3000
- 用户登录: http://localhost:3000/login
- 用户仪表盘: http://localhost:3000/dashboard
- 管理员登录: http://localhost:3000/admin/login
- 管理员后台: http://localhost:3000/admin
- **评分配置管理**: http://localhost:3000/admin/scoring-config

## 项目结构

```
webapp/
├── src/
│   ├── index.tsx              # 主应用入口，包含所有API路由
│   ├── api-admin-extended.ts  # **扩展管理员API（新增）**
│   ├── scoring.ts             # 智能评分算法
│   └── utils.ts               # 工具函数
├── public/
│   └── static/
│       ├── app.js             # 前端应用（用户端+基础管理）
│       └── app-extended.js    # **扩展功能前端（新增）**
├── migrations/
│   ├── 0001_initial_schema.sql    # 数据库Schema
│   ├── 0002_scoring_config_and_files.sql  # 初始扩展
│   └── 0003_complete_upgrade.sql  # **完整升级（新增）**
├── seed.sql                   # 测试数据
├── test_enhanced_workflow.sh  # **完整流程测试（新增）**
├── ecosystem.config.cjs       # PM2配置
├── wrangler.jsonc             # Cloudflare配置
├── vite.config.ts             # Vite配置
├── IMPLEMENTATION_REPORT.md   # **实施报告（新增）**
└── package.json               # 项目依赖
```

## 数据库设计

### 主要数据表
- **users**: 用户表（包含普通用户和管理员）
- **projects**: 项目主表（存储所有表单数据）
- **legal_representatives**: 法定代表人表
- **actual_controllers**: 实控人表
- **platform_accounts**: 平台账号表
- **scoring_results**: 评分结果表
- **scoring_config**: **评分配置表（新增）**
- **workflow_history**: 工作流历史表
- **due_diligence_checklist**: **尽调清单表（新增）**
- **due_diligence_files**: **尽调文件表（新增）**
- **contract_files**: **协议文件表（新增）**

## API接口

### 用户认证
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/admin/login` - 管理员登录

### 项目管理
- `POST /api/projects` - 提交新项目
- `GET /api/projects` - 获取用户项目列表
- `GET /api/projects/:id` - 获取项目详情

### 管理员操作
- `GET /api/admin/projects` - 获取所有项目
- `GET /api/admin/projects/:id` - 获取项目详情（管理员）
- `POST /api/admin/projects/:id/score` - 智能评分（原始）
- **`POST /api/admin/projects/:id/score-dynamic` - 动态评分（基于配置）**
- **`POST /api/admin/projects/:id/override-score` - 手动修改评分**
- `POST /api/admin/projects/:id/approve` - 审批操作
- **`POST /api/admin/projects/:id/upload-contract` - 上传协议文件**
- **`GET /api/admin/projects/:id/contracts` - 获取协议文件列表**
- `POST /api/admin/projects/:id/confirm-funding` - 确认出资
- `DELETE /api/admin/projects/:id` - 删除项目

### **评分配置管理（新增）**
- **`GET /api/admin/scoring-config` - 获取所有评分配置**
- **`GET /api/admin/scoring-config/:category` - 获取指定品类配置**
- **`POST /api/admin/scoring-config` - 创建评分配置字段**
- **`PUT /api/admin/scoring-config/:id` - 更新评分配置**
- **`DELETE /api/admin/scoring-config/:id` - 删除评分配置**
- **`POST /api/admin/scoring-config/batch-update` - 批量更新配置**

### **尽调Checklist（新增）**
- **`POST /api/admin/projects/:id/create-checklist` - 创建尽调清单**
- **`GET /api/admin/projects/:id/checklist` - 获取尽调清单**
- **`POST /api/admin/projects/:id/upload-dd-file` - 上传尽调文件**
- **`POST /api/admin/checklist/:id/complete` - 完成清单项**

### **🆕 筛子系统API**
- **`GET /api/sieve/categories/tree` - 获取三级类目树结构**
- **`GET /api/sieve/categories/search?q=关键词` - 搜索类目（支持模糊匹配+拼音）**
- **`POST /api/sieve/categories/get-thresholds` - 获取类目阈值（支持兜底规则）**
- **`POST /api/sieve/sieve/check-admission` - 准入检查（四项指标验证）**
- **`POST /api/sieve/scoring/calculate/:projectId` - 计算筛子评分（边际递减算法）**

## 部署到Cloudflare Pages

### 1. 创建D1数据库
```bash
npx wrangler d1 create webapp-production
```

### 2. 更新wrangler.jsonc
将返回的database_id填入配置文件。

### 3. 应用数据库迁移
```bash
npm run db:migrate:prod
```

### 4. 构建并部署
```bash
npm run deploy:prod
```

## 开发说明

### 简化版表单
当前实现为简化版表单，包含关键评分字段：
- 企业名称
- 商品品类
- 投流ROI
- 退货率
- 净利润率
- 店铺评分
- 运营时间

完整的10步表单可根据需求文档扩展实现。

### 智能评分
评分算法基于9个商品品类的行业标准，自动计算总分并给出评估建议。

### 工作流
系统实现了完整的项目审批工作流，从提交到最终出资的全流程管理。

## 已完成功能

✅ **项目初始化** - Hono项目 + D1数据库
✅ **数据库设计** - 完整的数据表结构和迁移
✅ **后端API** - 所有用户和管理员API接口
✅ **智能评分算法** - 9个品类的评分规则
✅ **用户端界面** - 登录/注册、表单、仪表盘、项目详情
✅ **管理员界面** - 登录、项目列表、详情模态框、评分和审批
✅ **工作流管理** - 完整的状态流转和操作
✅ **本地测试** - PM2服务启动和测试
✅ **评分配置管理** - 可配置的评分标准和字段
✅ **文件上传功能** - 协议PDF、尽调文件上传
✅ **尽调Checklist** - 三部分结构化核验
✅ **自动拒绝功能** - 低于60分自动拒绝

## ~~待扩展功能~~（已全部完成）

~~- 完整的10步表单（当前为简化版）~~
~~- 文件上传功能（协议文件）~~ ✅ 已完成
~~- 数据导出功能（JSON、PDF）~~
~~- 更多的表单验证~~
- 响应式移动端优化
- 单元测试和集成测试

## 重要更新

### V3.0 筛子系统 (2026-03-02)

**用户端（100%完成）：**
1. **抖店投流融资准入筛子**
   - 1487条精确阈值数据导入
   - 三级类目联动选择器（13→111→1393）
   - 智能兜底规则（精确匹配→一级→主营）
   - 实时搜索（中文+拼音）
   - 集成到用户端首页表单

2. **四维度准入评分**
   - 净成交ROI（权重20%，k=3）
   - 14日结算ROI（权重35%，k=4）
   - 14日订单结算率（权重30%，k=4）
   - 历史消耗金额（权重15%，k=1.5）

3. **用户融资申请体验**
   - 三级类目搜索选择（阈值对用户不可见）
   - 四项指标填写
   - 自动准入检查
   - 可强制提交未达标项目

**管理员端（95%完成）：**
1. **项目列表增强**
   - 显示类目路径（主营 > 一级 > 二级）
   - 显示准入状态（可评分/未准入）
   - 显示筛子评分（分数和通过状态）

2. **项目详情增强**
   - 完整展示四项指标实际值
   - 显示准入结果和失败原因
   - 一键智能评分按钮
   - 详细评分计算过程（各项分数、提升幅度）

3. **阈值配置管理**
   - /admin/thresholds 页面
   - 查看13个主营类目
   - 显示各类目下一级和二级类目数量
   - 预留详情查看和编辑功能

**待优化功能（5%）：**
- 阈值详情弹窗（查看所有二级类目的具体阈值）
- 阈值在线编辑（管理员修改阈值）
- 批量导入导出（Excel格式）
- 版本管理（历史阈值记录）

详见：[筛子系统升级报告](./SIEVE_SCORING_REPORT.md)

### V2.0 功能升级 (2026-02-25)
1. **智能评分系统全面可配置**
   - 管理员可在后台配置所有评分标准
   - 支持动态添加/删除评分字段
   - 前端表单自动适配配置

2. **真实文件上传**
   - 协议PDF文件上传和下载
   - 尽调文件批量上传
   - 完整的文件管理系统

3. **尽调Checklist**
   - 低分项目自动拒绝（<60分）
   - 审批通过弹出三部分尽调表单
   - 完整的核验文件上传功能

详见：[IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md)

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。

---

**最后更新**: 2026-03-02
**版本**: 3.0.0
**状态**: ✅ V3.0筛子系统用户端完成 | ✅ V3.0筛子系统管理员端95%完成
