// 筛子系统前端模块 - 三级类目联动选择器 + 准入评分

// ==================== 全局状态 ====================
const SIEVE_STATE = {
  categoryTree: null,
  selectedMain: '',
  selectedLevel1: '',
  selectedLevel2: '',
  currentThresholds: null,  // 当前加载的阈值（后台使用）
  admissionResult: null,
  scoringResult: null
};

// ==================== API 封装 ====================
const SIEVE_API = {
  baseURL: '/api/sieve',
  
  async getCategoryTree() {
    const response = await axios.get(`${this.baseURL}/categories/tree`);
    return response.data;
  },
  
  async searchCategories(query) {
    const response = await axios.get(`${this.baseURL}/categories/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
  
  async getThresholds(main, level1, level2) {
    const response = await axios.post(`${this.baseURL}/categories/get-thresholds`, {
      main_category: main,
      level1_category: level1 || null,
      level2_category: level2 || null
    });
    return response.data;
  },
  
  async checkAdmission(data) {
    const response = await axios.post(`${this.baseURL}/check-admission`, data);
    return response.data;
  },
  
  async calculateScore(projectId) {
    const response = await axios.post(`${this.baseURL}/scoring/calculate/${projectId}`);
    return response.data;
  }
};

// ==================== 初始化 ====================
async function initSieveSystem() {
  try {
    const result = await SIEVE_API.getCategoryTree();
    if (result.success) {
      SIEVE_STATE.categoryTree = result.data;
      console.log('✅ 类目树加载成功:', SIEVE_STATE.categoryTree.length, '个主营类目');
      setupCategorySelectors();
    }
  } catch (error) {
    console.error('❌ 加载类目树失败:', error);
    showToast('加载类目数据失败', 'error');
  }
}

// ==================== 三级类目选择器 ====================
function setupCategorySelectors() {
  const mainSelect = document.getElementById('main-category-select');
  const level1Select = document.getElementById('level1-category-select');
  const level2Select = document.getElementById('level2-category-select');
  const searchInput = document.getElementById('category-search-input');
  
  if (!mainSelect || !SIEVE_STATE.categoryTree) return;
  
  // 填充主营类目
  renderMainCategories(mainSelect);
  
  // 事件监听
  mainSelect.addEventListener('change', onMainCategoryChange);
  level1Select?.addEventListener('change', onLevel1CategoryChange);
  level2Select?.addEventListener('change', onLevel2CategoryChange);
  searchInput?.addEventListener('input', debounce(onCategorySearch, 300));
  
  // 点击外部关闭搜索结果
  document.addEventListener('click', (e) => {
    const searchResults = document.getElementById('category-search-results');
    if (searchResults && !e.target.closest('.category-search-container')) {
      searchResults.style.display = 'none';
    }
  });
}

function renderMainCategories(selectEl) {
  selectEl.innerHTML = '<option value="">-- 请选择主营类目（必填）--</option>';
  SIEVE_STATE.categoryTree.forEach(main => {
    const option = document.createElement('option');
    option.value = main.main_category;
    option.textContent = `${main.main_category} (${main.level1_count}个一级类目)`;
    selectEl.appendChild(option);
  });
}

function onMainCategoryChange(e) {
  SIEVE_STATE.selectedMain = e.target.value;
  SIEVE_STATE.selectedLevel1 = '';
  SIEVE_STATE.selectedLevel2 = '';
  
  updateLevel1Select();
  updateLevel2Select();
  updateCategoryDisplay();
  previewThresholds();
}

function onLevel1CategoryChange(e) {
  SIEVE_STATE.selectedLevel1 = e.target.value;
  SIEVE_STATE.selectedLevel2 = '';
  
  updateLevel2Select();
  updateCategoryDisplay();
  previewThresholds();
}

function onLevel2CategoryChange(e) {
  SIEVE_STATE.selectedLevel2 = e.target.value;
  updateCategoryDisplay();
  previewThresholds();
}

function updateLevel1Select() {
  const level1Select = document.getElementById('level1-category-select');
  const level2Select = document.getElementById('level2-category-select');
  
  if (!level1Select) return;
  
  level1Select.innerHTML = '<option value="">-- 请选择一级类目（可选）--</option>';
  level2Select.innerHTML = '<option value="">-- 请先选择一级类目 --</option>';
  level1Select.disabled = !SIEVE_STATE.selectedMain;
  level2Select.disabled = true;
  
  if (SIEVE_STATE.selectedMain && SIEVE_STATE.categoryTree) {
    const mainCat = SIEVE_STATE.categoryTree.find(m => m.main_category === SIEVE_STATE.selectedMain);
    if (mainCat?.level1_categories) {
      mainCat.level1_categories.forEach(l1 => {
        const option = document.createElement('option');
        option.value = l1.level1_category;
        option.textContent = `${l1.level1_category} (${l1.level2_count}个二级类目)`;
        level1Select.appendChild(option);
      });
    }
  }
}

function updateLevel2Select() {
  const level2Select = document.getElementById('level2-category-select');
  
  if (!level2Select) return;
  
  level2Select.innerHTML = '<option value="">-- 请选择二级类目（可选）--</option>';
  level2Select.disabled = !SIEVE_STATE.selectedLevel1;
  
  if (SIEVE_STATE.selectedMain && SIEVE_STATE.selectedLevel1 && SIEVE_STATE.categoryTree) {
    const mainCat = SIEVE_STATE.categoryTree.find(m => m.main_category === SIEVE_STATE.selectedMain);
    if (mainCat) {
      const level1Cat = mainCat.level1_categories.find(l => l.level1_category === SIEVE_STATE.selectedLevel1);
      if (level1Cat?.level2_categories) {
        level1Cat.level2_categories.forEach(l2 => {
          const option = document.createElement('option');
          option.value = l2;
          option.textContent = l2;
          level2Select.appendChild(option);
        });
      }
    }
  }
}

function updateCategoryDisplay() {
  const display = document.getElementById('selected-category-path');
  const hiddenInput = document.getElementById('selected_category_json');
  
  if (!display) return;
  
  const parts = [];
  if (SIEVE_STATE.selectedMain) parts.push(SIEVE_STATE.selectedMain);
  if (SIEVE_STATE.selectedLevel1) parts.push(SIEVE_STATE.selectedLevel1);
  if (SIEVE_STATE.selectedLevel2) parts.push(SIEVE_STATE.selectedLevel2);
  
  if (parts.length > 0) {
    const levelText = SIEVE_STATE.selectedLevel2 ? '二级' : (SIEVE_STATE.selectedLevel1 ? '一级' : '主营');
    display.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fas fa-check-circle text-green-500"></i>
        <span class="font-medium">${parts.join(' > ')}</span>
        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${levelText}类目</span>
      </div>
    `;
    display.classList.remove('text-gray-400');
    display.classList.add('text-gray-700');
  } else {
    display.innerHTML = '<i class="fas fa-info-circle text-gray-400 mr-2"></i>未选择（至少需要选择主营类目）';
    display.classList.remove('text-gray-700');
    display.classList.add('text-gray-400');
  }
  
  // 保存到隐藏字段
  if (hiddenInput) {
    hiddenInput.value = JSON.stringify({
      main: SIEVE_STATE.selectedMain,
      level1: SIEVE_STATE.selectedLevel1,
      level2: SIEVE_STATE.selectedLevel2
    });
  }
}

// ==================== 搜索功能 ====================
async function onCategorySearch(e) {
  const query = e.target.value.trim();
  const resultsContainer = document.getElementById('category-search-results');
  
  if (!resultsContainer) return;
  
  if (query.length < 1) {
    resultsContainer.style.display = 'none';
    return;
  }
  
  try {
    const result = await SIEVE_API.searchCategories(query);
    if (result.success && result.data.length > 0) {
      displaySearchResults(result.data, resultsContainer);
    } else {
      resultsContainer.innerHTML = '<div class="p-3 text-gray-500 text-sm text-center">未找到匹配类目</div>';
      resultsContainer.style.display = 'block';
    }
  } catch (error) {
    console.error('搜索失败:', error);
  }
}

function displaySearchResults(results, container) {
  container.innerHTML = results.slice(0, 20).map(item => {
    const fullPath = [
      item.main,
      item.level1,
      item.level2
    ].filter(Boolean).join(' > ');
    
    const level = item.level2 ? '二级' : (item.level1 ? '一级' : '主营');
    const displayName = item.level2 || item.level1 || item.main;
    
    return `
      <div class="p-3 hover:bg-blue-50 cursor-pointer border-b category-search-item transition"
           data-main="${item.main}"
           data-level1="${item.level1 || ''}"
           data-level2="${item.level2 || ''}">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-800">${displayName}</div>
            <div class="text-xs text-gray-500 mt-1">${fullPath}</div>
          </div>
          <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${level}</span>
        </div>
      </div>
    `;
  }).join('');
  
  if (results.length > 20) {
    container.innerHTML += `<div class="p-2 text-xs text-gray-500 text-center bg-gray-50">仅显示前20条结果</div>`;
  }
  
  container.style.display = 'block';
  
  // 绑定点击事件
  container.querySelectorAll('.category-search-item').forEach(item => {
    item.addEventListener('click', () => selectCategoryFromSearch(item.dataset));
  });
}

function selectCategoryFromSearch(data) {
  SIEVE_STATE.selectedMain = data.main;
  SIEVE_STATE.selectedLevel1 = data.level1 || '';
  SIEVE_STATE.selectedLevel2 = data.level2 || '';
  
  // 更新下拉框
  const mainSelect = document.getElementById('main-category-select');
  mainSelect.value = SIEVE_STATE.selectedMain;
  
  updateLevel1Select();
  if (SIEVE_STATE.selectedLevel1) {
    document.getElementById('level1-category-select').value = SIEVE_STATE.selectedLevel1;
    updateLevel2Select();
  }
  if (SIEVE_STATE.selectedLevel2) {
    document.getElementById('level2-category-select').value = SIEVE_STATE.selectedLevel2;
  }
  
  updateCategoryDisplay();
  previewThresholds();
  
  // 关闭搜索结果
  document.getElementById('category-search-results').style.display = 'none';
  document.getElementById('category-search-input').value = '';
}

// ==================== 阈值预览（后台静默加载，不显示给用户）====================
async function previewThresholds() {
  // 静默加载阈值，不显示给融资方
  const previewContainer = document.getElementById('threshold-preview');
  if (previewContainer) {
    previewContainer.style.display = 'none';  // 隐藏阈值预览
  }
  
  if (!SIEVE_STATE.selectedMain) return;
  
  try {
    const result = await SIEVE_API.getThresholds(
      SIEVE_STATE.selectedMain,
      SIEVE_STATE.selectedLevel1,
      SIEVE_STATE.selectedLevel2
    );
    
    if (result.success && result.data) {
      // 将阈值保存到全局状态，供提交时使用
      SIEVE_STATE.currentThresholds = result.data;
      console.log('✅ 阈值已加载（后台）:', result.data);
    }
  } catch (error) {
    console.error('❌ 加载阈值失败:', error);
    // 静默失败，不显示给用户
  }
}

// ==================== 准入检查 ====================
async function checkSieveAdmission(formData) {
  try {
    const result = await SIEVE_API.checkAdmission(formData);
    SIEVE_STATE.admissionResult = result.data;
    return result;
  } catch (error) {
    console.error('准入检查失败:', error);
    throw error;
  }
}

function displayAdmissionResult(result) {
  const container = document.getElementById('admission-result');
  if (!container) return;
  
  const data = result.data;
  const passed = data.admission_result === '可评分';
  
  container.innerHTML = `
    <div class="bg-${passed ? 'green' : 'red'}-50 border border-${passed ? 'green' : 'red'}-200 rounded-lg p-4">
      <div class="flex items-center gap-3 mb-4">
        <i class="fas fa-${passed ? 'check-circle text-green-600' : 'times-circle text-red-600'} text-2xl"></i>
        <div>
          <h3 class="font-bold text-${passed ? 'green' : 'red'}-900 text-lg">${data.admission_result}</h3>
          <p class="text-sm text-${passed ? 'green' : 'red'}-700">${data.summary}</p>
        </div>
      </div>
      
      <div class="space-y-2">
        ${data.details.map(detail => {
          const itemPassed = detail.result === '达标';
          return `
            <div class="flex items-center justify-between bg-white p-3 rounded">
              <div class="flex items-center gap-2">
                <i class="fas fa-${itemPassed ? 'check' : 'times'} text-${itemPassed ? 'green' : 'red'}-500"></i>
                <span class="font-medium text-gray-700">${detail.field}</span>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold">${detail.actual_value}</div>
                <div class="text-xs text-gray-500">要求: ${detail.threshold_value}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      ${!passed ? `
        <div class="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
          <div class="text-sm text-yellow-800">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <strong>未通过原因：</strong>${data.fail_reasons.join('；')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ==================== 评分展示 ====================
function displayScoringResult(scoring) {
  if (!scoring) return '';
  
  const passed = scoring.total_score >= 60;
  
  return `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-800">筛子评分结果</h3>
        <div class="text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}">
          ${scoring.total_score.toFixed(1)}分
        </div>
      </div>
      
      <div class="mb-4 p-4 rounded-lg ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
        <div class="flex items-center gap-2">
          <i class="fas fa-${passed ? 'check-circle text-green-600' : 'times-circle text-red-600'} text-xl"></i>
          <span class="font-semibold ${passed ? 'text-green-900' : 'text-red-900'}">
            ${passed ? '✅ 评分通过（≥60分）' : '❌ 评分未通过（<60分）'}
          </span>
        </div>
      </div>
      
      <div class="space-y-3">
        ${scoring.details.map(detail => `
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-700">${detail.field_name}</span>
              <span class="text-lg font-bold text-blue-600">${detail.sub_score.toFixed(1)}分</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div class="text-gray-500 text-xs">实际值</div>
                <div class="font-semibold">${detail.actual_display}</div>
              </div>
              <div>
                <div class="text-gray-500 text-xs">阈值</div>
                <div class="font-semibold">${detail.threshold_display}</div>
              </div>
              <div>
                <div class="text-gray-500 text-xs">提升幅度</div>
                <div class="font-semibold text-green-600">+${(detail.uplift * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div class="mt-2 text-xs text-gray-600">
              权重 ${(detail.weight * 100).toFixed(0)}% × 基础分 ${detail.base_score.toFixed(1)} = ${detail.sub_score.toFixed(1)}分
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <i class="fas fa-info-circle mr-1"></i>
        使用${scoring.threshold_level}阈值 | 权重配置：14日ROI 35%、结算率 30%、净ROI 20%、消耗 15%
      </div>
    </div>
  `;
}

// ==================== 工具函数 ====================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showToast(message, type = 'info') {
  // 简单toast提示
  console.log(`[${type.toUpperCase()}] ${message}`);
  alert(message);
}

// ==================== Excel上传功能 ====================
let revenueDataCache = null;
let volatilityCache = null;

// 下载Excel模板
function downloadExcelTemplate() {
  window.location.href = '/api/investment/template';
}

// 初始化Excel上传区域
function initExcelUpload() {
  const uploadArea = document.getElementById('excel-upload-area');
  const fileInput = document.getElementById('excel-file-input');
  const resultDiv = document.getElementById('excel-upload-result');
  
  if (!uploadArea || !fileInput) return;
  
  // 点击上传区域触发文件选择
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  // 文件选择后处理
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleExcelFile(file);
    }
  });
  
  // 拖拽上传
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-blue-500', 'bg-blue-50');
  });
  
  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
  });
  
  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
    
    const file = e.dataTransfer.files[0];
    if (file) {
      fileInput.files = e.dataTransfer.files;
      await handleExcelFile(file);
    }
  });
}

// 处理Excel文件
async function handleExcelFile(file) {
  const resultDiv = document.getElementById('excel-upload-result');
  const uploadArea = document.getElementById('excel-upload-area');
  
  try {
    // 显示加载状态
    resultDiv.className = 'mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg';
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fas fa-spinner fa-spin text-blue-600"></i>
        <span class="text-blue-800">正在解析文件...</span>
      </div>
    `;
    
    // 解析CSV文件
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('文件格式错误：数据行数不足');
    }
    
    // 跳过标题行，解析数据
    const data = [];
    for (let i = 1; i < lines.length && data.length < 90; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 2) {
        const date = parts[0].trim();
        const amount = parseFloat(parts[1].trim());
        
        if (date && !isNaN(amount) && amount >= 0) {
          data.push({ date, amount });
        }
      }
    }
    
    if (data.length !== 90) {
      throw new Error(`文件格式错误：需要90天数据，当前只有${data.length}天`);
    }
    
    // 计算波动率
    const amounts = data.map(d => d.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const volatility = stdDev / avg; // 保存为小数形式 (0.0795 表示 7.95%)
    
    // 缓存数据
    revenueDataCache = data;
    volatilityCache = volatility;
    
    // 存储到隐藏字段
    document.getElementById('revenue_data_json').value = JSON.stringify(data);
    document.getElementById('daily_revenue_volatility').value = volatility.toFixed(4); // 保存4位小数
    
    // 显示成功结果
    resultDiv.className = 'mt-4 p-4 bg-green-50 border border-green-200 rounded-lg';
    resultDiv.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center gap-2 text-green-800">
          <i class="fas fa-check-circle text-green-600 text-xl"></i>
          <span class="font-semibold">Excel文件解析成功</span>
        </div>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-gray-600">数据天数</div>
            <div class="font-bold text-gray-900">${data.length}天</div>
          </div>
          <div>
            <div class="text-gray-600">平均日净成交</div>
            <div class="font-bold text-gray-900">¥${avg.toFixed(2)}</div>
          </div>
          <div>
            <div class="text-gray-600">波动率</div>
            <div class="font-bold ${volatility > 0.10 ? 'text-red-600' : 'text-green-600'}">
              ${(volatility * 100).toFixed(2)}%
            </div>
          </div>
        </div>
        <div class="text-xs text-gray-600">
          <i class="fas fa-info-circle mr-1"></i>
          波动率越低表示经营越稳定，低于10%为优秀
        </div>
      </div>
    `;
    
    // 更新上传区域显示
    uploadArea.innerHTML = `
      <i class="fas fa-file-excel text-4xl text-green-600 mb-3"></i>
      <p class="text-green-600 font-semibold mb-2">✓ ${file.name}</p>
      <p class="text-sm text-gray-500">点击可重新上传</p>
    `;
    
  } catch (error) {
    console.error('Excel解析错误:', error);
    resultDiv.className = 'mt-4 p-4 bg-red-50 border border-red-200 rounded-lg';
    resultDiv.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fas fa-exclamation-circle text-red-600"></i>
        <span class="text-red-800 font-semibold">文件解析失败</span>
      </div>
      <p class="text-sm text-red-700 mt-2">${error.message}</p>
      <p class="text-xs text-red-600 mt-2">请确保文件格式正确：第一列为日期，第二列为净成交金额</p>
    `;
    
    // 清空缓存
    revenueDataCache = null;
    volatilityCache = null;
    document.getElementById('revenue_data_json').value = '';
    document.getElementById('daily_revenue_volatility').value = '';
  }
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.SIEVE = {
    init: initSieveSystem,
    checkAdmission: checkSieveAdmission,
    displayAdmissionResult,
    displayScoringResult,
    STATE: SIEVE_STATE
  };
  
  // 导出Excel相关函数到全局
  window.downloadExcelTemplate = downloadExcelTemplate;
  window.initExcelUpload = initExcelUpload;
  window.handleExcelFile = handleExcelFile;
}
