// ==================== 筛子系统配置管理 ====================

// 筛子系统当前配置
let sieveConfig = {
  weights: {
    net_roi: 0.20,
    settle_roi: 0.35,
    settle_rate: 0.30,
    history_spend: 0.15
  },
  k_values: {
    net_roi: 3.0,
    settle_roi: 4.0,
    settle_rate: 4.0,
    history_spend: 1.5
  }
};

function renderScoringConfigPage() {
  if (!STATE.token || !STATE.user?.isAdmin) {
    Router.navigate('/admin/login');
    return;
  }

  // 先加载配置，然后渲染页面
  loadSieveConfigFromServer().then(() => {
    renderConfigPageContent();
  });
}

function renderConfigPageContent() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <i class="fas fa-filter text-2xl text-purple-600"></i>
            <h1 class="text-2xl font-bold text-gray-800">筛子系统配置</h1>
          </div>
          <div class="flex space-x-4">
            <button onclick="Router.navigate('/admin')" class="text-gray-600 hover:text-blue-600">
              <i class="fas fa-arrow-left mr-2"></i>返回后台
            </button>
          </div>
        </div>
      </nav>
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- 系统说明 -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 class="text-lg font-bold mb-3 flex items-center">
            <i class="fas fa-info-circle text-blue-600 mr-2"></i>
            筛子系统说明
          </h2>
          <div class="text-sm text-gray-700 space-y-2">
            <p>• 筛子系统采用边际递减评分算法：Score = 100 × (1 - e^(-k×uplift))</p>
            <p>• uplift = (实际值 / 阈值 - 1)，表示超出阈值的提升幅度</p>
            <p>• k值控制边际递减速度，k值越大，边际递减越快</p>
            <p>• 总分 = 四项指标得分的加权和，满分100分</p>
            <p>• 系统共有13个主营类目、111个一级类目、1393个二级类目，1487条精确阈值</p>
          </div>
        </div>

        <!-- 权重配置 -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold mb-6 flex items-center">
            <i class="fas fa-balance-scale text-purple-600 mr-2"></i>
            指标权重配置
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 净成交ROI -->
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <label class="font-semibold text-gray-700">净成交ROI</label>
                <span class="text-2xl font-bold text-blue-600" id="weight-net-roi-display">
                  ${(sieveConfig.weights.net_roi * 100).toFixed(0)}%
                </span>
              </div>
              <input type="range" min="0" max="100" step="1" value="${sieveConfig.weights.net_roi * 100}"
                     id="weight-net-roi" oninput="updateWeight('net_roi', this.value)"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <p class="text-xs text-gray-500 mt-2">实际ROI与阈值对比，衡量净盈利能力</p>
            </div>

            <!-- 14日结算ROI -->
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <label class="font-semibold text-gray-700">14日结算ROI</label>
                <span class="text-2xl font-bold text-green-600" id="weight-settle-roi-display">
                  ${(sieveConfig.weights.settle_roi * 100).toFixed(0)}%
                </span>
              </div>
              <input type="range" min="0" max="100" step="1" value="${sieveConfig.weights.settle_roi * 100}"
                     id="weight-settle-roi" oninput="updateWeight('settle_roi', this.value)"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <p class="text-xs text-gray-500 mt-2">短期回款速度，衡量资金周转效率</p>
            </div>

            <!-- 14日订单结算率 -->
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <label class="font-semibold text-gray-700">14日订单结算率</label>
                <span class="text-2xl font-bold text-orange-600" id="weight-settle-rate-display">
                  ${(sieveConfig.weights.settle_rate * 100).toFixed(0)}%
                </span>
              </div>
              <input type="range" min="0" max="100" step="1" value="${sieveConfig.weights.settle_rate * 100}"
                     id="weight-settle-rate" oninput="updateWeight('settle_rate', this.value)"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <p class="text-xs text-gray-500 mt-2">订单确认率，衡量经营稳定性</p>
            </div>

            <!-- 历史消耗金额 -->
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <label class="font-semibold text-gray-700">历史消耗金额</label>
                <span class="text-2xl font-bold text-purple-600" id="weight-history-spend-display">
                  ${(sieveConfig.weights.history_spend * 100).toFixed(0)}%
                </span>
              </div>
              <input type="range" min="0" max="100" step="1" value="${sieveConfig.weights.history_spend * 100}"
                     id="weight-history-spend" oninput="updateWeight('history_spend', this.value)"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <p class="text-xs text-gray-500 mt-2">投流规模，衡量企业实力</p>
            </div>
          </div>

          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-gray-700 font-semibold">权重总和：</span>
              <span class="text-3xl font-bold" id="total-weight-display">100%</span>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-exclamation-triangle text-yellow-600 mr-1"></i>
              权重总和必须等于100%，系统会自动调整
            </p>
          </div>
        </div>

        <!-- K值配置 -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold mb-6 flex items-center">
            <i class="fas fa-chart-line text-purple-600 mr-2"></i>
            边际递减系数（k值）配置
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 净成交ROI k值 -->
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <label class="font-semibold text-gray-700">净成交ROI k值</label>
                <span class="text-xl font-bold text-blue-600" id="k-net-roi-display">
                  ${sieveConfig.k_values.net_roi.toFixed(1)}
                </span>
              </div>
              <input type="range" min="0.5" max="10" step="0.1" value="${sieveConfig.k_values.net_roi}"
                     id="k-net-roi" oninput="updateKValue('net_roi', this.value)"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <p class="text-xs text-gray-500 mt-2">推荐范围：2.0-5.0，当前：${sieveConfig.k_values.net_roi.toFixed(1)}</p>
            </div>

            <!-- 14日结算ROI k值 -->
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <label class="font-semibold text-gray-700">14日结算ROI k值</label>
                <span class="text-xl font-bold text-green-600" id="k-settle-roi-display">
                  ${sieveConfig.k_values.settle_roi.toFixed(1)}
                </span>
              </div>
              <input type="range" min="0.5" max="10" step="0.1" value="${sieveConfig.k_values.settle_roi}"
                     id="k-settle-roi" oninput="updateKValue('settle_roi', this.value)"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <p class="text-xs text-gray-500 mt-2">推荐范围：3.0-6.0，当前：${sieveConfig.k_values.settle_roi.toFixed(1)}</p>
            </div>

            <!-- 14日订单结算率 k值 -->
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <label class="font-semibold text-gray-700">14日订单结算率 k值</label>
                <span class="text-xl font-bold text-orange-600" id="k-settle-rate-display">
                  ${sieveConfig.k_values.settle_rate.toFixed(1)}
                </span>
              </div>
              <input type="range" min="0.5" max="10" step="0.1" value="${sieveConfig.k_values.settle_rate}"
                     id="k-settle-rate" oninput="updateKValue('settle_rate', this.value)"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <p class="text-xs text-gray-500 mt-2">推荐范围：3.0-6.0，当前：${sieveConfig.k_values.settle_rate.toFixed(1)}</p>
            </div>

            <!-- 历史消耗 k值 -->
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <label class="font-semibold text-gray-700">历史消耗 k值</label>
                <span class="text-xl font-bold text-purple-600" id="k-history-spend-display">
                  ${sieveConfig.k_values.history_spend.toFixed(1)}
                </span>
              </div>
              <input type="range" min="0.5" max="10" step="0.1" value="${sieveConfig.k_values.history_spend}"
                     id="k-history-spend" oninput="updateKValue('history_spend', this.value)"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <p class="text-xs text-gray-500 mt-2">推荐范围：1.0-3.0，当前：${sieveConfig.k_values.history_spend.toFixed(1)}</p>
            </div>
          </div>

          <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-gray-700 mb-2">
              <i class="fas fa-lightbulb text-yellow-600 mr-2"></i>
              <strong>k值详细说明：</strong>
            </p>
            <div class="text-xs text-gray-600 space-y-1 ml-6">
              <p>• k值控制"边际递减"的速度，即超出阈值越多，每多1%的提升带来的分数增长越少</p>
              <p>• <strong>k值越大</strong> → 边际递减越快 → 鼓励达标即可，不过度追求极限值</p>
              <p>• <strong>k值越小</strong> → 边际递减越慢 → 鼓励持续提升，高表现获得更高分数</p>
              <p>• <strong>实例（k=4时）</strong>：超阈值25%得52分，超50%得70分，超100%得86分</p>
              <p>• <strong>实例（k=2时）</strong>：超阈值25%得39分，超50%得63分，超100%得86分</p>
              <p>• <strong>建议</strong>：重要指标用较大k值（4-6），次要指标用较小k值（1-3）</p>
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold mb-6 flex items-center">
            <i class="fas fa-database text-purple-600 mr-2"></i>
            类目阈值配置
          </h2>
          
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">选择主营类目：</label>
            <select id="threshold-main-category" onchange="loadCategoryThresholds()" 
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="">-- 请选择主营类目 --</option>
            </select>
          </div>
          
          <div id="threshold-config-area" class="hidden">
            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 mb-2">选择二级类目：</label>
              <select id="threshold-level2-category" onchange="loadSelectedThreshold()" 
                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="">-- 请选择二级类目 --</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">
                <i class="fas fa-info-circle mr-1"></i>
                系统会按照"二级类目 → 一级类目 → 主营类目"的顺序进行兜底匹配
              </p>
            </div>
            
            <div id="threshold-form" class="hidden">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">净成交ROI（阈值）</label>
                  <input type="number" step="0.01" id="threshold-net-roi" 
                         class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                         placeholder="例如：1.6">
                  <p class="text-xs text-gray-500 mt-1">倍数，如1.6表示160%</p>
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">14日结算ROI（阈值）</label>
                  <input type="number" step="0.01" id="threshold-settle-roi" 
                         class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                         placeholder="例如：1.47">
                  <p class="text-xs text-gray-500 mt-1">倍数，如1.47表示147%</p>
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">14日订单结算率（阈值）</label>
                  <input type="number" step="0.01" id="threshold-settle-rate" 
                         class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                         placeholder="例如：0.79">
                  <p class="text-xs text-gray-500 mt-1">小数，如0.79表示79%</p>
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">历史消耗金额（阈值）</label>
                  <input type="number" step="1000" id="threshold-history-spend" 
                         class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                         placeholder="例如：100000">
                  <p class="text-xs text-gray-500 mt-1">单位：元</p>
                </div>
              </div>
              
              <div class="mt-4 flex justify-end space-x-4">
                <button onclick="saveThresholdConfig()" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <i class="fas fa-save mr-2"></i>保存阈值
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 配置保存按钮 -->
        <div class="flex justify-end space-x-4">
          <button onclick="resetSieveConfig()" class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
            <i class="fas fa-undo mr-2"></i>恢复默认
          </button>
          <button onclick="saveSieveConfig()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <i class="fas fa-save mr-2"></i>保存配置
          </button>
        </div>
      </div>
    </div>
  `;
  
  // 加载类目树
  loadCategoryTreeForThresholds();
}

function updateWeight(field, value) {
  const percentage = parseInt(value);
  sieveConfig.weights[field] = percentage / 100;
  
  // 更新显示
  document.getElementById(`weight-${field.replace('_', '-')}-display`).textContent = `${percentage}%`;
  
  // 计算总和
  const total = Object.values(sieveConfig.weights).reduce((sum, w) => sum + w, 0);
  const totalPercentage = Math.round(total * 100);
  const totalDisplay = document.getElementById('total-weight-display');
  totalDisplay.textContent = `${totalPercentage}%`;
  
  // 如果不等于100%，标记为警告
  if (totalPercentage !== 100) {
    totalDisplay.classList.add('text-red-600');
  } else {
    totalDisplay.classList.remove('text-red-600');
    totalDisplay.classList.add('text-green-600');
  }
}

function updateKValue(field, value) {
  const kValue = parseFloat(value);
  sieveConfig.k_values[field] = kValue;
  
  // 更新显示
  document.getElementById(`k-${field.replace('_', '-')}-display`).textContent = kValue.toFixed(1);
  
  // 更新推荐范围提示
  const input = document.getElementById(`k-${field.replace('_', '-')}`);
  const hint = input.nextElementSibling;
  const currentText = hint.textContent.split('，当前：')[0];
  hint.textContent = `${currentText}，当前：${kValue.toFixed(1)}`;
}

function resetSieveConfig() {
  if (!confirm('确定要恢复默认配置吗？')) {
    return;
  }
  
  // 恢复默认值
  sieveConfig = {
    weights: {
      net_roi: 0.20,
      settle_roi: 0.35,
      settle_rate: 0.30,
      history_spend: 0.15
    },
    k_values: {
      net_roi: 3.0,
      settle_roi: 4.0,
      settle_rate: 4.0,
      history_spend: 1.5
    }
  };
  
  // 重新渲染页面
  renderScoringConfigPage();
  showAlert('已恢复默认配置', 'success');
}

async function saveSieveConfig() {
  // 检查权重总和
  const total = Object.values(sieveConfig.weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(total - 1.0) > 0.01) {
    showAlert('权重总和必须等于100%！', 'error');
    return;
  }
  
  try {
    showAlert('保存配置中...', 'info');
    
    // 调用API保存配置
    const response = await axios.post('/api/sieve/config', sieveConfig);
    
    if (response.data.success) {
      showAlert('配置保存成功！', 'success');
    } else {
      showAlert('保存失败：' + response.data.error, 'error');
    }
  } catch (error) {
    showAlert('保存失败：' + error.message, 'error');
  }
}

// ==================== 阈值配置相关函数 ====================

let categoryTreeData = [];
let currentThresholdData = null;

async function loadSieveConfigFromServer() {
  try {
    const response = await axios.get('/api/sieve/config');
    if (response.data.success) {
      const config = response.data.data;
      sieveConfig.weights = config.weights;
      sieveConfig.k_values = config.k_values;
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    // 使用默认配置
  }
}

async function loadCategoryTreeForThresholds() {
  try {
    const response = await axios.get('/api/sieve/categories/tree');
    categoryTreeData = response.data.data || [];
    
    // 填充主营类目下拉框
    const mainSelect = document.getElementById('threshold-main-category');
    if (mainSelect) {
      mainSelect.innerHTML = '<option value="">-- 请选择主营类目 --</option>' +
        categoryTreeData.map(cat => `<option value="${cat.main_category}">${cat.main_category}</option>`).join('');
    }
  } catch (error) {
    showAlert('加载类目失败：' + error.message, 'error');
  }
}

async function loadCategoryThresholds() {
  const mainCategory = document.getElementById('threshold-main-category').value;
  if (!mainCategory) {
    document.getElementById('threshold-config-area').classList.add('hidden');
    return;
  }
  
  // 显示配置区域
  document.getElementById('threshold-config-area').classList.remove('hidden');
  
  // 获取选中的主营类目数据
  const mainCat = categoryTreeData.find(c => c.main_category === mainCategory);
  if (!mainCat || !mainCat.level1_categories) {
    return;
  }
  
  // 构建二级类目列表（包含路径）
  const level2Options = [];
  mainCat.level1_categories.forEach(level1 => {
    if (level1.level2_categories) {
      level1.level2_categories.forEach(level2 => {
        level2Options.push({
          main: mainCategory,
          level1: level1.level1_category,
          level2: level2,
          label: `${level1.level1_category} > ${level2}`
        });
      });
    }
  });
  
  // 填充二级类目下拉框
  const level2Select = document.getElementById('threshold-level2-category');
  level2Select.innerHTML = '<option value="">-- 请选择二级类目 --</option>' +
    level2Options.map(opt => 
      `<option value="${JSON.stringify({main: opt.main, level1: opt.level1, level2: opt.level2}).replace(/"/g, '&quot;')}">${opt.label}</option>`
    ).join('');
}

async function loadSelectedThreshold() {
  const level2Data = document.getElementById('threshold-level2-category').value;
  if (!level2Data) {
    document.getElementById('threshold-form').classList.add('hidden');
    return;
  }
  
  try {
    const { main, level1, level2 } = JSON.parse(level2Data);
    
    // 调用API获取阈值
    const response = await axios.post('/api/sieve/categories/get-thresholds', {
      main_category: main,
      level1_category: level1,
      level2_category: level2
    });
    
    if (response.data.success) {
      const thresholds = response.data.data;
      currentThresholdData = { main, level1, level2, ...thresholds };
      
      // 填充表单
      document.getElementById('threshold-net-roi').value = thresholds.net_roi_min || '';
      document.getElementById('threshold-settle-roi').value = thresholds.settle_roi_min || '';
      document.getElementById('threshold-settle-rate').value = thresholds.settle_rate_min || '';
      document.getElementById('threshold-history-spend').value = thresholds.history_spend_min || '';
      
      // 显示表单
      document.getElementById('threshold-form').classList.remove('hidden');
    }
  } catch (error) {
    showAlert('加载阈值失败：' + error.message, 'error');
  }
}

async function saveThresholdConfig() {
  if (!currentThresholdData) {
    showAlert('请先选择类目', 'error');
    return;
  }
  
  const netRoi = parseFloat(document.getElementById('threshold-net-roi').value);
  const settleRoi = parseFloat(document.getElementById('threshold-settle-roi').value);
  const settleRate = parseFloat(document.getElementById('threshold-settle-rate').value);
  const historySpend = parseFloat(document.getElementById('threshold-history-spend').value);
  
  if (isNaN(netRoi) || isNaN(settleRoi) || isNaN(settleRate) || isNaN(historySpend)) {
    showAlert('请填写所有阈值字段！', 'error');
    return;
  }
  
  try {
    showAlert('保存阈值中...', 'info');
    
    // 调用API更新阈值
    const response = await axios.put('/api/sieve/thresholds', {
      main_category: currentThresholdData.main,
      level1_category: currentThresholdData.level1,
      level2_category: currentThresholdData.level2,
      net_roi_min: netRoi,
      settle_roi_min: settleRoi,
      settle_rate_min: settleRate,
      history_spend_min: historySpend
    });
    
    if (response.data.success) {
      showAlert('阈值保存成功！', 'success');
    } else {
      showAlert('保存失败：' + response.data.error, 'error');
    }
  } catch (error) {
    showAlert('保存失败：' + error.message, 'error');
  }
}

async function saveSieveConfig() {
  // 检查权重总和
  const total = Object.values(sieveConfig.weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(total - 1.0) > 0.01) {
    showAlert('权重总和必须等于100%！', 'error');
    return;
  }
  
  try {
    showAlert('保存配置中...', 'info');
    
    // 调用API保存配置
    const response = await axios.post('/api/sieve/config', sieveConfig);
    
    if (response.data.success) {
      showAlert('配置保存成功！', 'success');
    } else {
      showAlert('保存失败：' + response.data.error, 'error');
    }
  } catch (error) {
    showAlert('保存失败：' + error.message, 'error');
  }
}

// 路由注册
Router.add('/admin/scoring-config', renderScoringConfigPage);

// 全局函数导出
window.renderScoringConfigPage = renderScoringConfigPage;
window.updateWeight = updateWeight;
window.updateKValue = updateKValue;
window.resetSieveConfig = resetSieveConfig;
window.saveSieveConfig = saveSieveConfig;
window.loadCategoryTreeForThresholds = loadCategoryTreeForThresholds;
window.loadCategoryThresholds = loadCategoryThresholds;
window.loadSelectedThreshold = loadSelectedThreshold;
window.saveThresholdConfig = saveThresholdConfig;
