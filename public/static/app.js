// 融资方准入评估
document.getElementById('qualificationForm')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const category = document.getElementById('q_category').value
  const avgROI = parseFloat(document.getElementById('q_avgROI').value)
  const avgReturnRate = parseFloat(document.getElementById('q_avgReturnRate').value)
  const avgNetProfit = parseFloat(document.getElementById('q_avgNetProfit').value)
  const shopRating = parseFloat(document.getElementById('q_shopRating').value)
  const operatingMonths = parseInt(document.getElementById('q_operatingMonths').value)
  
  try {
    const response = await fetch('/api/check-qualification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        avgROI,
        avgReturnRate,
        avgNetProfit,
        shopRating,
        operatingMonths
      })
    })
    
    const data = await response.json()
    
    const resultDiv = document.getElementById('qualificationResult')
    const contentDiv = document.getElementById('qualificationContent')
    
    if (data.qualified) {
      contentDiv.innerHTML = `
        <div class="bg-green-50 border-l-4 border-green-500 p-6 rounded">
          <div class="flex items-center mb-4">
            <i class="fas fa-check-circle text-green-600 text-3xl mr-3"></i>
            <div>
              <h4 class="font-bold text-lg text-green-800">${data.message}</h4>
              <p class="text-sm text-green-700 mt-1">您的【${data.category}】类目店铺已通过所有准入指标审核！</p>
            </div>
          </div>
          <div class="bg-white rounded-lg p-4 mt-4">
            <h5 class="font-semibold text-gray-800 mb-3">✅ 准入指标达标情况：</h5>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">近三个月日均投流ROI：</span>
                <span class="font-semibold text-green-600">${avgROI.toFixed(2)} ✓</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">近三个月日均退货率：</span>
                <span class="font-semibold text-green-600">${avgReturnRate.toFixed(1)}% ✓</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">近三个月商品平均净利：</span>
                <span class="font-semibold text-green-600">${avgNetProfit.toFixed(1)}% ✓</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">抖音店铺当前评分：</span>
                <span class="font-semibold text-green-600">${shopRating.toFixed(1)}分 ✓</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">抖音店铺运营时间：</span>
                <span class="font-semibold text-green-600">${operatingMonths}个月 ✓</span>
              </div>
            </div>
          </div>
          <div class="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
            <p class="text-sm text-blue-800">
              <i class="fas fa-info-circle mr-2"></i>
              下一步：请继续填写下方的<strong>融资方计算器</strong>，测算您的融资成本！
            </p>
          </div>
        </div>
      `
    } else {
      contentDiv.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded">
          <div class="flex items-center mb-4">
            <i class="fas fa-times-circle text-red-600 text-3xl mr-3"></i>
            <div>
              <h4 class="font-bold text-lg text-red-800">${data.message}</h4>
              <p class="text-sm text-red-700 mt-1">以下指标未达到【${data.category}】类目的准入标准：</p>
            </div>
          </div>
          <div class="bg-white rounded-lg p-4 mt-4">
            <h5 class="font-semibold text-gray-800 mb-3">❌ 未达标项目：</h5>
            <div class="space-y-2 text-sm">
              ${data.failedChecks.map(check => `
                <div class="flex items-start">
                  <i class="fas fa-exclamation-triangle text-red-500 mt-1 mr-2"></i>
                  <span class="text-gray-700">${check.message}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="mt-4 bg-yellow-50 border border-yellow-200 rounded p-4">
            <p class="text-sm text-yellow-800">
              <i class="fas fa-lightbulb mr-2"></i>
              建议：提升店铺运营指标后再次申请，或联系客服咨询特殊准入通道。
            </p>
          </div>
        </div>
      `
    }
    
    resultDiv.classList.remove('hidden')
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch (error) {
    console.error('评估错误:', error)
    alert('评估失败，请检查网络连接后重试')
  }
})

// 融资方计算器
document.getElementById('financingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const investmentAmount = parseFloat(document.getElementById('f_investmentAmount').value)
  const dailyGMV = parseFloat(document.getElementById('f_dailyGMV').value)
  const revenueSharingRate = parseFloat(document.getElementById('f_revenueSharingRate').value)
  const paymentFrequency = document.getElementById('f_paymentFrequency').value
  
  try {
    const response = await fetch('/api/calculate-financing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        investmentAmount,
        dailyGMV,
        revenueSharingRate,
        paymentFrequency
      })
    })
    
    const data = await response.json()
    
    document.getElementById('financingResult').classList.remove('hidden')
    document.getElementById('f_annualRate').textContent = `${data.annualReturnRate}%`
    document.getElementById('f_dailyCost').textContent = `¥${data.dailyRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    document.getElementById('f_days').textContent = `${data.daysToComplete}天`
    document.getElementById('f_totalPayment').textContent = `¥${data.totalPayment.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    document.getElementById('f_actualCost').textContent = `¥${data.actualCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    document.getElementById('f_paymentInfo').textContent = `${data.paymentFrequency}打款，共${data.paymentCount}次，每次约¥${data.paymentAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    document.getElementById('f_yitoFormula').textContent = `${investmentAmount.toLocaleString()} × (1 + ${data.annualReturnRate}% × ${data.daysToComplete} ÷ 360) = ${data.totalPayment.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    
    document.getElementById('financingResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch (error) {
    console.error('计算错误:', error)
    alert('计算失败，请检查输入值')
  }
})

// 投资方计算器
document.getElementById('investmentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const investmentAmount = parseFloat(document.getElementById('i_investmentAmount').value)
  const dailyGMV = parseFloat(document.getElementById('i_dailyGMV').value)
  const revenueSharingRate = parseFloat(document.getElementById('i_revenueSharingRate').value)
  const targetReturnRate = parseFloat(document.getElementById('i_targetReturnRate').value)
  const paymentFrequency = document.getElementById('i_paymentFrequency').value
  
  try {
    const response = await fetch('/api/calculate-investment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        investmentAmount,
        dailyGMV,
        revenueSharingRate,
        targetReturnRate,
        paymentFrequency
      })
    })
    
    const data = await response.json()
    
    document.getElementById('investmentResult').classList.remove('hidden')
    document.getElementById('i_dailyRevenue').textContent = `¥${data.dailyRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    document.getElementById('i_days').textContent = `${data.daysToBreakEven}天`
    document.getElementById('i_targetTotal').textContent = `¥${data.targetTotalReturn.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    document.getElementById('i_totalReturn').textContent = `${data.totalReturn.toFixed(2)}%`
    document.getElementById('i_returnDays').textContent = data.daysToBreakEven
    document.getElementById('i_totalProfit').textContent = `¥${data.totalProfit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    document.getElementById('i_paymentInfo').textContent = `${data.paymentFrequency}回款，共${data.paymentCount}次，每次约¥${data.paymentAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    
    // 填充现金流时间表
    const tableBody = document.getElementById('i_cashFlowTable')
    tableBody.innerHTML = ''
    
    data.cashFlowSchedule.forEach(item => {
      const row = document.createElement('tr')
      row.className = 'border-b border-gray-100'
      row.innerHTML = `
        <td class="py-2 px-2">${item.date}</td>
        <td class="py-2 px-2 text-right text-green-600 font-semibold">¥${item.inflow.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
        <td class="py-2 px-2 text-right font-semibold">¥${item.cumulative.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
      `
      tableBody.appendChild(row)
    })
    
    document.getElementById('investmentResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch (error) {
    console.error('计算错误:', error)
    alert('计算失败，请检查输入值')
  }
})

// 一键套用融资方数据
document.getElementById('copyFromFinancing')?.addEventListener('click', () => {
  const fInvestmentAmount = document.getElementById('f_investmentAmount').value
  const fDailyGMV = document.getElementById('f_dailyGMV').value
  const fRevenueSharingRate = document.getElementById('f_revenueSharingRate').value
  const fPaymentFrequency = document.getElementById('f_paymentFrequency').value
  
  if (!fInvestmentAmount || !fDailyGMV || !fRevenueSharingRate) {
    alert('请先在融资方计算器中输入数据')
    return
  }
  
  document.getElementById('i_investmentAmount').value = fInvestmentAmount
  document.getElementById('i_dailyGMV').value = fDailyGMV
  document.getElementById('i_revenueSharingRate').value = fRevenueSharingRate
  document.getElementById('i_paymentFrequency').value = fPaymentFrequency
  
  let targetReturnRate = 15
  switch(fPaymentFrequency) {
    case 'daily': targetReturnRate = 13; break
    case 'weekly': targetReturnRate = 15; break
    case 'biweekly': targetReturnRate = 18; break
  }
  document.getElementById('i_targetReturnRate').value = targetReturnRate
  
  const button = document.getElementById('copyFromFinancing')
  const originalText = button.innerHTML
  button.innerHTML = '<i class="fas fa-check mr-1"></i>已套用'
  button.classList.add('bg-green-100', 'text-green-700')
  button.classList.remove('bg-blue-100', 'text-blue-700')
  
  setTimeout(() => {
    button.innerHTML = originalText
    button.classList.remove('bg-green-100', 'text-green-700')
    button.classList.add('bg-blue-100', 'text-blue-700')
  }, 2000)
  
  document.getElementById('investmentForm').scrollIntoView({ behavior: 'smooth', block: 'center' })
})

// 协议表单 - 分成频率变化时自动更新年化成本
document.getElementById('ag_payment_frequency')?.addEventListener('change', function() {
  const frequency = this.value
  const annualRateInput = document.getElementById('ag_annual_return_rate')
  
  let rate = ''
  switch(frequency) {
    case 'daily': rate = '13'; break
    case 'weekly': rate = '15'; break
    case 'biweekly': rate = '18'; break
  }
  
  annualRateInput.value = rate ? `${rate}%` : ''
})

// 协议表单提交
document.getElementById('agreementForm')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  // 收集所有表单数据
  const formData = {
    partner_company_name: document.getElementById('partner_company_name').value,
    partner_credit_code: document.getElementById('partner_credit_code').value,
    partner_legal_rep: document.getElementById('partner_legal_rep').value,
    partner_address: document.getElementById('partner_address').value,
    partner_business: document.getElementById('partner_business').value,
    agency_company_name: document.getElementById('agency_company_name').value,
    agency_credit_code: document.getElementById('agency_credit_code').value,
    total_investment: document.getElementById('total_investment').value,
    investment_times: document.getElementById('investment_times').value,
    single_investment: document.getElementById('single_investment').value,
    revenue_sharing_rate: document.getElementById('revenue_sharing_rate').value,
    annual_cost_rate: document.getElementById('annual_cost_rate').value,
    payment_frequency: document.getElementById('payment_frequency').value,
    agency_account_name: document.getElementById('agency_account_name').value,
    agency_account_number: document.getElementById('agency_account_number').value,
    agency_bank: document.getElementById('agency_bank').value,
    agency_bank_branch: document.getElementById('agency_bank_branch').value,
    partner_invoice_name: document.getElementById('partner_invoice_name').value,
    partner_tax_id: document.getElementById('partner_tax_id').value
  }
  
  // 验证必填字段
  const requiredFields = [
    'partner_company_name', 'partner_credit_code', 'partner_legal_rep', 'partner_address', 
    'partner_business', 'total_investment', 'single_investment', 'revenue_sharing_rate'
  ]
  
  for (const field of requiredFields) {
    if (!formData[field]) {
      alert('请填写所有必填项（标注*的字段）')
      return
    }
  }
  
  // 生成协议文本
  const freqText = {
    'daily': '每自然日',
    'weekly': '每一个自然周',
    'biweekly': '每两个自然周'
  }[formData.payment_frequency] || formData.payment_frequency
  
  const agreementText = `
投流通投资联营协议草案

═══════════════════════════════════════════════════════

一、联营方信息（品牌商家）
────────────────────────────────────────────────────
  企业名称：${formData.partner_company_name}
  统一社会信用代码：${formData.partner_credit_code}
  法定代表人：${formData.partner_legal_rep}
  注册地址：${formData.partner_address}
  经营品牌/商品类别：${formData.partner_business}

二、合作方信息（投流代理商）
────────────────────────────────────────────────────
  企业名称：${formData.agency_company_name || '待补充'}
  统一社会信用代码：${formData.agency_credit_code || '待补充'}

三、联营资金安排
────────────────────────────────────────────────────
  联营资金总额：¥${parseFloat(formData.total_investment).toLocaleString('zh-CN')} 元
  分次提供：${formData.investment_times}次
  单次投资金额：¥${parseFloat(formData.single_investment).toLocaleString('zh-CN')} 元

四、分成方案
────────────────────────────────────────────────────
  分成比例：${formData.revenue_sharing_rate}%
  年化成本率：${formData.annual_cost_rate}%
  分成付款频率：${freqText}

五、YITO封顶机制
────────────────────────────────────────────────────
  封顶公式：
  封顶金额 = 联营资金 × (1 + 年化成本率 × 联营天数 ÷ 360)
  
  当累计分成达到封顶金额时，联营合作自动终止。

六、银行账户信息
────────────────────────────────────────────────────
  合作方收款账户：
    户名：${formData.agency_account_name || '待补充'}
    账号：${formData.agency_account_number || '待补充'}
    开户行：${formData.agency_bank || '待补充'}
    开户支行：${formData.agency_bank_branch || '待补充'}
  
  联营方开票信息：
    企业名称：${formData.partner_invoice_name || '待补充'}
    纳税人识别号：${formData.partner_tax_id || '待补充'}

═══════════════════════════════════════════════════════

生成时间：${new Date().toLocaleString('zh-CN')}

注意：本草案仅供参考，正式协议需联系滴灌通工作人员确认。
  `
  
  // 显示成功提示并提供下载
  const resultDiv = document.getElementById('agreementResult')
  resultDiv.innerHTML = `
    <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
      <div class="flex items-center mb-3">
        <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
        <div>
          <h4 class="font-semibold text-gray-800">协议信息已收集成功！</h4>
          <p class="text-sm text-gray-600 mt-1">
            您可以预览或下载协议草案，正式签署请联系滴灌通工作人员。
          </p>
        </div>
      </div>
      <div class="flex gap-3 mt-4">
        <button 
          id="downloadAgreement"
          class="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          <i class="fas fa-download mr-2"></i>下载协议草案
        </button>
        <button 
          id="previewAgreementText"
          class="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
        >
          <i class="fas fa-eye mr-2"></i>预览协议内容
        </button>
      </div>
    </div>
  `
  
  resultDiv.classList.remove('hidden')
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  
  // 下载协议功能
  document.getElementById('downloadAgreement')?.addEventListener('click', () => {
    const blob = new Blob([agreementText], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `投流通联营协议草案_${formData.partner_company_name}_${new Date().toISOString().slice(0,10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  })
  
  // 预览协议功能
  document.getElementById('previewAgreementText')?.addEventListener('click', () => {
    alert(agreementText)
  })
  
  // 在实际应用中，这里应该发送到后端API保存数据
  console.log('协议数据已收集:', formData)
})

// 页面加载动画
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadeIn')
      }
    })
  }, { threshold: 0.1 })
  
  document.querySelectorAll('.bg-white').forEach(card => {
    observer.observe(card)
  })
})

// 输入验证
document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('input', function() {
    if (this.value < 0) this.value = 0
  })
})
