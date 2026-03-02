// 投资方案前端模块
// public/static/investment-plan.js

// ==========================================
// 全局状态
// ==========================================
window.INVESTMENT_STATE = {
  projectId: null,
  config: null,
  revenueData: null,
  maxInvestment: null,
  currentPlan: null
};

// ==========================================
// API调用封装
// ==========================================
window.INVESTMENT_API = {
  // 获取配置
  async getConfig() {
    const response = await axios.get('/api/investment/config');
    return response.data;
  },
  
  // 下载CSV模板
  downloadTemplate() {
    window.open('/api/investment/template', '_blank');
  },
  
  // 上传90天数据
  async uploadRevenueData(projectId, data) {
    const response = await axios.post(`/api/investment/projects/${projectId}/daily-revenue`, {
      data: data
    });
    return response.data;
  },
  
  // 计算最高可联营金额
  async calculateMaxInvestment(projectId, profitShareRatio) {
    const response = await axios.post(`/api/investment/projects/${projectId}/max-investment`, {
      profitShareRatio: profitShareRatio
    });
    return response.data;
  },
  
  // 创建投资方案
  async createInvestmentPlan(projectId, investmentAmount, paymentFrequency) {
    const response = await axios.post(`/api/investment/projects/${projectId}/investment-plan`, {
      investmentAmount: investmentAmount,
      paymentFrequency: paymentFrequency
    });
    return response.data;
  },
  
  // 获取投资方案详情
  async getInvestmentPlan(projectId) {
    const response = await axios.get(`/api/investment/projects/${projectId}/investment-plan`);
    return response.data;
  }
};

// ==========================================
// 主页面渲染
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
    INVESTMENT_STATE.config = configResult.data;
    
    // 加载现有投资方案
    const planResult = await INVESTMENT_API.getInvestmentPlan(projectId);
    INVESTMENT_STATE.currentPlan = planResult.data;
    
    // 渲染页面
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-4xl mx-auto px-4">
          <!-- 标题 -->
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
              <i class="fas fa-file-invoice-dollar mr-2 text-red-600"></i>
              投资方案设计
            </h1>
            <p class="text-gray-600">请按步骤完成投资方案的设计和提交</p>
            <button onclick="Router.navigate('/dashboard')" class="mt-4 text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-left mr-2"></i>返回仪表盘
            </button>
          </div>
          
          <!-- 步骤指示器 -->
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full ${INVESTMENT_STATE.currentPlan.hasRevenueData ? 'bg-green-500' : 'bg-blue-500'} text-white flex items-center justify-center font-bold">
                    ${INVESTMENT_STATE.currentPlan.hasRevenueData ? '✓' : '1'}
                  </div>
                  <div class="ml-4">
                    <div class="font-semibold">上传90天数据</div>
                    <div class="text-sm text-gray-600">上传每日净成交金额</div>
                  </div>
                </div>
              </div>
              <div class="flex-shrink-0 mx-4">
                <i class="fas fa-arrow-right text-gray-400"></i>
              </div>
              <div class="flex-1">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full ${INVESTMENT_STATE.currentPlan.maxInvestmentAmount ? 'bg-green-500' : 'bg-gray-300'} text-white flex items-center justify-center font-bold">
                    ${INVESTMENT_STATE.currentPlan.maxInvestmentAmount ? '✓' : '2'}
                  </div>
                  <div class="ml-4">
                    <div class="font-semibold">设计投资方案</div>
                    <div class="text-sm text-gray-600">计算YITO封顶</div>
                  </div>
                </div>
              </div>
              <div class="flex-shrink-0 mx-4">
                <i class="fas fa-arrow-right text-gray-400"></i>
              </div>
              <div class="flex-1">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full ${INVESTMENT_STATE.currentPlan.investmentPlanCreatedAt ? 'bg-green-500' : 'bg-gray-300'} text-white flex items-center justify-center font-bold">
                    ${INVESTMENT_STATE.currentPlan.investmentPlanCreatedAt ? '✓' : '3'}
                  </div>
                  <div class="ml-4">
                    <div class="font-semibold">提交方案</div>
                    <div class="text-sm text-gray-600">完成审核</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 步骤1：上传90天数据 -->
          <div id="step1Container" class="bg-white rounded-lg shadow-lg p-6 mb-6">
            ${await renderStep1()}
          </div>
          
          <!-- 步骤2：投资方案设计 -->
          <div id="step2Container" class="bg-white rounded-lg shadow-lg p-6 mb-6" ${INVESTMENT_STATE.currentPlan.hasRevenueData ? '' : 'style="display:none"'}>
            ${await renderStep2()}
          </div>
          
          <!-- 步骤3：融资字段（占位） -->
          <div id="step3Container" class="bg-white rounded-lg shadow-lg p-6 mb-6" ${INVESTMENT_STATE.currentPlan.maxInvestmentAmount ? '' : 'style="display:none"'}>
            ${renderStep3()}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('加载投资方案页面失败:', error);
    showAlert('加载失败: ' + error.message, 'error');
  }
};

// ==========================================
// 步骤1：上传90天数据
// ==========================================
async function renderStep1() {
  const hasData = INVESTMENT_STATE.currentPlan.hasRevenueData;
  
  return `
    <h2 class="text-2xl font-bold mb-4">
      <i class="fas fa-upload mr-2"></i>
      步骤1：上传90天净成交数据
    </h2>
    
    ${hasData ? `
      <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-check-circle text-green-500 text-xl"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700">
              已上传90天数据 - 上传时间：${new Date(INVESTMENT_STATE.currentPlan.revenueDataUploadedAt).toLocaleString('zh-CN')}
            </p>
            <p class="text-sm text-green-600 mt-1">
              波动率：${(INVESTMENT_STATE.currentPlan.volatility * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
      <button onclick="handleReuploadData()" class="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
        <i class="fas fa-redo mr-2"></i>重新上传
      </button>
    ` : `
      <div class="space-y-4">
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p class="text-sm text-blue-700">
            <i class="fas fa-info-circle mr-2"></i>
            请下载模板，填写最近90天的每日净成交金额，然后上传
          </p>
        </div>
        
        <div>
          <button onclick="INVESTMENT_API.downloadTemplate()" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i class="fas fa-download mr-2"></i>下载CSV模板
          </button>
          <p class="text-sm text-gray-600 mt-2">模板已包含最近90天的日期，请填写对应的净成交金额</p>
        </div>
        
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <label class="block text-center cursor-pointer">
            <input type="file" id="revenueFileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="handleFileUpload(event)">
            <div>
              <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
              <p class="text-gray-600">点击选择文件或拖拽到此处</p>
              <p class="text-sm text-gray-500 mt-1">支持 CSV、Excel 格式</p>
            </div>
          </label>
        </div>
        
        <div id="uploadProgress" style="display:none">
          <div class="flex items-center justify-center">
            <i class="fas fa-spinner fa-spin text-2xl text-blue-600 mr-2"></i>
            <span class="text-gray-700">正在处理数据...</span>
          </div>
        </div>
      </div>
    `}
  `;
}

// ==========================================
// 步骤2：投资方案设计
// ==========================================
async function renderStep2() {
  const maxInvestment = INVESTMENT_STATE.currentPlan.maxInvestmentAmount || 0;
  const hasMaxInvestment = maxInvestment > 0;
  
  return `
    <h2 class="text-2xl font-bold mb-4">
      <i class="fas fa-calculator mr-2"></i>
      步骤2：投资方案设计
    </h2>
    
    ${!hasMaxInvestment ? `
      <form onsubmit="handleCalculateMaxInvestment(event)" class="space-y-4">
        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
          <p class="text-sm text-yellow-700">
            <i class="fas fa-info-circle mr-2"></i>
            请输入分成比例以计算最高可联营金额
          </p>
        </div>
        
        <div>
          <label class="block font-semibold mb-2">分成比例 (%)</label>
          <input 
            type="number" 
            name="profitShareRatio" 
            step="0.01" 
            min="0" 
            max="100" 
            required 
            value="15"
            class="w-full px-4 py-2 border rounded-lg"
            placeholder="例如：15 表示15%"
          >
          <p class="text-sm text-gray-600 mt-1">根据平台规则，一般为10%-20%</p>
        </div>
        
        <button type="submit" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <i class="fas fa-calculator mr-2"></i>计算最高可联营金额
        </button>
      </form>
    ` : `
      <div class="space-y-6">
        <!-- 最高可联营金额显示 -->
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <div class="text-sm text-gray-600 mb-2">最高可联营金额</div>
          <div class="text-4xl font-bold text-purple-600">
            ¥${maxInvestment.toLocaleString()}
          </div>
          <div class="text-sm text-gray-600 mt-2">
            基于90天平均净成交 × ${INVESTMENT_STATE.config.maxPartnershipDays}天 × 分成比例${(INVESTMENT_STATE.currentPlan.profitShareRatio * 100).toFixed(0)}%
          </div>
        </div>
        
        <!-- YITO封顶计算器 -->
        <form onsubmit="handleCreateInvestmentPlan(event)" class="space-y-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-chart-line mr-2"></i>
            单笔联营融资方案计算器 (YITO封顶)
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold mb-2">联营资金总额（元）<span class="text-red-500">*</span></label>
              <input 
                type="number" 
                name="investmentAmount" 
                step="0.01" 
                min="1" 
                max="${maxInvestment}"
                required 
                value="${INVESTMENT_STATE.currentPlan.investmentAmount || ''}"
                oninput="calculateYITO()"
                class="w-full px-4 py-2 border rounded-lg"
                placeholder="不超过 ${maxInvestment.toLocaleString()}"
              >
            </div>
            
            <div>
              <label class="block font-semibold mb-2">分成付款频率<span class="text-red-500">*</span></label>
              <select 
                name="paymentFrequency" 
                required 
                onchange="calculateYITO()"
                class="w-full px-4 py-2 border rounded-lg"
              >
                <option value="daily" ${INVESTMENT_STATE.currentPlan.paymentFrequency === 'daily' ? 'selected' : ''}>每日（年化13%）</option>
                <option value="weekly" ${INVESTMENT_STATE.currentPlan.paymentFrequency === 'weekly' ? 'selected' : ''}>每周（年化15%）</option>
                <option value="biweekly" ${INVESTMENT_STATE.currentPlan.paymentFrequency === 'biweekly' ? 'selected' : ''}>每两周（年化18%）</option>
              </select>
            </div>
          </div>
          
          <!-- YITO计算结果 -->
          <div id="yitoResult" class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-6" style="display:none">
            <h4 class="text-lg font-bold text-gray-800 mb-4">融资评估结果（YITO封顶）</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-sm text-gray-600">年化成本</div>
                <div id="yitoAnnualRate" class="text-2xl font-bold text-red-600">-</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">每日分成支出</div>
                <div id="yitoDailyPayment" class="text-2xl font-bold text-red-600">-</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">预计联营天数</div>
                <div id="yitoEstimatedDays" class="text-2xl font-bold text-blue-600">-</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">总支付金额（封顶）</div>
                <div id="yitoTotalAmount" class="text-3xl font-bold text-green-600">-</div>
              </div>
            </div>
            
            <div class="mt-4 text-center">
              <div class="inline-block bg-white px-4 py-2 rounded-lg shadow-sm">
                <div class="text-xs text-gray-600 mb-1">YITO封顶公式</div>
                <div class="text-sm font-mono">
                  总支付金额 = <span id="yitoFormulaAmount">500,000</span> × (1 + <span id="yitoFormulaRate">13%</span> × <span id="yitoFormulaDays">12</span> / 360) = <span id="yitoFormulaTotal" class="font-bold text-green-600">¥502,166.67</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex gap-4">
            <button type="submit" class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold">
              <i class="fas fa-save mr-2"></i>保存投资方案
            </button>
            <button type="button" onclick="handleRecalculateMax()" class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <i class="fas fa-redo mr-2"></i>重新计算最高金额
            </button>
          </div>
        </form>
      </div>
    `}
  `;
}

// ==========================================
// 步骤3：融资字段（占位）
// ==========================================
function renderStep3() {
  return `
    <h2 class="text-2xl font-bold mb-4">
      <i class="fas fa-file-alt mr-2"></i>
      步骤3：融资字段填写
    </h2>
    
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
      <i class="fas fa-tools text-4xl text-gray-400 mb-4"></i>
      <p class="text-gray-600 mb-2">此部分功能即将开放</p>
      <p class="text-sm text-gray-500">请联系管理员了解详情</p>
    </div>
    
    <div class="mt-6 flex gap-4">
      <button onclick="handleSubmitFinalPlan()" class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">
        <i class="fas fa-check mr-2"></i>提交投资方案
      </button>
    </div>
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
    
    // 读取文件内容
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
      showAlert(`数据上传成功！平均每日净成交：¥${result.data.average.toLocaleString()}，波动率：${result.data.volatility}%`, 'success');
      
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
    event.target.value = ''; // 清空文件选择
  }
};

// 重新上传数据
window.handleReuploadData = function() {
  if (confirm('确定要重新上传90天数据吗？这将覆盖现有数据。')) {
    INVESTMENT_STATE.currentPlan.hasRevenueData = false;
    renderInvestmentPlanPage(INVESTMENT_STATE.projectId);
  }
};

// 计算最高可联营金额
window.handleCalculateMaxInvestment = async function(event) {
  event.preventDefault();
  
  try {
    const form = event.target;
    const profitShareRatio = parseFloat(form.profitShareRatio.value) / 100;
    
    const result = await INVESTMENT_API.calculateMaxInvestment(INVESTMENT_STATE.projectId, profitShareRatio);
    
    if (result.success) {
      showAlert(`计算成功！最高可联营金额：¥${result.data.maxInvestmentAmount.toLocaleString()}`, 'success');
      
      // 刷新页面
      await renderInvestmentPlanPage(INVESTMENT_STATE.projectId);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('计算失败:', error);
    showAlert('计算失败: ' + error.message, 'error');
  }
};

// 实时计算YITO
window.calculateYITO = function() {
  const investmentAmount = parseFloat(document.querySelector('input[name="investmentAmount"]').value) || 0;
  const paymentFrequency = document.querySelector('select[name="paymentFrequency"]').value;
  
  if (investmentAmount <= 0) {
    document.getElementById('yitoResult').style.display = 'none';
    return;
  }
  
  // 获取年化收益率
  const rates = {
    daily: 0.13,
    weekly: 0.15,
    biweekly: 0.18
  };
  const annualRate = rates[paymentFrequency];
  
  // 计算
  const estimatedDays = INVESTMENT_STATE.config.maxPartnershipDays;
  const totalReturn = investmentAmount * (1 + annualRate * estimatedDays / 360);
  
  let paymentsCount = 0;
  switch (paymentFrequency) {
    case 'daily': paymentsCount = estimatedDays; break;
    case 'weekly': paymentsCount = Math.ceil(estimatedDays / 7); break;
    case 'biweekly': paymentsCount = Math.ceil(estimatedDays / 14); break;
  }
  const paymentAmount = totalReturn / paymentsCount;
  
  // 显示结果
  document.getElementById('yitoResult').style.display = 'block';
  document.getElementById('yitoAnnualRate').textContent = (annualRate * 100).toFixed(0) + '%';
  document.getElementById('yitoDailyPayment').textContent = '¥' + paymentAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('yitoEstimatedDays').textContent = estimatedDays + '天';
  document.getElementById('yitoTotalAmount').textContent = '¥' + totalReturn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  
  // 更新公式
  document.getElementById('yitoFormulaAmount').textContent = investmentAmount.toLocaleString();
  document.getElementById('yitoFormulaRate').textContent = (annualRate * 100).toFixed(0) + '%';
  document.getElementById('yitoFormulaDays').textContent = estimatedDays;
  document.getElementById('yitoFormulaTotal').textContent = '¥' + totalReturn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
};

// 创建投资方案
window.handleCreateInvestmentPlan = async function(event) {
  event.preventDefault();
  
  try {
    const form = event.target;
    const investmentAmount = parseFloat(form.investmentAmount.value);
    const paymentFrequency = form.paymentFrequency.value;
    
    if (investmentAmount > INVESTMENT_STATE.currentPlan.maxInvestmentAmount) {
      throw new Error(`联营资金总额不能超过最高可联营金额 ¥${INVESTMENT_STATE.currentPlan.maxInvestmentAmount.toLocaleString()}`);
    }
    
    const result = await INVESTMENT_API.createInvestmentPlan(INVESTMENT_STATE.projectId, investmentAmount, paymentFrequency);
    
    if (result.success) {
      showAlert(`投资方案保存成功！总支付金额（YITO封顶）：¥${result.data.totalReturnAmount.toLocaleString()}`, 'success');
      
      // 刷新页面
      await renderInvestmentPlanPage(INVESTMENT_STATE.projectId);
      
      // 显示步骤3
      document.getElementById('step3Container').style.display = 'block';
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('保存失败:', error);
    showAlert('保存失败: ' + error.message, 'error');
  }
};

// 重新计算最高金额
window.handleRecalculateMax = function() {
  if (confirm('确定要重新计算最高可联营金额吗？')) {
    INVESTMENT_STATE.currentPlan.maxInvestmentAmount = null;
    renderInvestmentPlanPage(INVESTMENT_STATE.projectId);
  }
};

// 提交最终方案
window.handleSubmitFinalPlan = async function() {
  if (!confirm('确定要提交投资方案吗？提交后将进入审核流程。')) {
    return;
  }
  
  try {
    // 这里可以添加最终提交的API调用
    // 暂时只是显示成功消息
    showAlert('投资方案提交成功！请等待管理员审核。', 'success');
    
    setTimeout(() => {
      Router.navigate('/dashboard');
    }, 2000);
  } catch (error) {
    console.error('提交失败:', error);
    showAlert('提交失败: ' + error.message, 'error');
  }
};

console.log('投资方案模块加载成功');
