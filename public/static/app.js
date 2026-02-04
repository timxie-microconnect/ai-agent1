// ROI Calculator
document.getElementById('roiForm')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const adSpend = parseFloat(document.getElementById('adSpend').value)
  const roi = parseFloat(document.getElementById('roi').value)
  
  try {
    const response = await fetch('/api/calculate-roi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ adSpend, roi })
    })
    
    const data = await response.json()
    
    // 显示结果
    document.getElementById('roiResult').classList.remove('hidden')
    document.getElementById('salesAmount').textContent = `¥${data.salesAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('profit').textContent = `¥${data.profit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('profitMargin').textContent = `${data.profitMargin.toFixed(2)}%`
    
    // 滚动到结果
    document.getElementById('roiResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch (error) {
    console.error('计算错误:', error)
    alert('计算失败，请检查输入值')
  }
})

// IRR Calculator
document.getElementById('irrForm')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const investmentAmount = parseFloat(document.getElementById('investmentAmount').value)
  const dailyGMV = parseFloat(document.getElementById('dailyGMV').value)
  const revenueSharingRate = parseFloat(document.getElementById('revenueSharingRate').value)
  const targetReturnRate = parseFloat(document.getElementById('targetReturnRate').value)
  const paymentFrequency = document.getElementById('paymentFrequency').value
  
  try {
    const response = await fetch('/api/calculate-irr', {
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
    document.getElementById('irrResult').classList.remove('hidden')
    document.getElementById('targetTotal').textContent = `¥${data.targetTotalReturn.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('dailyIncome').textContent = `¥${data.dailyRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('daysToBreak').textContent = `${data.daysToBreakEven}天`
    document.getElementById('paymentCount').textContent = `${data.paymentCount}次 (${data.paymentFrequency})`
    document.getElementById('paymentAmount').textContent = `¥${data.paymentAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    document.getElementById('irrValue').textContent = `${data.irr.toFixed(2)}%`
    document.getElementById('actualReturn').textContent = `${data.actualReturnRate.toFixed(2)}%`
    
    // 滚动到结果
    document.getElementById('irrResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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
})
