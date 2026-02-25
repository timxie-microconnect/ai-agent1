// 滴灌投资系统 - 扩展功能前端模块
// 包含：评分配置管理、文件上传、尽调checklist

// ========== 扩展API ==========
const API_EXTENDED = {
  // 评分配置管理
  getScoringConfig: () => API.request('GET', '/admin/scoring-config'),
  getScoringConfigByCategory: (category) => API.request('GET', `/admin/scoring-config/${category}`),
  createScoringConfig: (data) => API.request('POST', '/admin/scoring-config', data),
  updateScoringConfig: (id, data) => API.request('PUT', `/admin/scoring-config/${id}`, data),
  deleteScoringConfig: (id) => API.request('DELETE', `/admin/scoring-config/${id}`),
  batchUpdateScoringConfig: (category, configs) => API.request('POST', '/admin/scoring-config/batch-update', { category, configs }),
  
  // 智能评分增强
  scoreDynamic: (id) => API.request('POST', `/admin/projects/${id}/score-dynamic`),
  overrideScore: (id, data) => API.request('POST', `/admin/projects/${id}/override-score`, data),
  
  // 协议文件上传
  uploadContractFile: (id, data) => API.request('POST', `/admin/projects/${id}/upload-contract`, data),
  getContractFiles: (id) => API.request('GET', `/admin/projects/${id}/contracts`),
  
  // 尽调checklist
  createChecklist: (id) => API.request('POST', `/admin/projects/${id}/create-checklist`),
  getChecklist: (id) => API.request('GET', `/admin/projects/${id}/checklist`),
  uploadDDFile: (id, data) => API.request('POST', `/admin/projects/${id}/upload-dd-file`, data),
  completeChecklistItem: (id, data) => API.request('POST', `/admin/checklist/${id}/complete`, data),
};

// ========== 评分配置管理页面 ==========
function renderScoringConfigPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <i class="fas fa-sliders-h text-2xl text-blue-600"></i>
            <h1 class="text-2xl font-bold text-gray-800">智能评分配置管理</h1>
          </div>
          <div class="flex space-x-4">
            <button onclick="Router.navigate('/admin')" class="text-gray-600 hover:text-blue-600">
              <i class="fas fa-arrow-left mr-2"></i>返回后台
            </button>
          </div>
        </div>
      </nav>
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">品类选择</h2>
          <div id="category-tabs" class="flex space-x-2 overflow-x-auto pb-2">
            <!-- 品类标签将动态加载 -->
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-semibold">评分字段配置</h2>
            <button onclick="addScoringField()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              <i class="fas fa-plus mr-2"></i>添加字段
            </button>
          </div>
          
          <div id="config-form">
            <div class="text-center text-gray-500 py-8">请选择品类查看配置</div>
          </div>
          
          <div class="mt-6 flex justify-end space-x-4">
            <button onclick="saveScoringConfig()" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
              <i class="fas fa-save mr-2"></i>保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  loadScoringConfig();
}

let currentCategory = '女装';
let configData = {};

async function loadScoringConfig() {
  try {
    const response = await API_EXTENDED.getScoringConfig();
    configData = response.data;
    
    // 渲染品类标签
    const categories = Object.keys(configData);
    const tabsContainer = document.getElementById('category-tabs');
    tabsContainer.innerHTML = categories.map(cat => `
      <button 
        onclick="switchCategory('${cat}')" 
        class="px-4 py-2 rounded ${cat === currentCategory ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
      >
        ${cat}
      </button>
    `).join('');
    
    // 渲染当前品类的配置
    renderConfigFields();
  } catch (error) {
    showAlert('加载评分配置失败: ' + error.message, 'error');
  }
}

function switchCategory(category) {
  currentCategory = category;
  loadScoringConfig();
}

function renderConfigFields() {
  const configs = configData[currentCategory] || [];
  const form = document.getElementById('config-form');
  
  if (configs.length === 0) {
    form.innerHTML = '<div class="text-center text-gray-500 py-8">该品类尚未配置评分字段</div>';
    return;
  }
  
  form.innerHTML = `
    <div class="space-y-4">
      ${configs.map((config, index) => `
        <div class="border rounded-lg p-4 bg-gray-50">
          <div class="flex justify-between items-start mb-4">
            <h3 class="font-semibold text-gray-800">${index + 1}. ${config.field_label}</h3>
            <button onclick="removeConfigField(${config.id})" class="text-red-600 hover:text-red-800">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">字段名（英文）</label>
              <input type="text" value="${config.field_name}" 
                     class="w-full px-3 py-2 border rounded" readonly>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">字段标签（中文）</label>
              <input type="text" value="${config.field_label}" 
                     onchange="updateConfigField(${config.id}, 'field_label', this.value)"
                     class="w-full px-3 py-2 border rounded">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">字段类型</label>
              <select onchange="updateConfigField(${config.id}, 'field_type', this.value)"
                      class="w-full px-3 py-2 border rounded">
                <option value="number" ${config.field_type === 'number' ? 'selected' : ''}>数字</option>
                <option value="percentage" ${config.field_type === 'percentage' ? 'selected' : ''}>百分比</option>
                <option value="rating" ${config.field_type === 'rating' ? 'selected' : ''}>评分</option>
                <option value="months" ${config.field_type === 'months' ? 'selected' : ''}>月份</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">阈值</label>
              <input type="number" step="0.1" value="${config.threshold_value || ''}" 
                     onchange="updateConfigField(${config.id}, 'threshold_value', parseFloat(this.value))"
                     class="w-full px-3 py-2 border rounded">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">比较运算符</label>
              <select onchange="updateConfigField(${config.id}, 'comparison_operator', this.value)"
                      class="w-full px-3 py-2 border rounded">
                <option value=">=" ${config.comparison_operator === '>=' ? 'selected' : ''}>≥</option>
                <option value="<=" ${config.comparison_operator === '<=' ? 'selected' : ''}>≤</option>
                <option value=">" ${config.comparison_operator === '>' ? 'selected' : ''}>&gt;</option>
                <option value="<" ${config.comparison_operator === '<' ? 'selected' : ''}>&lt;</option>
                <option value="=" ${config.comparison_operator === '=' ? 'selected' : ''}>==</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">最高分</label>
              <input type="number" step="0.1" value="${config.max_score}" 
                     onchange="updateConfigField(${config.id}, 'max_score', parseFloat(this.value))"
                     class="w-full px-3 py-2 border rounded">
            </div>
            
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">评分规则（JSON）</label>
              <textarea rows="3" 
                        onchange="updateConfigField(${config.id}, 'scoring_rule', this.value)"
                        class="w-full px-3 py-2 border rounded font-mono text-sm">${config.scoring_rule || ''}</textarea>
              <p class="text-xs text-gray-500 mt-1">示例：{"type":"threshold","pass_score":25,"fail_score":0}</p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function updateConfigField(id, field, value) {
  // 更新内存中的配置
  for (const category in configData) {
    const config = configData[category].find(c => c.id === id);
    if (config) {
      config[field] = value;
      break;
    }
  }
}

function removeConfigField(id) {
  if (!confirm('确定删除此配置字段吗？')) return;
  
  API_EXTENDED.deleteScoringConfig(id).then(() => {
    showAlert('删除成功', 'success');
    loadScoringConfig();
  }).catch(err => {
    showAlert('删除失败: ' + err.message, 'error');
  });
}

function addScoringField() {
  const fieldName = prompt('请输入字段名（英文，如：new_field）:');
  if (!fieldName) return;
  
  const fieldLabel = prompt('请输入字段标签（中文）:');
  if (!fieldLabel) return;
  
  const data = {
    category: currentCategory,
    field_name: fieldName,
    field_label: fieldLabel,
    field_type: 'number',
    threshold_value: 0,
    comparison_operator: '>=',
    max_score: 10,
    scoring_rule: '{"type":"threshold","pass_score":10,"fail_score":0}',
    is_required: 1,
    display_order: (configData[currentCategory]?.length || 0) + 1
  };
  
  API_EXTENDED.createScoringConfig(data).then(() => {
    showAlert('添加成功', 'success');
    loadScoringConfig();
  }).catch(err => {
    showAlert('添加失败: ' + err.message, 'error');
  });
}

async function saveScoringConfig() {
  try {
    const configs = configData[currentCategory] || [];
    await API_EXTENDED.batchUpdateScoringConfig(currentCategory, configs);
    showAlert('保存成功', 'success');
  } catch (error) {
    showAlert('保存失败: ' + error.message, 'error');
  }
}

// ========== 文件上传模拟 ==========
function simulateFileUpload(file) {
  return new Promise((resolve) => {
    // 模拟文件上传，实际应使用R2或其他存储
    const fakeUrl = `https://example.com/uploads/${Date.now()}_${file.name}`;
    setTimeout(() => {
      resolve({
        file_name: file.name,
        file_url: fakeUrl,
        file_size: file.size,
        file_type: file.type
      });
    }, 500);
  });
}

// ========== 尽调Checklist弹窗 ==========
function showDueDiligenceModal(projectId) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
      <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-clipboard-check text-blue-600 mr-2"></i>尽调Checklist
        </h2>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      
      <div id="checklist-content" class="p-6">
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
          <p class="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
      
      <div class="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end space-x-4">
        <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">
          关闭
        </button>
        <button onclick="submitDueDiligence(${projectId})" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          <i class="fas fa-check mr-2"></i>完成尽调并审批
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  loadChecklist(projectId);
}

async function loadChecklist(projectId) {
  try {
    // 先创建checklist（如果不存在）
    await API_EXTENDED.createChecklist(projectId);
    
    // 加载checklist
    const response = await API_EXTENDED.getChecklist(projectId);
    const checklist = response.checklist;
    
    const content = document.getElementById('checklist-content');
    content.innerHTML = `
      <div class="space-y-6">
        ${checklist.map(section => `
          <div class="border rounded-lg p-4 bg-gray-50">
            <h3 class="font-semibold text-lg mb-4 text-gray-800">
              <i class="fas fa-folder-open text-blue-600 mr-2"></i>${section.section_label}
            </h3>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">上传文件/图片</label>
              <input type="file" multiple accept="image/*,application/pdf" 
                     onchange="handleDDFileUpload(event, ${projectId}, ${section.id}, '${section.section_name}')"
                     class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
            </div>
            
            <div class="space-y-2 mb-4">
              ${(section.files || []).map(file => `
                <div class="flex items-center justify-between bg-white p-2 rounded border">
                  <div class="flex items-center space-x-2">
                    <i class="fas ${file.file_type?.includes('image') ? 'fa-image' : 'fa-file-pdf'} text-gray-600"></i>
                    <span class="text-sm">${file.file_name}</span>
                  </div>
                  <a href="${file.file_url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
                    <i class="fas fa-download"></i> 下载
                  </a>
                </div>
              `).join('') || '<p class="text-sm text-gray-500">尚未上传文件</p>'}
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
              <textarea rows="2" 
                        onchange="updateChecklistNotes(${section.id}, this.value)"
                        class="w-full px-3 py-2 border rounded text-sm"
                        placeholder="填写核验说明...">${section.notes || ''}</textarea>
            </div>
            
            ${section.completed_at ? `
              <div class="mt-2 text-sm text-green-600">
                <i class="fas fa-check-circle mr-1"></i>已完成于 ${section.completed_at}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    showAlert('加载尽调清单失败: ' + error.message, 'error');
  }
}

async function handleDDFileUpload(event, projectId, checklistId, category) {
  const files = Array.from(event.target.files);
  
  for (const file of files) {
    try {
      showAlert(`正在上传 ${file.name}...`, 'info');
      
      // 模拟上传
      const uploadResult = await simulateFileUpload(file);
      
      // 保存到数据库
      await API_EXTENDED.uploadDDFile(projectId, {
        checklist_id: checklistId,
        file_category: category,
        file_name: uploadResult.file_name,
        file_url: uploadResult.file_url,
        file_size: uploadResult.file_size,
        file_type: uploadResult.file_type,
        uploaded_by: STATE.user.userId
      });
      
      showAlert(`${file.name} 上传成功`, 'success');
    } catch (error) {
      showAlert(`上传失败: ${error.message}`, 'error');
    }
  }
  
  // 重新加载checklist
  setTimeout(() => loadChecklist(projectId), 1000);
}

let checklistNotes = {};

function updateChecklistNotes(checklistId, notes) {
  checklistNotes[checklistId] = notes;
}

async function submitDueDiligence(projectId) {
  try {
    // 标记所有checklist项为完成
    const response = await API_EXTENDED.getChecklist(projectId);
    for (const item of response.checklist) {
      await API_EXTENDED.completeChecklistItem(item.id, {
        notes: checklistNotes[item.id] || '',
        completed_by: STATE.user.userId
      });
    }
    
    // 审批通过
    await API.approveProject(projectId, 'approve', '尽调完成，审批通过');
    
    showAlert('尽调完成，项目已审批通过', 'success');
    document.querySelector('.fixed').remove();
    
    // 刷新项目列表
    if (window.loadAdminProjects) {
      window.loadAdminProjects();
    }
  } catch (error) {
    showAlert('提交失败: ' + error.message, 'error');
  }
}

// ========== 导出到全局 ==========
window.API_EXTENDED = API_EXTENDED;
window.renderScoringConfigPage = renderScoringConfigPage;
window.switchCategory = switchCategory;
window.updateConfigField = updateConfigField;
window.removeConfigField = removeConfigField;
window.addScoringField = addScoringField;
window.saveScoringConfig = saveScoringConfig;
window.showDueDiligenceModal = showDueDiligenceModal;
window.handleDDFileUpload = handleDDFileUpload;
window.updateChecklistNotes = updateChecklistNotes;
window.submitDueDiligence = submitDueDiligence;

// ========== 路由注册 ==========
// 等待主应用Router加载完成后注册扩展路由
if (typeof Router !== 'undefined' && Router.add) {
  Router.add('/admin/scoring-config', renderScoringConfigPage);
}
