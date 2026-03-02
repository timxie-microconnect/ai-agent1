# 项目备份与恢复指南

## 📦 当前备份状态

### ✅ 完整项目备份（推荐使用）

**备份时间**: 2026-03-02  
**备份名称**: webapp_筛子系统完整版_2026-03-02  
**下载链接**: https://www.genspark.ai/api/files/s/KI6VBALA  
**文件大小**: 757 KB (775,445 bytes)  
**格式**: tar.gz 压缩包

**包含内容**:
- ✅ 全部源代码（src/、public/、migrations/）
- ✅ 配置文件（package.json、wrangler.jsonc、tsconfig.json等）
- ✅ 数据库文件（.wrangler/state/v3/d1/ 下的 SQLite 数据库）
- ✅ Git 历史记录（.git/ 目录）
- ✅ 文档（README.md、DATABASE_GUIDE.md等）

**备份描述**:
> 筛子系统完整版备份 - 包含1487条阈值配置、60-100分评分算法、三级联动类目选择、准入检查、智能评分等全部功能。所有bug已修复：评分算法正确（达到阈值=60分）、结算率显示正常（80%）、删除旧评分功能。

---

## 🔄 如何恢复备份

### 方法 1：完整恢复（推荐）

```bash
# 1. 下载备份文件
wget https://www.genspark.ai/api/files/s/KI6VBALA -O webapp_backup.tar.gz

# 或使用 curl
curl -L https://www.genspark.ai/api/files/s/KI6VBALA -o webapp_backup.tar.gz

# 2. 解压到 /home/user/ 目录（会自动恢复到 /home/user/webapp/）
cd /home/user
tar -xzf webapp_backup.tar.gz

# 3. 进入项目目录
cd /home/user/webapp

# 4. 安装依赖（如果需要）
npm install

# 5. 应用数据库迁移（如果需要）
npx wrangler d1 migrations apply webapp-production --local

# 6. 启动服务
pm2 start ecosystem.config.cjs
```

### 方法 2：代码恢复（如果你已推送到GitHub）

```bash
# 1. 克隆仓库
cd /home/user
git clone https://github.com/你的用户名/webapp.git

# 2. 进入目录
cd webapp

# 3. 切换到最新的稳定提交
git checkout 900644d  # 或使用 main 分支

# 4. 安装依赖
npm install

# 5. 应用数据库迁移
npx wrangler d1 migrations apply webapp-production --local

# 6. 启动服务
pm2 start ecosystem.config.cjs
```

---

## 📊 备份内容清单

### 代码文件
- **src/** - 后端代码
  - `index.tsx` - 主应用入口
  - `api-sieve.ts` - 筛子系统API（准入检查、评分计算）
  - `api-admin-extended.ts` - 管理员扩展API
  - `scoring-sieve.ts` - 评分算法模块
  
- **public/static/** - 前端代码
  - `app.js` - 主应用逻辑（路由、表单、API调用）
  - `app-extended.js` - 扩展功能（配置页面）
  - `sieve-frontend.js` - 筛子系统前端（类目选择、准入检查）

### 数据库文件
- **.wrangler/state/v3/d1/** - 本地SQLite数据库
  - 包含所有项目数据
  - 1487条类目阈值配置
  - 用户数据
  - 系统配置

### 配置文件
- `wrangler.jsonc` - Cloudflare Pages 配置
- `package.json` - 依赖和脚本
- `vite.config.ts` - Vite 构建配置
- `ecosystem.config.cjs` - PM2 进程管理配置

### 数据库迁移
- **migrations/** - 数据库结构定义
  - `0001_initial_schema.sql` - 基础表结构
  - `0006_sieve_scoring_system.sql` - 筛子系统表
  - `0007_import_thresholds_data.sql` - 1487条阈值数据
  - `0008_add_sieve_fields_to_projects.sql` - 筛子字段
  - `0009_add_sieve_score_fields.sql` - 评分字段
  - `0010_sieve_system_config.sql` - 配置表

---

## 🎯 当前系统版本信息

### Git 提交历史（最近6次）
```
900644d fix: 修复14日订单结算率显示错误并删除旧评分功能
12246f4 docs: 添加数据库访问指南
d9cd757 fix: 修复筛子评分算法和前端显示
e1fdf4f fix: 修正筛子评分算法 - 达到阈值即得60分
d11663a fix: 修复项目创建API的筛子字段解析问题
834198e fix: 增强动态评分API的错误处理
```

### 功能特性
- ✅ 用户注册登录
- ✅ 10步融资申请表单（旧版，已弃用）
- ✅ 筛子系统融资申请（新版，推荐）
  - 三级联动类目选择（13主类目 → 111一级 → 1393二级）
  - 四项指标输入（净成交ROI、14日结算ROI、14日订单结算率、历史消耗）
  - 实时准入检查
  - 智能评分（60-100分制）
- ✅ 管理员后台
  - 项目列表查看
  - 项目详情弹窗
  - 筛子智能评分
  - 配置管理（权重、k值、阈值）
  - 审批、上传协议、确认放款
  - 删除项目

### 已修复的Bug
- ✅ 评分算法：达到阈值=60分（修复前为0分）
- ✅ 结算率显示：80% 正确显示（修复前为8000%）
- ✅ 前端字段映射：camelCase ↔ snake_case 自动转换
- ✅ 配置读取：正确解析JSON格式
- ✅ 删除旧评分功能：只保留筛子评分按钮

---

## 🚨 重要注意事项

### 数据库文件位置
```
/home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
```

⚠️ **警告**: 
- 数据库文件名是哈希值，每次重新生成会改变
- 备份包含当前数据库文件，恢复后可直接使用
- 如需重新初始化数据库，运行：
  ```bash
  npx wrangler d1 migrations apply webapp-production --local
  ```

### 环境变量
- 本地开发使用 `.dev.vars` 文件（未包含在Git中）
- 生产环境使用 `wrangler secret put` 命令设置

### Node.js 依赖
- 恢复后需要重新运行 `npm install`
- 或者备份包已包含 `node_modules/`（如果打包时存在）

---

## 📝 备份建议

### 定期备份
建议在以下情况创建新备份：
1. **重大功能完成后** - 如筛子系统上线
2. **重大bug修复后** - 如本次修复
3. **数据库结构变更后** - 如添加新表或字段
4. **部署到生产环境前** - 确保有稳定版本可回退

### 备份命名规范
```
webapp_[功能描述]_[日期]
例如：
- webapp_筛子系统完整版_2026-03-02
- webapp_生产环境稳定版_2026-03-15
- webapp_新增支付功能_2026-04-01
```

### 多重备份策略
1. **云端备份** - 使用 ProjectBackup 工具（已完成）✅
2. **GitHub备份** - 推送到远程仓库（需要授权）
3. **本地备份** - 手动下载 tar.gz 文件到本地电脑
4. **数据库单独备份** - 定期导出SQL文件（可选）

---

## 🔗 相关链接

- **备份下载**: https://www.genspark.ai/api/files/s/KI6VBALA
- **数据库指南**: DATABASE_GUIDE.md
- **项目说明**: README.md
- **在线访问**: https://3000-ibnrc4r5fzkd54g4xrh1b-2e1b9533.sandbox.novita.ai/

---

## 📞 问题排查

### 恢复后服务无法启动
```bash
# 1. 检查端口占用
fuser -k 3000/tcp

# 2. 重新构建
cd /home/user/webapp
npm run build

# 3. 重启PM2
pm2 delete all
pm2 start ecosystem.config.cjs

# 4. 检查日志
pm2 logs webapp --nostream
```

### 数据库为空
```bash
# 应用所有迁移
cd /home/user/webapp
npx wrangler d1 migrations apply webapp-production --local

# 验证数据
npx wrangler d1 execute webapp-production --local \
  --command="SELECT COUNT(*) FROM category_thresholds"
# 应返回 1487 条记录
```

### Git历史丢失
```bash
# 检查Git状态
cd /home/user/webapp
git log --oneline -5

# 如果显示错误，重新初始化
git init
git add .
git commit -m "Restore from backup"
```

---

**最后更新**: 2026-03-02  
**备份创建者**: AI Assistant  
**项目版本**: v3.0 筛子系统完整版
