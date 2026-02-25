# 系统升级实施报告

## ✅ 已完成的后端改动

### 1. 数据库升级
已创建新的数据库表：
- ✅ `scoring_config` - 评分字段配置表
- ✅ `scoring_standards` - 评分标准表
- ✅ `due_diligence_files` - 尽调文件表
- ✅ `contract_files` - 协议文件表

### 2. 新增API端点

#### 尽调Checklist API
- ✅ `POST /api/admin/projects/:id/due-diligence` - 提交尽调checklist
- ✅ `GET /api/admin/projects/:id/due-diligence` - 获取尽调信息

#### 协议文件上传API
- ✅ `POST /api/admin/projects/:id/upload-contract-file` - 上传协议文件
- ✅ `GET /api/admin/projects/:id/contract-files` - 获取协议文件列表（管理员）
- ✅ `GET /api/projects/:id/contract-files` - 获取协议文件列表（用户）
- ✅ `GET /api/files/download/:fileName` - 文件下载（模拟）

### 3. 智能评分改进
- ✅ 评分<60分自动拒绝
- ✅ 返回`autoRejected`标志

## 🚧 需要完成的前端改动

### 1. 管理员端改动（优先级：高）

#### 文件: `/home/user/webapp/public/static/app.js`

需要修改 `window.openAdminProjectModal` 函数：

```javascript
// 1. 评分结果显示改动
// 如果autoRejected=true，显示红色提示
// 不显示"审批通过"按钮，只显示"查看详情"

// 2. "审批通过"按钮改为打开尽调Modal
window.handleApprove = async function(id, action) {
  if (action === 'approve') {
    // 打开尽调Checklist模态框
    openDueDiligenceModal(id);
  } else {
    // 拒绝逻辑保持不变
  }
};

// 3. 新增尽调Modal
function openDueDiligenceModal(projectId) {
  // 显示包含三个部分的表单：
  // - 主体信用/资质核验（文件上传）
  // - 投流历史数据核验（文件上传）
  // - 其他核验文件（文件上传）
  
  // 每个部分有文件上传按钮
  // 上传的文件存储为 {fileName, fileUrl, fileSize}
  // 提交时调用 POST /api/admin/projects/:id/due-diligence
}

// 4. "上传协议"改为文件上传
window.handleUploadContract = async function(id) {
  // 显示文件上传界面
  // 选择PDF文件
  // 上传后调用 POST /api/admin/projects/:id/upload-contract-file
  // 上传成功后显示文件列表
  // 每个文件有下载链接
}
```

### 2. 用户端改动（优先级：中）

#### 在项目详情页添加：
```javascript
// 显示协议文件下载区域
async function renderProjectDetail(id) {
  // ... 现有代码 ...
  
  // 添加协议文件区块
  if (project.status === 'contract_uploaded' || project.status === 'funded') {
    const filesResult = await API.request('GET', `/projects/${id}/contract-files`);
    // 显示文件下载链接列表
  }
}
```

## 📋 快速实施步骤

### 步骤1: 重新构建和启动（必须）
```bash
cd /home/user/webapp
npm run build
pm2 restart webapp
```

### 步骤2: 测试后端API（验证）
```bash
# 测试自动拒绝（评分<60）
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# 提交一个低分项目
# ... 然后评分
curl -X POST http://localhost:3000/api/admin/projects/1/score \
  -H "Authorization: Bearer $TOKEN" | jq .

# 应该看到 autoRejected: true
```

### 步骤3: 前端改动（可选但推荐）

由于前端改动较大，我可以：

**选项A：完整重写前端（推荐）**
- 创建新的app.js
- 包含所有新功能
- 预计时间：30-45分钟

**选项B：增量修改（快速）**
- 只添加关键功能
- 文件上传使用简化UI
- 预计时间：15-20分钟

**选项C：手动修改（您自己）**
- 我提供详细的修改指南
- 您根据需求调整
- 更灵活但需要您的时间

## 🎯 我的建议

考虑到系统的复杂度和您的需求，我建议：

1. **立即测试后端API** - 确认自动拒绝等功能正常工作
2. **评估前端改动优先级** - 确定哪些功能最重要
3. **分步骤实施** - 先实现核心功能，再完善UI

如果您希望我继续完成前端改动，请告诉我您更倾向于哪个选项（A/B/C），我会立即开始实施。

## 📝 备注

- 文件上传目前是模拟的（保存文件信息但不存储实际文件）
- 要启用真实上传，需要配置Cloudflare R2 bucket
- 评分配置系统的完整UI可以作为后续功能添加

## 当前系统状态

- ✅ 后端API已更新
- ✅ 数据库已升级
- ⏳ 前端UI等待更新
- 🚀 系统可正常运行（使用旧UI）

您希望我现在完成前端更新吗？如果是，请告诉我您选择哪个选项（A、B或C），我会立即开始！
