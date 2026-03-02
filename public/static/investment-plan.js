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
    
    <form onsubmit="handleSaveInvestmentPlan(event)" class="space-y-6">
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
            oninput="calculateInvestmentPlan()"
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
            min="10000" 
            required 
            value="${INVESTMENT_STATE.currentPlan.investmentAmount || ''}"
            oninput="calculateInvestmentPlan()"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
            placeholder="100000"
          >
          <p class="text-sm text-gray-600 mt-1">
            <i class="fas fa-info-circle mr-1"></i>
            最低10,000元
          </p>
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
      
      <!-- 提交按钮 -->
      <div class="flex gap-4 mt-8">
        <button type="submit" class="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 font-bold text-lg shadow-xl transform hover:scale-105 transition">
          <i class="fas fa-save mr-2"></i>保存投资方案
        </button>
      </div>
    </form>
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

// 计算投资方案
window.calculateInvestmentPlan = function() {
  const profitShareRatio = parseFloat(document.getElementById('profitShareRatio').value) / 100;
  const investmentAmount = parseFloat(document.getElementById('investmentAmount').value);
  const paymentFrequency = document.getElementById('paymentFrequency').value;
  
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
    
    if (investmentAmount < 10000) {
      throw new Error('联营资金总额不能少于10,000元');
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
