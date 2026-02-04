import { Hono } from 'hono'
import { renderer } from './renderer'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())
app.use(renderer)

// API路由 - 计算投流ROI
app.post('/api/calculate-roi', async (c) => {
  const { adSpend, roi } = await c.req.json()
  
  const salesAmount = adSpend * roi
  const profit = salesAmount - adSpend
  const profitMargin = (profit / salesAmount) * 100
  
  return c.json({
    adSpend,
    roi,
    salesAmount,
    profit,
    profitMargin
  })
})

// API路由 - 计算IRR投资回报
app.post('/api/calculate-irr', async (c) => {
  const { 
    investmentAmount,      // 投资金额
    revenueSharingRate,    // 分成比例
    dailyGMV,              // 日均GMV
    targetReturnRate,      // 目标回报率 (如18%)
    paymentFrequency       // 打款频率: 'daily', 'weekly', 'biweekly'
  } = await c.req.json()
  
  // 计算目标回收总额
  const targetTotalReturn = investmentAmount * (1 + targetReturnRate / 100)
  
  // 计算每日分成收入
  const dailyRevenue = dailyGMV * (revenueSharingRate / 100)
  
  // 计算回收天数
  const daysToBreakEven = Math.ceil(targetTotalReturn / dailyRevenue)
  
  // 根据打款频率计算打款次数和每次金额
  let paymentCount = 0
  let paymentAmount = 0
  let paymentInterval = 0
  let paymentFrequencyText = ''
  
  switch(paymentFrequency) {
    case 'daily':
      paymentInterval = 1
      paymentCount = daysToBreakEven
      paymentAmount = dailyRevenue
      paymentFrequencyText = '每日'
      break
    case 'weekly':
      paymentInterval = 7
      paymentCount = Math.ceil(daysToBreakEven / 7)
      paymentAmount = dailyRevenue * 7
      paymentFrequencyText = '每周'
      break
    case 'biweekly':
      paymentInterval = 14
      paymentCount = Math.ceil(daysToBreakEven / 14)
      paymentAmount = dailyRevenue * 14
      paymentFrequencyText = '每两周'
      break
    default:
      paymentInterval = 1
      paymentCount = daysToBreakEven
      paymentAmount = dailyRevenue
      paymentFrequencyText = '每日'
  }
  
  // 计算实际IRR (内部收益率)
  // 使用牛顿迭代法求解IRR
  const calculateIRR = (cashFlows: number[], guess: number = 0.1): number => {
    const maxIterations = 1000
    const tolerance = 0.00001
    let rate = guess
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0
      let dnpv = 0
      
      cashFlows.forEach((cf, t) => {
        npv += cf / Math.pow(1 + rate, t)
        dnpv -= t * cf / Math.pow(1 + rate, t + 1)
      })
      
      const newRate = rate - npv / dnpv
      
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate
      }
      
      rate = newRate
    }
    
    return rate
  }
  
  // 构建现金流数组
  const cashFlows: number[] = [-investmentAmount] // 初始投资为负
  
  // 根据打款频率添加回款现金流
  for (let i = 0; i < paymentCount; i++) {
    cashFlows.push(paymentAmount)
  }
  
  // 计算年化IRR
  const periodicIRR = calculateIRR(cashFlows)
  let annualIRR = 0
  
  if (paymentFrequency === 'daily') {
    annualIRR = Math.pow(1 + periodicIRR, 365) - 1
  } else if (paymentFrequency === 'weekly') {
    annualIRR = Math.pow(1 + periodicIRR, 52) - 1
  } else if (paymentFrequency === 'biweekly') {
    annualIRR = Math.pow(1 + periodicIRR, 26) - 1
  }
  
  return c.json({
    investmentAmount,
    targetReturnRate,
    targetTotalReturn,
    dailyGMV,
    dailyRevenue,
    revenueSharingRate,
    daysToBreakEven,
    paymentFrequency: paymentFrequencyText,
    paymentInterval,
    paymentCount,
    paymentAmount,
    irr: annualIRR * 100, // 转换为百分比
    actualReturnRate: ((targetTotalReturn - investmentAmount) / investmentAmount) * 100
  })
})

// 主页面
app.get('/', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div class="max-w-7xl mx-auto px-4">
          <div class="text-center">
            <h1 class="text-5xl font-bold mb-4">滴灌通·投流通</h1>
            <p class="text-2xl mb-2">以金融科技赋能电商投流增长</p>
            <p class="text-xl opacity-90">连接全球资本与小微企业</p>
          </div>
        </div>
      </div>

      {/* Introduction Section */}
      <div class="max-w-7xl mx-auto px-4 py-16">
        <div class="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">项目介绍</h2>
          
          <div class="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 class="text-xl font-semibold text-blue-600 mb-4">💡 核心模式：RBF收入分成融资</h3>
              <ul class="space-y-2 text-gray-700">
                <li class="flex items-start">
                  <span class="text-blue-500 mr-2">✓</span>
                  <span><strong>非股非债</strong>：不稀释股权，无固定还款压力</span>
                </li>
                <li class="flex items-start">
                  <span class="text-blue-500 mr-2">✓</span>
                  <span><strong>风险共担</strong>：按日营收分成，业绩好多分，业绩差少分</span>
                </li>
                <li class="flex items-start">
                  <span class="text-blue-500 mr-2">✓</span>
                  <span><strong>专款专用</strong>：资金直连抖音投流账户，精准助推增长</span>
                </li>
                <li class="flex items-start">
                  <span class="text-blue-500 mr-2">✓</span>
                  <span><strong>生态协同</strong>：联动优质投流代理商，一站式服务</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 class="text-xl font-semibold text-green-600 mb-4">📊 YITO投资机制</h3>
              <ul class="space-y-2 text-gray-700">
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span><strong>收益锚定</strong>：目标年化收益率 18%</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span><strong>期限灵活</strong>：达到目标收益即退出，无固定期限</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span><strong>分成比例</strong>：15%-29% 按GMV分成</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span><strong>打款灵活</strong>：支持每日/每周/两周打款</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="bg-blue-50 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-gray-800 mb-4">🎯 投流赛道优势</h3>
            <div class="grid md:grid-cols-3 gap-6">
              <div>
                <h4 class="font-semibold text-blue-700 mb-2">市场规模大</h4>
                <p class="text-gray-600 text-sm">抖音电商GMV 3.5万亿+，投流市场 1万亿+</p>
              </div>
              <div>
                <h4 class="font-semibold text-blue-700 mb-2">数据透明</h4>
                <p class="text-gray-600 text-sm">官方平台数据实时可见，不可篡改</p>
              </div>
              <div>
                <h4 class="font-semibold text-blue-700 mb-2">闭环管控</h4>
                <p class="text-gray-600 text-sm">资金直连投流账户，专款专用有保障</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculator Section */}
        <div class="grid lg:grid-cols-2 gap-8">
          {/* ROI Calculator */}
          <div class="bg-white rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
              <i class="fas fa-calculator mr-2 text-blue-600"></i>
              投流ROI计算器
            </h2>
            
            <form id="roiForm" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  广告投放金额 (元)
                </label>
                <input 
                  type="number" 
                  id="adSpend" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：100000"
                  value="100000"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ROI倍数
                </label>
                <input 
                  type="number" 
                  id="roi" 
                  step="0.1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：3.0"
                  value="3.0"
                />
                <p class="text-xs text-gray-500 mt-1">成熟期：2-3，成长期：3-4.5</p>
              </div>
              
              <button 
                type="submit"
                class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                计算ROI
              </button>
            </form>
            
            <div id="roiResult" class="mt-6 hidden">
              <div class="bg-green-50 rounded-lg p-4 space-y-2">
                <h3 class="font-semibold text-gray-800 mb-3">计算结果：</h3>
                <div class="flex justify-between">
                  <span class="text-gray-600">销售金额：</span>
                  <span class="font-semibold text-green-600" id="salesAmount"></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">利润：</span>
                  <span class="font-semibold text-green-600" id="profit"></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">利润率：</span>
                  <span class="font-semibold text-green-600" id="profitMargin"></span>
                </div>
              </div>
            </div>
          </div>

          {/* IRR Calculator */}
          <div class="bg-white rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
              <i class="fas fa-chart-line mr-2 text-green-600"></i>
              IRR投资回报计算器
            </h2>
            
            <form id="irrForm" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  投资金额 (元)
                </label>
                <input 
                  type="number" 
                  id="investmentAmount" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如：1000000"
                  value="1000000"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  日均GMV (元)
                </label>
                <input 
                  type="number" 
                  id="dailyGMV" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如：500000"
                  value="500000"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  分成比例 (%)
                </label>
                <input 
                  type="number" 
                  id="revenueSharingRate" 
                  step="0.1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如：20"
                  value="20"
                />
                <p class="text-xs text-gray-500 mt-1">典型范围：15%-29%</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  目标回报率 (%)
                </label>
                <input 
                  type="number" 
                  id="targetReturnRate" 
                  step="0.1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如：18"
                  value="18"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  打款频率
                </label>
                <select 
                  id="paymentFrequency"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="daily">每日</option>
                  <option value="weekly">每周</option>
                  <option value="biweekly">每两周</option>
                </select>
              </div>
              
              <button 
                type="submit"
                class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                计算IRR
              </button>
            </form>
            
            <div id="irrResult" class="mt-6 hidden">
              <div class="bg-blue-50 rounded-lg p-4 space-y-2">
                <h3 class="font-semibold text-gray-800 mb-3">计算结果：</h3>
                <div class="flex justify-between">
                  <span class="text-gray-600">目标回收总额：</span>
                  <span class="font-semibold text-blue-600" id="targetTotal"></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">每日分成收入：</span>
                  <span class="font-semibold text-blue-600" id="dailyIncome"></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">预计回收天数：</span>
                  <span class="font-semibold text-blue-600" id="daysToBreak"></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">打款次数：</span>
                  <span class="font-semibold text-blue-600" id="paymentCount"></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">每次打款金额：</span>
                  <span class="font-semibold text-blue-600" id="paymentAmount"></span>
                </div>
                <div class="bg-green-100 rounded p-3 mt-4">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-800 font-semibold">年化IRR：</span>
                    <span class="text-2xl font-bold text-green-700" id="irrValue"></span>
                  </div>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">实际回报率：</span>
                  <span class="font-semibold text-blue-600" id="actualReturn"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div class="mt-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white text-center">
          <h2 class="text-3xl font-bold mb-4">立即开启投流增长之旅</h2>
          <p class="text-xl mb-6">让好生意不缺钱，让每一分投流都变成盈利增量</p>
          <div class="flex justify-center gap-4 flex-wrap">
            <div class="bg-white/20 rounded-lg px-6 py-3">
              <div class="text-sm opacity-90">服务品牌</div>
              <div class="text-2xl font-bold">25,000+</div>
            </div>
            <div class="bg-white/20 rounded-lg px-6 py-3">
              <div class="text-sm opacity-90">年营收</div>
              <div class="text-2xl font-bold">30亿+</div>
            </div>
            <div class="bg-white/20 rounded-lg px-6 py-3">
              <div class="text-sm opacity-90">目标年化收益</div>
              <div class="text-2xl font-bold">18%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div class="bg-gray-800 text-white py-8">
        <div class="max-w-7xl mx-auto px-4 text-center">
          <p class="text-gray-400">© 2025 滴灌通集团 | 以金融科技连接全球资本与小微企业</p>
          <p class="text-gray-500 text-sm mt-2">创始人：李小加（前香港交易所行政总裁）</p>
        </div>
      </div>

      {/* JavaScript */}
      <script src="/static/app.js"></script>
    </div>
  )
})

export default app
