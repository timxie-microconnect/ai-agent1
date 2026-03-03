// ==========================================
// 投资方案设计模块 - 单页版本
// ==========================================

// 全局状态
const INVESTMENT_STATE = {
  projectId: null,
  config: null,
  revenueData: null,
  averageRevenue: 0,
  profitShareRatio: 0.15,
  currentPlan: {}
};

// API接口
const INVESTMENT_API = {
  async getConfig() {
    const response = await axios.get('/api/investment/config');
    return response.data;
  },
  
  async uploadRevenueData(projectId, data) {
    const response = await axios.post(`/api/investment/projects/${projectId}/revenue-data`, {
      revenueData: data
    });
    return response.data;
  },
  
  async createInvestmentPlan(projectId, investmentAmount, paymentFrequency, profitShareRatio) {
    const response = await axios.post(`/api/investment/projects/${projectId}/investment-plan`, {
      investmentAmount,
      paymentFrequency,
      profitShareRatio
    });
    return response.data;
  },
  
  async getInvestmentPlan(projectId) {
    const response = await axios.get(`/api/investment/projects/${projectId}/investment-plan`);
    return response.data;
  }
};

// ==========================================
// 主渲染函数 - 单页设计
// ==========================================
window.renderInvestmentPlanPage = async function(projectId) {
  if (!STATE.token) {
    Router.navigate('/login');
    return;
  }
  
  INVESTMENT_STATE.projectId = projectId;
  
  try {
    // 加载配置
    const configResult = await INVESTMENT_API.getConfig();
    if (configResult.success) {
      INVESTMENT_STATE.config = configResult.data;
    }
    
    // 加载已有方案
    const planResult = await INVESTMENT_API.getInvestmentPlan(projectId);
    if (planResult.success && planResult.data) {
      INVESTMENT_STATE.currentPlan = planResult.data;
      
      // 如果有收入数据，计算平均净成交
      if (planResult.data.revenueData && planResult.data.revenueData.length > 0) {
        INVESTMENT_STATE.revenueData = planResult.data.revenueData;
        const amounts = planResult.data.revenueData.map(d => d.amount);
        const sum = amounts.reduce((a, b) => a + b, 0);
        INVESTMENT_STATE.averageRevenue = sum / amounts.length;
      }
      
      // 设置分成比例
      if (planResult.data.profitShareRatio) {
        INVESTMENT_STATE.profitShareRatio = planResult.data.profitShareRatio;
      }
    }
    
    // 加载挂牌信息
    await loadListingData(projectId);
    
    // 渲染单页界面
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-8">
        <div class="max-w-5xl mx-auto px-4">
          <!-- 标题栏 -->
          <div class="bg-white rounded-xl shadow-xl p-6 mb-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                  <i class="fas fa-chart-line mr-2"></i>
                  投资方案设计
                </h1>
                <p class="text-gray-600 mt-2">设计基于真实数据的YITO封顶投资方案</p>
              </div>
              <button onclick="Router.navigate('/dashboard')" class="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 shadow-lg">
                <i class="fas fa-arrow-left mr-2"></i>返回仪表盘
              </button>
            </div>
          </div>
          
          <!-- 主内容区 -->
          <div class="bg-white rounded-xl shadow-xl p-8">
            ${renderMainContent()}
          </div>
        </div>
      </div>
    `;
    
    // 如果已有投资金额，触发计算
    if (INVESTMENT_STATE.currentPlan.investmentAmount && INVESTMENT_STATE.averageRevenue > 0) {
      setTimeout(() => calculateInvestmentPlan(), 100);
    }
  } catch (error) {
    console.error('加载投资方案页面失败:', error);
    showAlert('加载失败: ' + error.message, 'error');
  }
};

// ==========================================
// 渲染主内容
// ==========================================
function renderMainContent() {
  const hasRevenueData = INVESTMENT_STATE.averageRevenue > 0;
  
  if (!hasRevenueData) {
    // 步骤1：上传90天数据
    return `
      <div class="text-center py-12">
        <div class="inline-block bg-blue-100 rounded-full p-6 mb-6">
          <i class="fas fa-cloud-upload-alt text-6xl text-blue-600"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          上传90天净成交数据
        </h2>
        <p class="text-gray-600 mb-8">
          请先上传您的90天净成交数据，这是计算投资方案的基础
        </p>
        
        <!-- 上传表单 -->
        <div class="max-w-xl mx-auto">
          <div class="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-8">
            <input type="file" id="fileInput" accept=".csv" class="hidden" onchange="handleFileUpload(event)">
            <label for="fileInput" class="cursor-pointer">
              <div class="text-center">
                <i class="fas fa-file-csv text-5xl text-blue-500 mb-4"></i>
                <p class="text-lg font-semibold text-gray-700 mb-2">点击选择CSV文件</p>
                <p class="text-sm text-gray-500">格式：日期,金额（共90行数据）</p>
              </div>
            </label>
          </div>
          
          <div class="mt-4 flex items-center justify-center gap-4">
            <button onclick="INVESTMENT_API.downloadTemplate()" class="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center">
              <i class="fas fa-download mr-2"></i>下载模板
            </button>
          </div>
          
          <!-- 上传进度 -->
          <div id="uploadProgress" class="mt-4" style="display:none">
            <div class="bg-blue-100 rounded-lg p-4">
              <div class="flex items-center">
                <i class="fas fa-spinner fa-spin text-blue-600 mr-3"></i>
                <span class="text-blue-800">正在上传并分析数据...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // 步骤2：投资方案计算器（已上传数据）
  return `
    <!-- 数据概览 -->
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6 mb-8">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-semibold text-green-800 mb-2 text-lg">
            <i class="fas fa-check-circle mr-2"></i>90天净成交数据已上传
          </p>
          <p class="text-green-700">
            平均每日净成交：<span class="font-bold text-2xl">¥${INVESTMENT_STATE.averageRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </p>
          ${INVESTMENT_STATE.currentPlan.volatility ? `
            <p class="text-green-600 text-sm mt-1">
              波动率：${(INVESTMENT_STATE.currentPlan.volatility * 100).toFixed(2)}%
            </p>
          ` : ''}
        </div>
        <button onclick="handleReuploadData()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow">
          <i class="fas fa-redo mr-2"></i>重新上传
        </button>
      </div>
    </div>
    
    <!-- 投资方案计算器 -->
    <h2 class="text-2xl font-bold text-gray-800 mb-6">
      <i class="fas fa-calculator mr-2 text-purple-600"></i>
      投资方案计算器（YITO封顶模型）
    </h2>
    
    <div class="space-y-6">
      <!-- 输入参数 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 分成比例 -->
        <div>
          <label class="block font-semibold mb-2 text-gray-700">
            <i class="fas fa-percentage mr-2 text-purple-600"></i>
            分成比例 (%)
            <span class="text-red-500">*</span>
          </label>
          <input 
            type="number" 
            id="profitShareRatio"
            name="profitShareRatio" 
            step="0.01" 
            min="5" 
            max="30" 
            required 
            value="${(INVESTMENT_STATE.profitShareRatio * 100).toFixed(2)}"
            oninput="handleProfitShareRatioChange()"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
            placeholder="15"
          >
          <p class="text-sm text-gray-600 mt-1">
            <i class="fas fa-info-circle mr-1"></i>
            一般为10%-20%
          </p>
        </div>
        
        <!-- 联营资金总额 -->
        <div>
          <label class="block font-semibold mb-2 text-gray-700">
            <i class="fas fa-coins mr-2 text-green-600"></i>
            联营资金总额（元）
            <span class="text-red-500">*</span>
          </label>
          <input 
            type="number" 
            id="investmentAmount"
            name="investmentAmount" 
            step="1000" 
            min="5000" 
            required 
            value="${INVESTMENT_STATE.currentPlan.investmentAmount || ''}"
            oninput="validateAndCalculateInvestment()"
            onblur="validateInvestmentAmount()"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
            placeholder="100000"
          >
          <div class="mt-2 space-y-1">
            <p class="text-sm text-gray-600">
              <i class="fas fa-arrow-down mr-1 text-orange-500"></i>
              <strong>最低联营金额：¥5,000</strong>
            </p>
            <p class="text-sm text-gray-600">
              <i class="fas fa-arrow-up mr-1 text-green-500"></i>
              <strong>最高联营金额：¥<span id="maxInvestmentDisplay">--</span></strong>
              <span class="text-xs text-gray-500 ml-1">(平均每日净成交 × 分成比例 × 60天)</span>
            </p>
            <p id="investmentAmountError" class="text-sm text-red-600" style="display:none">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              <span id="investmentAmountErrorText"></span>
            </p>
          </div>
        </div>
        
        <!-- 分成付款频率 -->
        <div>
          <label class="block font-semibold mb-2 text-gray-700">
            <i class="fas fa-calendar-alt mr-2 text-blue-600"></i>
            分成付款频率
            <span class="text-red-500">*</span>
          </label>
          <select 
            id="paymentFrequency"
            name="paymentFrequency" 
            required 
            onchange="calculateInvestmentPlan()"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
          >
            <option value="daily" ${INVESTMENT_STATE.currentPlan.paymentFrequency === 'daily' ? 'selected' : ''}>每日回款（年化13%）</option>
            <option value="weekly" ${INVESTMENT_STATE.currentPlan.paymentFrequency === 'weekly' ? 'selected' : ''}>每周回款（年化15%）</option>
            <option value="biweekly" ${INVESTMENT_STATE.currentPlan.paymentFrequency === 'biweekly' ? 'selected' : ''}>每两周回款（年化18%）</option>
          </select>
          <p class="text-sm text-gray-600 mt-1">
            <i class="fas fa-info-circle mr-1"></i>
            频率越低，成本越高
          </p>
        </div>
      </div>
      
      <!-- 计算结果展示 -->
      <div id="calculationResult" class="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 border-2 border-purple-300 rounded-xl p-8 mt-8" style="display:none">
        <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">
          <i class="fas fa-chart-pie mr-2 text-purple-600"></i>
          投资方案评估结果（YITO封顶）
        </h3>
        
        <!-- 关键指标卡片 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-xl p-6 text-center shadow-lg transform hover:scale-105 transition">
            <div class="text-sm text-gray-600 mb-2">每日回款金额</div>
            <div id="dailyRepayment" class="text-3xl font-bold text-purple-600 mb-1">-</div>
            <div class="text-xs text-gray-500">平均净成交 × 分成比例</div>
          </div>
          
          <div class="bg-white rounded-xl p-6 text-center shadow-lg transform hover:scale-105 transition">
            <div class="text-sm text-gray-600 mb-2">预计联营天数</div>
            <div id="estimatedDays" class="text-3xl font-bold text-blue-600 mb-1">-</div>
            <div class="text-xs text-gray-500">联营总额 ÷ 每日回款</div>
          </div>
          
          <div class="bg-white rounded-xl p-6 text-center shadow-lg transform hover:scale-105 transition">
            <div class="text-sm text-gray-600 mb-2">年化成本</div>
            <div id="annualRate" class="text-3xl font-bold text-red-600 mb-1">-</div>
            <div class="text-xs text-gray-500">根据付款频率</div>
          </div>
          
          <div class="bg-white rounded-xl p-6 text-center shadow-lg transform hover:scale-105 transition">
            <div class="text-sm text-gray-600 mb-2">总支付金额（封顶）</div>
            <div id="totalAmount" class="text-3xl font-bold text-green-600 mb-1">-</div>
            <div class="text-xs text-gray-500">YITO封顶保护</div>
          </div>
        </div>
        
        <!-- 计算公式说明 -->
        <div class="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
          <h4 class="font-bold text-gray-800 mb-4 text-lg">
            <i class="fas fa-book mr-2 text-blue-600"></i>计算逻辑
          </h4>
          <div class="space-y-3 text-sm">
            <div class="flex items-center">
              <span class="font-mono bg-purple-100 text-purple-800 px-3 py-1 rounded-lg mr-3 min-w-[160px] text-center font-bold">每日回款</span>
              <span class="text-gray-700">= ¥<span id="formulaAvgRevenue" class="font-bold">-</span> × <span id="formulaProfitShare" class="font-bold">-</span>% = ¥<span id="formulaDailyRepay" class="font-bold text-purple-600">-</span></span>
            </div>
            <div class="flex items-center">
              <span class="font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded-lg mr-3 min-w-[160px] text-center font-bold">预计联营天数</span>
              <span class="text-gray-700">= ¥<span id="formulaInvestAmount" class="font-bold">-</span> ÷ ¥<span id="formulaDailyRepay2" class="font-bold">-</span> = <span id="formulaDays" class="font-bold text-blue-600">-</span> 天</span>
            </div>
            <div class="flex items-center">
              <span class="font-mono bg-green-100 text-green-800 px-3 py-1 rounded-lg mr-3 min-w-[160px] text-center font-bold">总支付金额</span>
              <span class="text-gray-700">= ¥<span id="formulaInvestAmount2" class="font-bold">-</span> × (1 + <span id="formulaRate" class="font-bold">-</span>% × <span id="formulaDays2" class="font-bold">-</span> / 360) = ¥<span id="formulaTotal" class="font-bold text-green-600">-</span></span>
            </div>
          </div>
        </div>
        
        <!-- YITO封顶说明 -->
        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <p class="text-sm text-yellow-800 flex items-start">
            <i class="fas fa-shield-alt text-yellow-600 mr-2 mt-1"></i>
            <span><strong>YITO封顶保护：</strong>即使实际联营天数延长，总支付金额不会超过上述计算值。这是对融资方的保护机制。</span>
          </p>
        </div>
      </div>
      
    </div>
    
    <!-- 挂牌信息收集表单 -->
    ${renderListingInfoForm()}
  `;
}

// ==========================================
// 事件处理函数
// ==========================================

// 处理文件上传
window.handleFileUpload = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    document.getElementById('uploadProgress').style.display = 'block';
    
    // 读取文件
    const text = await file.text();
    const lines = text.trim().split('\n');
    
    // 解析CSV
    const data = [];
    for (let i = 1; i < lines.length; i++) { // 跳过表头
      const line = lines[i].trim();
      if (!line) continue;
      
      const [date, amount] = line.split(',').map(s => s.trim());
      if (date && amount) {
        data.push({ date, amount: parseFloat(amount) || 0 });
      }
    }
    
    if (data.length !== 90) {
      throw new Error(`数据行数不正确：需要90行，实际${data.length}行`);
    }
    
    // 上传数据
    const result = await INVESTMENT_API.uploadRevenueData(INVESTMENT_STATE.projectId, data);
    
    if (result.success) {
      showAlert(`数据上传成功！平均每日净成交：¥${result.data.average.toLocaleString()}`, 'success');
      
      // 刷新页面
      await renderInvestmentPlanPage(INVESTMENT_STATE.projectId);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    showAlert('上传失败: ' + error.message, 'error');
  } finally {
    document.getElementById('uploadProgress').style.display = 'none';
    event.target.value = '';
  }
};

// 重新上传数据
window.handleReuploadData = function() {
  if (confirm('确定要重新上传90天数据吗？这将覆盖现有数据。')) {
    INVESTMENT_STATE.revenueData = null;
    INVESTMENT_STATE.averageRevenue = 0;
    renderInvestmentPlanPage(INVESTMENT_STATE.projectId);
  }
};

// 处理分成比例变化
window.handleProfitShareRatioChange = function() {
  // 先计算新的最高金额
  calculateInvestmentPlan();
  
  // 然后重新验证投资金额
  const investmentInput = document.getElementById('investmentAmount');
  if (investmentInput && investmentInput.value) {
    validateAndCalculateInvestment();
  }
};

// 验证并计算投资金额（输入时调用）
window.validateAndCalculateInvestment = function() {
  const investmentInput = document.getElementById('investmentAmount');
  const errorDisplay = document.getElementById('investmentAmountError');
  const errorText = document.getElementById('investmentAmountErrorText');
  
  const investmentAmount = parseFloat(investmentInput.value);
  
  // 如果输入为空或无效，隐藏错误提示，但不阻止输入
  if (!investmentAmount || isNaN(investmentAmount)) {
    errorDisplay.style.display = 'none';
    calculateInvestmentPlan();
    return;
  }
  
  const minInvestment = 5000;
  const maxInvestment = INVESTMENT_STATE.maxInvestment || Infinity;
  
  // 检查是否超出范围
  if (investmentAmount < minInvestment) {
    errorDisplay.style.display = 'block';
    errorText.textContent = `投资金额不能低于最低联营金额 ¥${minInvestment.toLocaleString()}`;
    investmentInput.classList.add('border-red-500');
    investmentInput.classList.remove('border-gray-300');
  } else if (maxInvestment !== Infinity && investmentAmount > maxInvestment) {
    errorDisplay.style.display = 'block';
    errorText.textContent = `投资金额不能超过最高联营金额 ¥${maxInvestment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    investmentInput.classList.add('border-red-500');
    investmentInput.classList.remove('border-gray-300');
  } else {
    errorDisplay.style.display = 'none';
    investmentInput.classList.remove('border-red-500');
    investmentInput.classList.add('border-gray-300');
  }
  
  // 继续计算
  calculateInvestmentPlan();
};

// 验证投资金额（失去焦点时调用，自动修正）
window.validateInvestmentAmount = function() {
  const investmentInput = document.getElementById('investmentAmount');
  const errorDisplay = document.getElementById('investmentAmountError');
  
  let investmentAmount = parseFloat(investmentInput.value);
  
  if (!investmentAmount || isNaN(investmentAmount)) {
    return;
  }
  
  const minInvestment = 5000;
  const maxInvestment = INVESTMENT_STATE.maxInvestment || Infinity;
  
  // 自动修正到合法范围
  if (investmentAmount < minInvestment) {
    investmentInput.value = minInvestment;
    showAlert(`投资金额已自动调整为最低金额 ¥${minInvestment.toLocaleString()}`, 'warning');
  } else if (maxInvestment !== Infinity && investmentAmount > maxInvestment) {
    investmentInput.value = Math.floor(maxInvestment);
    showAlert(`投资金额已自动调整为最高金额 ¥${Math.floor(maxInvestment).toLocaleString()}`, 'warning');
  }
  
  // 隐藏错误提示
  errorDisplay.style.display = 'none';
  investmentInput.classList.remove('border-red-500');
  investmentInput.classList.add('border-gray-300');
  
  // 重新计算
  calculateInvestmentPlan();
};

// 计算投资方案
window.calculateInvestmentPlan = function() {
  const profitShareRatio = parseFloat(document.getElementById('profitShareRatio').value) / 100;
  const investmentAmount = parseFloat(document.getElementById('investmentAmount').value);
  const paymentFrequency = document.getElementById('paymentFrequency').value;
  
  // 更新最高联营金额显示（公式：平均每日净成交 × 分成比例 × 60天）
  if (INVESTMENT_STATE.averageRevenue > 0 && profitShareRatio > 0) {
    const maxPartnershipDays = INVESTMENT_STATE.config?.maxPartnershipDays || 60;
    // 正确公式：最高联营金额 = 平均每日净成交 × 分成比例 × 最长联营期限
    const maxInvestment = INVESTMENT_STATE.averageRevenue * profitShareRatio * maxPartnershipDays;
    document.getElementById('maxInvestmentDisplay').textContent = maxInvestment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    INVESTMENT_STATE.maxInvestment = maxInvestment;
  }
  
  if (!profitShareRatio || !investmentAmount || investmentAmount <= 0) {
    document.getElementById('calculationResult').style.display = 'none';
    return;
  }
  
  // 计算每日回款金额 = 平均净成交 × 分成比例
  const dailyRepayment = INVESTMENT_STATE.averageRevenue * profitShareRatio;
  
  // 计算预计联营天数 = 联营资金总额 ÷ 每日回款金额
  const estimatedDays = Math.ceil(investmentAmount / dailyRepayment);
  
  // 获取年化收益率
  const rates = {
    daily: 0.13,
    weekly: 0.15,
    biweekly: 0.18
  };
  const annualRate = rates[paymentFrequency];
  
  // 计算总支付金额（YITO封顶）= 投资金额 × (1 + 年化率 × 天数 / 360)
  const totalAmount = investmentAmount * (1 + annualRate * estimatedDays / 360);
  
  // 显示结果
  document.getElementById('calculationResult').style.display = 'block';
  document.getElementById('dailyRepayment').textContent = '¥' + dailyRepayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('estimatedDays').textContent = estimatedDays + '天';
  document.getElementById('annualRate').textContent = (annualRate * 100).toFixed(0) + '%';
  document.getElementById('totalAmount').textContent = '¥' + totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  
  // 更新公式
  document.getElementById('formulaAvgRevenue').textContent = INVESTMENT_STATE.averageRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('formulaProfitShare').textContent = (profitShareRatio * 100).toFixed(2);
  document.getElementById('formulaDailyRepay').textContent = dailyRepayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('formulaInvestAmount').textContent = investmentAmount.toLocaleString();
  document.getElementById('formulaDailyRepay2').textContent = dailyRepayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('formulaDays').textContent = estimatedDays;
  document.getElementById('formulaInvestAmount2').textContent = investmentAmount.toLocaleString();
  document.getElementById('formulaRate').textContent = (annualRate * 100).toFixed(0);
  document.getElementById('formulaDays2').textContent = estimatedDays;
  document.getElementById('formulaTotal').textContent = totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
};

// 保存投资方案
window.handleSaveInvestmentPlan = async function(event) {
  event.preventDefault();
  
  try {
    const form = event.target;
    const profitShareRatio = parseFloat(form.profitShareRatio.value) / 100;
    const investmentAmount = parseFloat(form.investmentAmount.value);
    const paymentFrequency = form.paymentFrequency.value;
    
    if (investmentAmount < 5000) {
      throw new Error('联营资金总额不能少于5,000元');
    }
    
    // 检查是否超过最高可联营金额
    if (INVESTMENT_STATE.maxInvestment && investmentAmount > INVESTMENT_STATE.maxInvestment) {
      throw new Error(`投资金额不能超过最高可联营金额 ¥${INVESTMENT_STATE.maxInvestment.toLocaleString()}`);
    }
    
    const result = await INVESTMENT_API.createInvestmentPlan(
      INVESTMENT_STATE.projectId, 
      investmentAmount, 
      paymentFrequency,
      profitShareRatio
    );
    
    if (result.success) {
      const totalReturn = result.data.totalReturnAmount || 0;
      showAlert(`投资方案保存成功！总支付金额（YITO封顶）：¥${totalReturn.toLocaleString()}`, 'success');
      
      // 刷新页面
      await renderInvestmentPlanPage(INVESTMENT_STATE.projectId);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('保存失败:', error);
    showAlert('保存失败: ' + error.message, 'error');
  }
};

// ==============================================================================
// 挂牌信息收集表单模块
// ==============================================================================

// 挂牌信息表单结构（从Excel解析）
const LISTING_FORM_STRUCTURE = [
  {
    "section": "挂牌主体工商信息",
    "fields": [
      {"name": "company_name", "label": "挂牌主体企业中文名称", "type": "text", "required": true},
      {"name": "registration_number", "label": "注册编号", "type": "text", "required": true},
      {"name": "registered_address", "label": "注册地址", "type": "text", "required": true},
      {"name": "establishment_date", "label": "企业成立日期", "type": "date", "required": true},
      {"name": "business_format", "label": "主题业态", "type": "text", "placeholder": "主要行业", "required": true},
      {"name": "business_intro", "label": "主营业务简介", "type": "textarea", "placeholder": "相关行业简介", "required": true},
      {"name": "business_scope", "label": "经营范围", "type": "textarea", "placeholder": "参考注册证书", "required": true},
      {"name": "file_company_registration", "label": "📄 企业注册证书+公章", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "请上传PDF或图片格式"}
    ]
  },
  {
    "section": "法定代表人",
    "fields": [
      {"name": "legal_rep_name", "label": "中文姓名", "type": "text", "required": true},
      {"name": "legal_rep_id_type", "label": "证件类型", "type": "select", "options": ["身份证", "护照", "其他"], "required": true},
      {"name": "legal_rep_id_number", "label": "证件号码", "type": "text", "required": true},
      {"name": "legal_rep_address", "label": "实际居住地址", "type": "text", "required": true},
      {"name": "legal_rep_email", "label": "电邮", "type": "email", "required": true},
      {"name": "legal_rep_phone", "label": "电话", "type": "tel", "required": true},
      {"name": "file_legal_rep_id", "label": "📄 法定代表人身份证件（正反面）", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "请上传正反面照片或扫描件"},
      {"name": "file_legal_rep_address_proof", "label": "📄 法定代表人住址证明", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "如水电费账单、银行对账单等"}
    ]
  },
  {
    "section": "实控人",
    "description": "请填写股权穿透后持股占比最大的自然人及其它实际控制人",
    "fields": [
      {"name": "actual_controller_name", "label": "中文姓名", "type": "text", "required": true},
      {"name": "actual_controller_id_type", "label": "证件类型", "type": "select", "options": ["身份证", "护照", "其他"], "required": true},
      {"name": "actual_controller_id_number", "label": "证件号码", "type": "text", "required": true},
      {"name": "actual_controller_address", "label": "实际居住地址", "type": "text", "required": true},
      {"name": "actual_controller_email", "label": "电邮", "type": "email", "required": true},
      {"name": "actual_controller_phone", "label": "电话", "type": "tel", "required": true},
      {"name": "file_actual_controller_id", "label": "📄 实际控制人身份证件（正反面）", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "请上传正反面照片或扫描件"},
      {"name": "file_actual_controller_address_proof", "label": "📄 实际控制人住址证明", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true},
      {"name": "file_actual_controller_proof", "label": "📄 实控人证明文件+公章", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "如股权穿透证明等"}
    ]
  },
  {
    "section": "实益拥有人",
    "description": "所有直接或间接拥有或控制25%或以上实益拥有权的自然人",
    "fields": [
      {"name": "beneficial_owner_name", "label": "中文姓名", "type": "text", "required": false},
      {"name": "beneficial_owner_id_type", "label": "证件类型", "type": "select", "options": ["身份证", "护照", "其他"], "required": false},
      {"name": "beneficial_owner_id_number", "label": "证件号码", "type": "text", "required": false},
      {"name": "beneficial_owner_address", "label": "实际居住地址", "type": "text", "required": false},
      {"name": "beneficial_owner_email", "label": "电邮", "type": "email", "required": false},
      {"name": "beneficial_owner_phone", "label": "电话", "type": "tel", "required": false},
      {"name": "file_beneficial_owner_id", "label": "📄 实益拥有人身份证件（正反面）", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": false, "note": "如有实益拥有人请上传"},
      {"name": "file_beneficial_owner_address_proof", "label": "📄 实益拥有人住址证明", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": false}
    ]
  },
  {
    "section": "准入条件",
    "fields": [
      {"name": "condition_1", "label": "存续时间不短于12个月", "type": "radio", "options": ["是", "否"], "required": true, "note": "如选否，请提供相关说明和证明"},
      {"name": "condition_1_note", "label": "说明（如选否）", "type": "textarea", "required": false},
      {"name": "condition_2", "label": "最近连续365日合计营业额不低于500万人民币", "type": "radio", "options": ["是", "否"], "required": true},
      {"name": "condition_2_note", "label": "说明（如选否）", "type": "textarea", "required": false},
      {"name": "condition_3", "label": "有可靠且运营情况良好的收入管控系统", "type": "radio", "options": ["是", "否"], "required": true},
      {"name": "condition_4", "label": "整体营收状况良好，能够达到营收能力要求", "type": "radio", "options": ["是", "否"], "required": true},
      {"name": "condition_5", "label": "不存在重大法律合规风险", "type": "radio", "options": ["是", "否"], "required": true},
      {"name": "file_condition_1_proof", "label": "📄 存续时间证明文件", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "如企业注册证书等"},
      {"name": "file_condition_2_proof", "label": "📄 营业额证明文件+公章", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "如财务报表、平台证明等"}
    ]
  },
  {
    "section": "企业预计营收信息",
    "fields": [
      {"name": "revenue_2026", "label": "2026 营业总收入/门店数", "type": "text", "placeholder": "如：1000万/3家", "required": true},
      {"name": "revenue_2027", "label": "2027 营业总收入/门店数", "type": "text", "placeholder": "如：1200万/5家", "required": true},
      {"name": "revenue_2028", "label": "2028 营业总收入/门店数", "type": "text", "placeholder": "如：1500万/8家", "required": true},
      {"name": "revenue_2029", "label": "2029 营业总收入/门店数", "type": "text", "placeholder": "如：2000万/10家", "required": true},
      {"name": "file_revenue_forecast", "label": "📄 未来12个月预估营业额信息+公章", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "请提供书面预估文件"}
    ]
  },
  {
    "section": "授权人信息",
    "description": "可以是法人/其他授权人士",
    "fields": [
      {"name": "authorizer_name", "label": "中文姓名", "type": "text", "required": true},
      {"name": "authorizer_id_type", "label": "证件类型", "type": "select", "options": ["身份证", "护照", "其他"], "required": true},
      {"name": "authorizer_id_number", "label": "证件号码", "type": "text", "required": true},
      {"name": "authorizer_address", "label": "实际居住地址", "type": "text", "required": true},
      {"name": "authorizer_email", "label": "电邮", "type": "email", "required": true},
      {"name": "authorizer_phone", "label": "电话", "type": "tel", "required": true},
      {"name": "file_directors_list", "label": "📄 董事会成员及其他主要人员名册+公章", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "可从企查查等获取"},
      {"name": "file_board_resolution", "label": "📄 董事会书面决议授权+公章", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "授权在MCEX融资，请使用模板并通过授权人电邮申请"},
      {"name": "file_email_authorization", "label": "📄 电邮申请说明+公章+授权人/法人签名", "type": "file", "accept": ".pdf,.jpg,.jpeg,.png", "required": true, "note": "说明透过电邮进行挂牌+RBO设立申请"}
    ]
  }
];

// 全局状态
let LISTING_STATE = {
  listingData: {},
  isDirty: false
};

// ==========================================
// 渲染挂牌信息表单
// ==========================================
function renderListingInfoForm() {
  return `
    <div class="bg-white rounded-xl shadow-xl p-8 mt-8">
      <div class="border-b-2 border-purple-200 pb-4 mb-6">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-clipboard-list mr-2 text-purple-600"></i>
          挂牌主体信息收集
        </h2>
        <p class="text-gray-600 mt-2">
          <i class="fas fa-info-circle mr-1"></i>
          您可以随时<strong>保存草稿</strong>，无需填写所有字段。只有<strong>提交</strong>时才需要完整填写所有必填项。
        </p>
      </div>
      
      <form id="listingForm" class="space-y-8">
        ${renderFormSections()}
        
        <!-- 表单操作按钮 -->
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mt-8">
          <div class="flex gap-4">
            <button type="button" onclick="saveListingDraft()" class="flex-1 px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-bold">
              <i class="fas fa-save mr-2"></i>保存草稿
            </button>
            <button type="button" onclick="submitListingInfo()" class="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg">
              <i class="fas fa-paper-plane mr-2"></i>提交挂牌信息
            </button>
          </div>
          <p class="text-sm text-gray-600 mt-3 text-center">
            <i class="fas fa-lightbulb mr-1 text-yellow-500"></i>
            <strong>保存草稿</strong>：保存当前已填写的内容，无需完整填写 | 
            <strong>提交</strong>：需完整填写所有必填项（标记<span class="text-red-500">*</span>）后才能提交
          </p>
        </div>
      </form>
    </div>
  `;
}

// ==========================================
// 渲染所有表单分段
// ==========================================
function renderFormSections() {
  return LISTING_FORM_STRUCTURE.map((section, index) => `
    <div class="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50 rounded-r-lg">
      <h3 class="text-xl font-bold text-gray-800 mb-1">
        ${index + 1}. ${section.section}
      </h3>
      ${section.description ? `
        <p class="text-sm text-gray-600 mb-4">
          <i class="fas fa-info-circle mr-1"></i>${section.description}
        </p>
      ` : ''}
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        ${section.fields.map(field => renderFormField(field)).join('')}
      </div>
    </div>
  `).join('');
}

// ==========================================
// 渲染单个表单字段
// ==========================================
function renderFormField(field) {
  const { name, label, type, required, placeholder, options, note } = field;
  const requiredMark = required ? '<span class="text-red-500">*</span>' : '';
  
  let fieldHTML = '';
  
  switch (type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'date':
      fieldHTML = `
        <input 
          type="${type}" 
          id="${name}" 
          name="${name}"
          ${required ? 'required' : ''}
          ${placeholder ? `placeholder="${placeholder}"` : ''}
          class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
          onchange="markFormDirty()"
        >
      `;
      break;
      
    case 'textarea':
      fieldHTML = `
        <textarea 
          id="${name}" 
          name="${name}"
          ${required ? 'required' : ''}
          ${placeholder ? `placeholder="${placeholder}"` : ''}
          rows="3"
          class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
          onchange="markFormDirty()"
        ></textarea>
      `;
      break;
      
    case 'select':
      fieldHTML = `
        <select 
          id="${name}" 
          name="${name}"
          ${required ? 'required' : ''}
          class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
          onchange="markFormDirty()"
        >
          <option value="">请选择</option>
          ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      `;
      break;
      
    case 'radio':
      fieldHTML = `
        <div class="flex items-center gap-6">
          ${options.map(opt => `
            <label class="flex items-center cursor-pointer">
              <input 
                type="radio" 
                name="${name}" 
                value="${opt}" 
                ${required ? 'required' : ''}
                class="mr-2"
                onchange="markFormDirty(); toggleConditionNote('${name}')"
              >
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
        ${note ? `<p class="text-xs text-gray-500 mt-1"><i class="fas fa-exclamation-triangle mr-1"></i>${note}</p>` : ''}
      `;
      break;
      
    case 'file':
      const accept = field.accept || '.pdf,.jpg,.jpeg,.png';
      fieldHTML = `
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition">
          <input 
            type="file" 
            id="${name}" 
            name="${name}"
            ${required ? 'required' : ''}
            accept="${accept}"
            class="hidden"
            onchange="handleFileSelect(this, '${name}')"
          >
          <label for="${name}" class="cursor-pointer flex flex-col items-center">
            <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
            <span class="text-sm text-gray-600">点击选择文件或拖拽文件到此处</span>
            <span class="text-xs text-gray-500 mt-1">支持格式：${accept.replace(/\./g, '').toUpperCase()}</span>
          </label>
          <div id="${name}_preview" class="mt-3 hidden">
            <div class="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="flex items-center gap-2">
                <i class="fas fa-file text-green-600"></i>
                <span id="${name}_filename" class="text-sm text-gray-700"></span>
                <span id="${name}_filesize" class="text-xs text-gray-500"></span>
              </div>
              <button type="button" onclick="clearFile('${name}')" class="text-red-600 hover:text-red-700">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div id="${name}_url_display" class="mt-2 hidden">
            <a id="${name}_url_link" href="#" target="_blank" class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <i class="fas fa-external-link-alt"></i>
              <span>查看已上传文件</span>
            </a>
          </div>
        </div>
        ${note ? `<p class="text-xs text-gray-600 mt-1"><i class="fas fa-info-circle mr-1"></i>${note}</p>` : ''}
      `;
      break;
  }
  
  // 字段容器（某些字段占两列）
  const colSpan = (type === 'textarea' || type === 'file' || name.includes('_note')) ? 'md:col-span-2' : '';
  
  return `
    <div class="${colSpan}">
      <label class="block font-semibold mb-2 text-gray-700">
        ${label} ${requiredMark}
      </label>
      ${fieldHTML}
    </div>
  `;
}

// ==========================================
// 事件处理函数
// ==========================================

// 标记表单已修改
window.markFormDirty = function() {
  LISTING_STATE.isDirty = true;
};

// ==========================================
// 文件上传处理函数
// ==========================================

// 模拟文件上传到CDN
async function uploadFileToCDN(file) {
  // 将文件转换为base64编码（用于本地开发）
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const base64Data = e.target.result; // data:image/png;base64,iVBORw0KG...
      
      // 创建一个包含base64数据的对象
      resolve({
        file_name: file.name,
        file_url: base64Data, // 使用base64数据URL代替远程URL
        file_size: file.size,
        file_type: file.type,
        uploaded_at: new Date().toISOString()
      });
    };
    
    reader.onerror = function(error) {
      reject(error);
    };
    
    // 读取文件为base64数据URL
    reader.readAsDataURL(file);
  });
}

// 处理文件选择
window.handleFileSelect = async function(input, fieldName) {
  const file = input.files[0];
  if (!file) return;
  
  try {
    // 显示上传中状态
    const previewDiv = document.getElementById(`${fieldName}_preview`);
    const filenameSpan = document.getElementById(`${fieldName}_filename`);
    const filesizeSpan = document.getElementById(`${fieldName}_filesize`);
    
    if (previewDiv) {
      previewDiv.classList.remove('hidden');
      if (filenameSpan) {
        filenameSpan.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>正在上传...';
      }
    }
    
    // 上传文件
    const result = await uploadFileToCDN(file);
    
    // 存储上传结果（用于后续保存）
    if (!window.UPLOADED_FILES) {
      window.UPLOADED_FILES = {};
    }
    window.UPLOADED_FILES[fieldName] = result;
    
    // 更新显示
    if (filenameSpan) {
      filenameSpan.innerHTML = `<i class="fas fa-check-circle text-green-600 mr-1"></i>${result.file_name}`;
    }
    if (filesizeSpan) {
      const sizeKB = (result.file_size / 1024).toFixed(2);
      filesizeSpan.textContent = `(${sizeKB} KB)`;
    }
    
    // 显示已上传文件链接
    const urlDisplayDiv = document.getElementById(`${fieldName}_url_display`);
    const urlLink = document.getElementById(`${fieldName}_url_link`);
    if (urlDisplayDiv && urlLink) {
      urlDisplayDiv.classList.remove('hidden');
      urlLink.href = result.file_url;
    }
    
    markFormDirty();
    
  } catch (error) {
    console.error('文件上传失败:', error);
    showAlert('文件上传失败: ' + error.message, 'error');
    input.value = '';
  }
};

// 清除已选择的文件
window.clearFile = function(fieldName) {
  const input = document.getElementById(fieldName);
  const previewDiv = document.getElementById(`${fieldName}_preview`);
  const urlDisplayDiv = document.getElementById(`${fieldName}_url_display`);
  
  if (input) input.value = '';
  if (previewDiv) previewDiv.classList.add('hidden');
  if (urlDisplayDiv) urlDisplayDiv.classList.add('hidden');
  
  // 清除上传结果
  if (window.UPLOADED_FILES && window.UPLOADED_FILES[fieldName]) {
    delete window.UPLOADED_FILES[fieldName];
  }
  
  markFormDirty();
};

// 切换条件说明字段显示
window.toggleConditionNote = function(conditionName) {
  const radio = document.querySelector(`input[name="${conditionName}"]:checked`);
  if (!radio) return;
  
  const noteField = document.getElementById(conditionName + '_note');
  if (noteField) {
    const noteContainer = noteField.closest('div');
    if (radio.value === '否') {
      noteContainer.style.display = 'block';
      noteField.required = true;
    } else {
      noteContainer.style.display = 'none';
      noteField.required = false;
      noteField.value = '';
    }
  }
};

// 保存草稿（同时保存投资方案和挂牌信息）
window.saveListingDraft = async function() {
  try {
    // 1. 保存投资方案数据
    const investmentAmount = parseFloat(document.getElementById('investmentAmount')?.value);
    const profitShareRatio = parseFloat(document.getElementById('profitShareRatio')?.value);
    const paymentFrequency = document.getElementById('paymentFrequency')?.value || 'daily';
    
    if (investmentAmount && profitShareRatio) {
      // 验证投资金额范围
      const minInvestment = 5000;
      const maxInvestment = INVESTMENT_STATE.maxInvestment;
      
      if (investmentAmount < minInvestment) {
        showAlert(`投资金额不能低于最低联营金额 ¥${minInvestment.toLocaleString()}`, 'error');
        return;
      }
      
      if (maxInvestment && investmentAmount > maxInvestment) {
        showAlert(`投资金额不能超过最高联营金额 ¥${maxInvestment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'error');
        return;
      }
      
      const investmentData = {
        investmentAmount: investmentAmount,
        profitShareRatio: profitShareRatio, // 保持百分比形式，不除以100
        paymentFrequency: paymentFrequency
      };
      
      await axios.post(
        `/api/investment/projects/${INVESTMENT_STATE.projectId}/investment-plan`,
        investmentData,
        { headers: { 'Authorization': `Bearer ${STATE.token}` } }
      );
    }
    
    // 2. 保存挂牌信息（草稿模式，不验证必填项）
    const formData = collectFormData();
    formData.is_submitted = false; // 明确标记为草稿
    const response = await axios.post(
      `/api/investment/projects/${INVESTMENT_STATE.projectId}/listing-info`, 
      formData,
      { headers: { 'Authorization': `Bearer ${STATE.token}` } }
    );
    
    if (response.data.success) {
      showAlert('所有信息保存成功！', 'success');
      LISTING_STATE.isDirty = false;
      // 重新加载数据
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      throw new Error(response.data.error);
    }
  } catch (error) {
    console.error('保存失败:', error);
    showAlert('保存失败: ' + (error.response?.data?.error || error.message), 'error');
  }
};

// 提交挂牌信息
window.submitListingInfo = async function() {
  // 手动验证必填项（包括文件字段）
  const missingFields = validateRequiredFields();
  if (missingFields.length > 0) {
    const fieldList = missingFields.map(f => `• ${f}`).join('\n');
    showAlert(`请填写以下必填项：\n\n${fieldList}`, 'error');
    // 滚动到第一个缺失字段
    const firstField = document.getElementById(missingFields[0].split('：')[0]);
    if (firstField) {
      firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 如果是文件字段，高亮显示
      const fieldContainer = firstField.closest('.mb-4');
      if (fieldContainer) {
        fieldContainer.classList.add('ring-2', 'ring-red-500', 'rounded');
        setTimeout(() => {
          fieldContainer.classList.remove('ring-2', 'ring-red-500', 'rounded');
        }, 3000);
      }
    }
    return;
  }
  
  if (!confirm('确定要提交挂牌信息吗？提交后将进入审核流程。')) {
    return;
  }
  
  try {
    const formData = collectFormData();
    formData.is_submitted = true; // 标记为正式提交
    
    const response = await axios.post(
      `/api/investment/projects/${INVESTMENT_STATE.projectId}/listing-info`, 
      formData,
      { headers: { 'Authorization': `Bearer ${STATE.token}` } }
    );
    
    if (response.data.success) {
      showAlert('挂牌信息提交成功！正在进入审核流程...', 'success');
      LISTING_STATE.isDirty = false;
      
      // 延迟刷新，让用户看到成功消息
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      throw new Error(response.data.error);
    }
  } catch (error) {
    console.error('提交失败:', error);
    showAlert('提交失败: ' + (error.response?.data?.error || error.message), 'error');
  }
};

// 验证所有必填字段
function validateRequiredFields() {
  const missingFields = [];
  
  // 遍历表单结构，检查必填字段
  LISTING_FORM_STRUCTURE.forEach(section => {
    section.fields.forEach(field => {
      if (!field.required) return; // 跳过非必填项
      
      const fieldName = field.name;
      const fieldLabel = field.label;
      
      // 检查文件字段
      if (field.type === 'file') {
        // 文件字段检查 window.UPLOADED_FILES
        if (!window.UPLOADED_FILES || !window.UPLOADED_FILES[fieldName]) {
          missingFields.push(`${fieldName}：${fieldLabel}`);
        }
      } else if (field.type === 'radio') {
        // Radio 字段检查是否有选中的选项
        const radioElement = document.querySelector(`input[name="${fieldName}"]:checked`);
        if (!radioElement) {
          missingFields.push(`${fieldName}：${fieldLabel}`);
        }
      } else if (field.type === 'select') {
        // Select 字段检查是否选择了非空值
        const selectElement = document.getElementById(fieldName);
        if (selectElement && (!selectElement.value || selectElement.value === '')) {
          missingFields.push(`${fieldName}：${fieldLabel}`);
        }
      } else {
        // 普通字段检查表单值
        const element = document.getElementById(fieldName);
        if (element) {
          const value = element.value?.trim();
          if (!value || value === '') {
            missingFields.push(`${fieldName}：${fieldLabel}`);
          }
        }
      }
    });
  });
  
  return missingFields;
}

// 收集表单数据
function collectFormData() {
  const form = document.getElementById('listingForm');
  const formData = new FormData(form);
  const data = {};
  
  for (let [key, value] of formData.entries()) {
    // 只收集有值的字段
    if (value && value !== '') {
      data[key] = value;
    }
  }
  
  // 添加已上传的文件信息
  if (window.UPLOADED_FILES) {
    Object.keys(window.UPLOADED_FILES).forEach(fieldName => {
      const fileInfo = window.UPLOADED_FILES[fieldName];
      // 确保文件信息是对象，然后转换为JSON字符串
      if (fileInfo && typeof fileInfo === 'object') {
        data[fieldName] = JSON.stringify(fileInfo);
      }
    });
  }
  
  console.log('收集的表单数据:', data);
  return data;
}

// 加载已保存的表单数据
async function loadListingData(projectId) {
  try {
    const response = await axios.get(
      `/api/investment/projects/${projectId}/listing-info`,
      { headers: { 'Authorization': `Bearer ${STATE.token}` } }
    );
    
    if (response.data.success && response.data.data) {
      LISTING_STATE.listingData = response.data.data;
      // 页面渲染后填充数据
      setTimeout(() => fillFormData(response.data.data), 100);
    }
  } catch (error) {
    console.error('加载挂牌信息失败:', error);
  }
}

// 填充表单数据
function fillFormData(data) {
  // 初始化已上传文件对象
  if (!window.UPLOADED_FILES) {
    window.UPLOADED_FILES = {};
  }
  
  Object.keys(data).forEach(key => {
    const element = document.getElementById(key);
    
    // 处理文件字段
    if (key.startsWith('file_') && data[key]) {
      try {
        const fileInfo = typeof data[key] === 'string' ? JSON.parse(data[key]) : data[key];
        if (fileInfo && fileInfo.file_url) {
          // 恢复文件信息
          window.UPLOADED_FILES[key] = fileInfo;
          
          // 显示已上传文件
          const previewDiv = document.getElementById(`${key}_preview`);
          const filenameSpan = document.getElementById(`${key}_filename`);
          const filesizeSpan = document.getElementById(`${key}_filesize`);
          const urlDisplayDiv = document.getElementById(`${key}_url_display`);
          const urlLink = document.getElementById(`${key}_url_link`);
          
          if (previewDiv) {
            previewDiv.classList.remove('hidden');
            if (filenameSpan) {
              filenameSpan.innerHTML = `<i class="fas fa-check-circle text-green-600 mr-1"></i>${fileInfo.file_name}`;
            }
            if (filesizeSpan && fileInfo.file_size) {
              const sizeKB = (fileInfo.file_size / 1024).toFixed(2);
              filesizeSpan.textContent = `(${sizeKB} KB)`;
            }
          }
          
          if (urlDisplayDiv && urlLink) {
            urlDisplayDiv.classList.remove('hidden');
            urlLink.href = fileInfo.file_url;
          }
        }
      } catch (e) {
        console.warn('解析文件信息失败:', key, e);
      }
      return;
    }
    
    // 处理普通字段
    if (element) {
      if (element.type === 'radio') {
        const radio = document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
        if (radio) radio.checked = true;
      } else {
        element.value = data[key] || '';
      }
    }
  });
}
