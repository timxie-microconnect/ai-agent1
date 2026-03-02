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
            <p class="text-sm text-gray-700">
              <i class="fas fa-lightbulb text-yellow-600 mr-2"></i>
              <strong>k值说明：</strong>k值越大，边际递减越明显。例如k=4时，超出阈值25%可得到约52分，超出50%可得到约70分。
            </p>
          </div>
        </div>

        <!-- 保存按钮 -->
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
    
    // TODO: 调用API保存配置
    // await axios.post('/api/admin/sieve-config', sieveConfig);
    
    // 暂时只在前端保存
    localStorage.setItem('sieve_config', JSON.stringify(sieveConfig));
    
    showAlert('配置保存成功！', 'success');
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
