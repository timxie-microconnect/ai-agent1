# 滴灌投资信息收集系统

## 项目概述

滴灌投资信息收集系统是一个完整的投资信息收集和审批管理系统，包含用户端和管理员端两个独立界面。系统提供10步表单收集、智能评分、工作流审批等核心功能。

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
✅ 用户仪表盘（查看所有项目）
✅ 项目详情页（查看评分结果和状态）
✅ 实时状态跟踪

### 管理员端功能
✅ 管理员登录
✅ 查看所有提交记录
✅ 智能评分系统（9个品类标准）
✅ 审批操作（通过/拒绝）
✅ 工作流管理（上传协议、确认出资）
✅ 删除记录功能

### 智能评分系统
支持9个商品品类的智能评分：
- 女装、男装、美妆、食品、日用品
- 母婴、家电、家居、药品

评分维度（总分100分）：
- ROI评分：25分
- 退货率评分：25分
- 净利润评分：25分
- 店铺评分：12.5分
- 运营时间评分：12.5分

通过标准：总分 ≥ 60分

### 工作流状态
```
待评分 → 评分中 → 审批通过/拒绝 → 协议已上传 → 已完成出资
```

## 项目访问

### 🌐 在线访问
**公网地址**: https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai

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
- 用户端首页: http://localhost:3000
- 用户登录: http://localhost:3000/login
- 用户仪表盘: http://localhost:3000/dashboard
- 管理员登录: http://localhost:3000/admin/login
- 管理员后台: http://localhost:3000/admin

## 项目结构

```
webapp/
├── src/
│   ├── index.tsx          # 主应用入口，包含所有API路由
│   ├── scoring.ts         # 智能评分算法
│   └── utils.ts           # 工具函数
├── public/
│   └── static/
│       └── app.js         # 前端应用（完整单页应用）
├── migrations/
│   └── 0001_initial_schema.sql  # 数据库Schema
├── seed.sql               # 测试数据
├── ecosystem.config.cjs   # PM2配置
├── wrangler.jsonc         # Cloudflare配置
├── vite.config.ts         # Vite配置
└── package.json           # 项目依赖
```

## 数据库设计

### 主要数据表
- **users**: 用户表（包含普通用户和管理员）
- **projects**: 项目主表（存储所有表单数据）
- **legal_representatives**: 法定代表人表
- **actual_controllers**: 实控人表
- **platform_accounts**: 平台账号表
- **scoring_results**: 评分结果表
- **workflow_history**: 工作流历史表

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
- `POST /api/admin/projects/:id/score` - 智能评分
- `POST /api/admin/projects/:id/approve` - 审批操作
- `POST /api/admin/projects/:id/upload-contract` - 上传协议
- `POST /api/admin/projects/:id/confirm-funding` - 确认出资
- `DELETE /api/admin/projects/:id` - 删除项目

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

## 待扩展功能

- 完整的10步表单（当前为简化版）
- 文件上传功能（协议文件）
- 数据导出功能（JSON、PDF）
- 更多的表单验证
- 响应式移动端优化
- 单元测试和集成测试

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。

---

**最后更新**: 2026-02-25
**版本**: 1.0.0
**状态**: ✅ 开发完成，可用于测试
