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
    company_name: document.getElementById('ag_company_name').value,
    credit_code: document.getElementById('ag_credit_code').value,
    legal_person: document.getElementById('ag_legal_person').value,
    address: document.getElementById('ag_address').value,
    brand: document.getElementById('ag_brand').value,
    shop_name: document.getElementById('ag_shop_name').value,
    partner_name: document.getElementById('ag_partner_name').value,
    partner_credit_code: document.getElementById('ag_partner_credit_code').value,
    investment_amount: document.getElementById('ag_investment_amount').value,
    revenue_sharing_rate: document.getElementById('ag_revenue_sharing_rate').value,
    payment_frequency: document.getElementById('ag_payment_frequency').value,
    annual_return_rate: document.getElementById('ag_annual_return_rate').value,
    data_transfer: document.getElementById('ag_data_transfer').value,
    bank_account_name: document.getElementById('ag_bank_account_name').value,
    bank_account_number: document.getElementById('ag_bank_account_number').value,
    bank_name: document.getElementById('ag_bank_name').value,
    bank_branch: document.getElementById('ag_bank_branch').value
  }
  
  // 验证必填字段
  const requiredFields = [
    'company_name', 'credit_code', 'legal_person', 'address', 'brand', 'shop_name',
    'partner_name', 'partner_credit_code', 'investment_amount', 'revenue_sharing_rate',
    'payment_frequency', 'data_transfer', 'bank_account_name', 'bank_account_number',
    'bank_name', 'bank_branch'
  ]
  
  for (const field of requiredFields) {
    if (!formData[field]) {
      alert('请填写所有必填项（标注*的字段）')
      return
    }
  }
  
  // 显示成功提示
  document.getElementById('agreementResult').classList.remove('hidden')
  document.getElementById('agreementResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  
  // 在实际应用中，这里应该发送到后端API保存数据
  console.log('协议数据已收集:', formData)
})

// 预览协议按钮
document.getElementById('previewAgreement')?.addEventListener('click', () => {
  const formData = {
    company_name: document.getElementById('ag_company_name').value || '[待填写]',
    brand: document.getElementById('ag_brand').value || '[待填写]',
    investment_amount: document.getElementById('ag_investment_amount').value || '[待填写]',
    revenue_sharing_rate: document.getElementById('ag_revenue_sharing_rate').value || '[待填写]',
    payment_frequency: document.getElementById('ag_payment_frequency').value || '[待填写]',
    annual_return_rate: document.getElementById('ag_annual_return_rate').value || '[待填写]'
  }
  
  let freqText = ''
  switch(formData.payment_frequency) {
    case 'daily': freqText = '每自然日'; break
    case 'weekly': freqText = '每一个自然周'; break
    case 'biweekly': freqText = '每两个自然周'; break
    default: freqText = formData.payment_frequency
  }
  
  const previewText = `
联营协议预览

联营方：${formData.company_name}
经营品牌：${formData.brand}

联营资金：${formData.investment_amount} 元
分成比例：${formData.revenue_sharing_rate}%
分成频率：${freqText}
年化成本：${formData.annual_return_rate}

YITO封顶机制：
封顶金额 = 联营资金 × (1 + 年化成本 × 联营天数 ÷ 360)

当累计分成达到封顶金额时，联营合作自动终止。
  `
  
  alert(previewText)
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
