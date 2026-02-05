// 融资方计算器
document.getElementById('financingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const investmentAmount = parseFloat(document.getElementById('f_investmentAmount').value)
  const dailyGMV = parseFloat(document.getElementById('f_dailyGMV').value)
  const revenueSharingRate = parseFloat(document.getElementById('f_revenueSharingRate').value)
  const annualReturnRate = parseFloat(document.getElementById('f_annualReturnRate').value)
  const paymentFrequency = document.getElementById('f_paymentFrequency').value
  
  try {
    const response = await fetch('/api/calculate-financing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        investmentAmount,
        dailyGMV,
        revenueSharingRate,
        annualReturnRate,
        paymentFrequency
      })
    })
    
    const data = await response.json()
    
    // 显示结果
    document.getElementById('financingResult').classList.remove('hidden')
    document.getElementById('f_dailyCost').textContent = `¥${data.dailyCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('f_days').textContent = `${data.daysToComplete}天`
    document.getElementById('f_totalPayment').textContent = `¥${data.totalPayment.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('f_actualCost').textContent = `¥${data.actualCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('f_actualRate').textContent = `${data.actualAnnualRate.toFixed(2)}%`
    document.getElementById('f_paymentInfo').textContent = `${data.paymentFrequency}打款，共${data.paymentCount}次，每次¥${data.paymentAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    
    // 滚动到结果
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        investmentAmount,
        dailyGMV,
        revenueSharingRate,
        targetReturnRate,
        paymentFrequency
      })
    })
    
    const data = await response.json()
    
    // 显示结果
    document.getElementById('investmentResult').classList.remove('hidden')
    document.getElementById('i_dailyRevenue').textContent = `¥${data.dailyRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('i_days').textContent = `${data.daysToBreakEven}天`
    document.getElementById('i_months').textContent = `${data.monthsToBreakEven}个月`
    document.getElementById('i_targetTotal').textContent = `¥${data.targetTotalReturn.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('i_irr').textContent = `${data.irr.toFixed(2)}%`
    document.getElementById('i_paymentInfo').textContent = `${data.paymentFrequency}回款，共${data.paymentCount}次，每次¥${data.paymentAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
    
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
    
    // 滚动到结果
    document.getElementById('investmentResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch (error) {
    console.error('计算错误:', error)
    alert('计算失败，请检查输入值')
  }
})

// 页面加载时的动画效果
document.addEventListener('DOMContentLoaded', () => {
  // 平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute('href'))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    })
  })
  
  // 数字动画效果
  const animateNumber = (element, target, duration = 1000) => {
    const start = 0
    const increment = target / (duration / 16)
    let current = start
    
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      element.textContent = Math.floor(current).toLocaleString('zh-CN')
    }, 16)
  }
  
  // 观察器用于触发动画
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadeIn')
      }
    })
  }, { threshold: 0.1 })
  
  // 观察所有卡片
  document.querySelectorAll('.bg-white').forEach(card => {
    observer.observe(card)
  })
})

// 添加输入验证
document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('input', function() {
    if (this.value < 0) {
      this.value = 0
    }
  })
})

// 添加工具提示功能
const addTooltip = (element, text) => {
  element.setAttribute('title', text)
  element.style.cursor = 'help'
}

// 为关键字段添加工具提示
document.addEventListener('DOMContentLoaded', () => {
  const tooltips = {
    'f_revenueSharingRate': '从每日GMV中分成的比例，用于偿还融资',
    'f_annualReturnRate': '融资的年化成本率，可选13%、15%或18%',
    'i_targetReturnRate': '投资的目标年化回报率',
    'i_dailyGMV': '融资企业的日均销售额（GMV）'
  }
  
  Object.entries(tooltips).forEach(([id, text]) => {
    const element = document.getElementById(id)
    if (element) {
      addTooltip(element, text)
    }
  })
})
