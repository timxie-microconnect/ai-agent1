// 筛子系统前端模块 - 三级类目联动选择器 + 准入评分

// ==================== 全局状态 ====================
const SIEVE_STATE = {
  categoryTree: null,
  selectedMain: '',
  selectedLevel1: '',
  selectedLevel2: '',
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
    const params = new URLSearchParams();
    if (main) params.append('main_category', main);
    if (level1) params.append('level1_category', level1);
    if (level2) params.append('level2_category', level2);
    const response = await axios.get(`${this.baseURL}/thresholds?${params.toString()}`);
    return response.data;
  },
  
  async checkAdmission(data) {
    const response = await axios.post(`${this.baseURL}/admission/check`, data);
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
      item.main_category,
      item.level1_category,
      item.level2_category
    ].filter(Boolean).join(' > ');
    
    const level = item.level2_category ? '二级' : (item.level1_category ? '一级' : '主营');
    
    return `
      <div class="p-3 hover:bg-blue-50 cursor-pointer border-b category-search-item transition"
           data-main="${item.main_category}"
           data-level1="${item.level1_category || ''}"
           data-level2="${item.level2_category || ''}">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-800">${item.level2_category || item.level1_category || item.main_category}</div>
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

// ==================== 阈值预览 ====================
async function previewThresholds() {
  const previewContainer = document.getElementById('threshold-preview');
  if (!previewContainer || !SIEVE_STATE.selectedMain) return;
  
  previewContainer.innerHTML = '<div class="text-sm text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>加载阈值...</div>';
  
  try {
    const result = await SIEVE_API.getThresholds(
      SIEVE_STATE.selectedMain,
      SIEVE_STATE.selectedLevel1,
      SIEVE_STATE.selectedLevel2
    );
    
    if (result.success && result.data) {
      const t = result.data.threshold;
      const fallbackText = result.data.fallback_level === 'level2' ? '精确匹配' :
                          result.data.fallback_level === 'level1' ? '一级兜底（取最严）' : '主营兜底（取最严）';
      
      previewContainer.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-semibold text-blue-900">准入阈值标准</h4>
            <span class="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">${fallbackText}</span>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-white p-2 rounded">
              <div class="text-gray-600 text-xs">净成交ROI</div>
              <div class="font-semibold text-lg text-gray-900">≥ ${(t.net_roi_min * 100).toFixed(2)}%</div>
            </div>
            <div class="bg-white p-2 rounded">
              <div class="text-gray-600 text-xs">14日结算ROI</div>
              <div class="font-semibold text-lg text-gray-900">≥ ${(t.settle_roi_min * 100).toFixed(2)}%</div>
            </div>
            <div class="bg-white p-2 rounded">
              <div class="text-gray-600 text-xs">14日订单结算率</div>
              <div class="font-semibold text-lg text-gray-900">≥ ${(t.settle_rate_min * 100).toFixed(2)}%</div>
            </div>
            <div class="bg-white p-2 rounded">
              <div class="text-gray-600 text-xs">历史消耗</div>
              <div class="font-semibold text-lg text-gray-900">≥ ¥${t.spend_min.toLocaleString()}</div>
            </div>
          </div>
          <div class="mt-3 text-xs text-blue-700">
            <i class="fas fa-info-circle mr-1"></i>
            四项指标需全部达标才能通过准入审核
          </div>
        </div>
      `;
    }
  } catch (error) {
    previewContainer.innerHTML = '<div class="text-sm text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>加载失败</div>';
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

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.SIEVE = {
    init: initSieveSystem,
    checkAdmission: checkSieveAdmission,
    displayAdmissionResult,
    displayScoringResult,
    STATE: SIEVE_STATE
  };
}
