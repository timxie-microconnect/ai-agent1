# 系统升级需求 - 实施方案

## 当前状态
系统已基本完成，需要进行以下三个主要升级：

## 1. 智能评分配置系统

### 数据库改动
✅ 已完成
- `scoring_config` 表：存储评分字段配置
- `scoring_standards` 表：存储各品类的评分标准

### 需要添加的API
1. `GET /api/admin/scoring-config` - 获取评分字段配置
2. `POST /api/admin/scoring-config` - 添加评分字段
3. `PUT /api/admin/scoring-config/:id` - 更新评分字段
4. `DELETE /api/admin/scoring-config/:id` - 删除评分字段
5. `GET /api/admin/scoring-standards/:category` - 获取某品类的评分标准
6. `POST /api/admin/scoring-standards` - 添加/更新评分标准

### 前端页面
- `/admin/scoring-config` - 评分配置管理页面
  - 字段列表（可增删改）
  - 每个品类的标准配置
  - 权重分配调整

## 2. 协议文件上传功能

### 数据库改动
✅ 已完成
- `contract_files` 表：存储协议文件信息

### 需要添加的API
1. `POST /api/admin/projects/:id/upload-contract-file` - 上传协议文件
2. `GET /api/admin/projects/:id/contract-files` - 获取项目的协议文件列表
3. `GET /api/files/download/:fileId` - 下载文件

### 前端改动
- 管理员详情模态框：
  - "上传协议"按钮改为文件上传表单
  - 显示已上传的协议文件列表
  - 每个文件有下载链接
- 用户端项目详情：
  - 显示协议文件下载链接

## 3. 尽调Checklist功能

### 数据库改动
✅ 已完成
- `due_diligence_files` 表：存储尽调文件

### 需要添加的API
1. `POST /api/admin/projects/:id/due-diligence` - 提交尽调checklist
2. `GET /api/admin/projects/:id/due-diligence` - 获取尽调信息
3. `POST /api/admin/projects/:id/upload-dd-file` - 上传尽调文件

### 前端改动
- 管理员点击"审批通过"时：
  - 弹出尽调Checklist模态框
  - 三个部分：
    1. 主体信用/资质核验（文件上传）
    2. 投流历史数据核验（文件上传）
    3. 其他核验文件（文件上传）
  - 提交后才真正审批通过

## 4. 自动拒绝逻辑

### 改动点
- 智能评分API：评分<60分时，自动将状态改为"rejected"
- 前端显示：评分<60分时，不显示"审批通过"按钮，只显示"审批拒绝"按钮

## 实施建议

由于改动较大，建议分阶段实施：

### 阶段1（必须）
1. 修复评分算法问题（如有）
2. 实现文件上传基础API（模拟）
3. 实现尽调Checklist基本流程
4. 添加自动拒绝逻辑

### 阶段2（可选）
1. 完整的评分配置管理界面
2. 动态表单生成
3. R2真实文件上传集成

## 文件上传方案

### 方案A：模拟上传（快速实现）
- 前端上传文件到内存
- 后端保存文件元数据
- 下载时返回提示信息
- 适合演示和测试

### 方案B：R2集成（生产环境）
- 配置Cloudflare R2 bucket
- 真实上传文件到R2
- 生成下载URL
- 适合生产使用

## 时间估算
- 阶段1核心功能：2-3小时
- 阶段2完整功能：额外4-5小时
- R2真实集成：额外1-2小时（需要R2配置）

## 当前决策

考虑到时间和复杂度，我建议：
1. ✅ 立即实现自动拒绝逻辑（简单）
2. ✅ 实现尽调Checklist基本流程（重要）
3. ✅ 实现协议文件上传（使用模拟方案）
4. ⏳ 评分配置系统（作为独立功能模块，可后续添加）

这样可以快速满足您的核心需求，同时为未来扩展预留接口。
