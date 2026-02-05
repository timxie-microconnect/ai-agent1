import { Hono } from 'hono'
import { renderer } from './renderer'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())
app.use(renderer)

// API路由 - 单笔联营融资方计算
app.post('/api/calculate-financing', async (c) => {
  const { 
    investmentAmount,
    dailyGMV,
    revenueSharingRate,
    paymentFrequency
  } = await c.req.json()
  
  // 根据打款频率自动确定年化成本
  let annualReturnRate = 0
  switch(paymentFrequency) {
    case 'daily':
      annualReturnRate = 13
      break
    case 'weekly':
      annualReturnRate = 15
      break
    case 'biweekly':
      annualReturnRate = 18
      break
    default:
      annualReturnRate = 15
  }
  
  const dailyRevenue = dailyGMV * (revenueSharingRate / 100)
  
  let days = 0
  let totalPaid = 0
  const maxDays = 365 * 3
  
  while (days < maxDays) {
    days++
    const cappedAmount = investmentAmount * (1 + annualReturnRate / 100 * days / 360)
    
    if (totalPaid + dailyRevenue >= cappedAmount) {
      totalPaid = cappedAmount
      break
    }
    
    totalPaid += dailyRevenue
  }
  
  const actualCost = totalPaid - investmentAmount
  
  let paymentInterval = 1
  let paymentCount = days
  let paymentAmount = dailyRevenue
  let paymentFrequencyText = '每日'
  
  switch(paymentFrequency) {
    case 'daily':
      paymentInterval = 1
      paymentCount = days
      paymentAmount = dailyRevenue
      paymentFrequencyText = '每日'
      break
    case 'weekly':
      paymentInterval = 7
      paymentCount = Math.ceil(days / 7)
      paymentAmount = dailyRevenue * 7
      paymentFrequencyText = '每周'
      break
    case 'biweekly':
      paymentInterval = 14
      paymentCount = Math.ceil(days / 14)
      paymentAmount = dailyRevenue * 14
      paymentFrequencyText = '每两周'
      break
  }
  
  return c.json({
    investmentAmount,
    dailyGMV,
    dailyRevenue,
    revenueSharingRate,
    annualReturnRate,
    daysToComplete: days,
    totalPayment: totalPaid,
    actualCost,
    paymentFrequency: paymentFrequencyText,
    paymentInterval,
    paymentCount,
    paymentAmount
  })
})

// API路由 - 单笔联营投资方计算
app.post('/api/calculate-investment', async (c) => {
  const { 
    investmentAmount,
    dailyGMV,
    revenueSharingRate,
    targetReturnRate,
    paymentFrequency
  } = await c.req.json()
  
  const dailyRevenue = dailyGMV * (revenueSharingRate / 100)
  
  let days = 0
  let totalReceived = 0
  const maxDays = 365 * 3
  
  while (days < maxDays) {
    days++
    totalReceived += dailyRevenue
    
    const yitoTarget = investmentAmount * (1 + targetReturnRate / 100 * days / 360)
    
    if (totalReceived >= yitoTarget) {
      totalReceived = yitoTarget
      break
    }
  }
  
  const targetTotalReturn = totalReceived
  
  let paymentInterval = 1
  let paymentCount = days
  let paymentAmount = dailyRevenue
  let paymentFrequencyText = '每日'
  
  switch(paymentFrequency) {
    case 'daily':
      paymentInterval = 1
      paymentCount = days
      paymentAmount = dailyRevenue
      paymentFrequencyText = '每日'
      break
    case 'weekly':
      paymentInterval = 7
      paymentCount = Math.ceil(days / 7)
      paymentAmount = dailyRevenue * 7
      paymentFrequencyText = '每周'
      break
    case 'biweekly':
      paymentInterval = 14
      paymentCount = Math.ceil(days / 14)
      paymentAmount = dailyRevenue * 14
      paymentFrequencyText = '每两周'
      break
  }
  
  // 计算投资周期总收益率（不年化）
  const totalReturn = ((targetTotalReturn - investmentAmount) / investmentAmount) * 100
  
  // 计算实际天数下的总收益金额
  const totalProfit = targetTotalReturn - investmentAmount
  
  // 生成现金流时间表（前12期）
  const cashFlowSchedule = []
  let cumulativeAmount = 0
  
  for (let i = 0; i < Math.min(12, paymentCount); i++) {
    const period = i + 1
    let dateDesc = ''
    let periodPayment = paymentAmount
    
    if (paymentFrequency === 'daily') {
      dateDesc = `第${period}天`
    } else if (paymentFrequency === 'weekly') {
      dateDesc = `第${period}周`
    } else {
      dateDesc = `第${period}期（双周）`
    }
    
    cumulativeAmount += periodPayment
    
    if (period === paymentCount && cumulativeAmount > targetTotalReturn) {
      periodPayment = targetTotalReturn - (cumulativeAmount - periodPayment)
      cumulativeAmount = targetTotalReturn
    }
    
    cashFlowSchedule.push({
      period,
      date: dateDesc,
      inflow: periodPayment,
      cumulative: Math.min(cumulativeAmount, targetTotalReturn)
    })
  }
  
  return c.json({
    investmentAmount,
    targetReturnRate,
    targetTotalReturn,
    dailyGMV,
    dailyRevenue,
    revenueSharingRate,
    daysToBreakEven: days,
    paymentFrequency: paymentFrequencyText,
    paymentInterval,
    paymentCount,
    paymentAmount,
    totalReturn,
    totalProfit,
    cashFlowSchedule
  })
})

// 主页面
app.get('/', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div class="bg-gradient-to-r from-red-600 to-red-700 text-white py-12 relative overflow-hidden">
        <div class="absolute top-0 right-0 opacity-10">
          <svg width="400" height="400" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="150" fill="white" />
          </svg>
        </div>
        <div class="max-w-7xl mx-auto px-4 relative z-10">
          <div class="text-center">
            <h1 class="text-5xl font-bold mb-3">滴灌通·投流通</h1>
            <p class="text-2xl mb-2">为抖音电商定制的投流资金解决方案</p>
            <p class="text-xl opacity-90">流量变销量，亿马当先生意旺！</p>
          </div>
        </div>
      </div>

      {/* Company Introduction */}
      <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">什么是投流通？</h2>
          
          <div class="grid md:grid-cols-3 gap-6 mb-8">
            <div class="text-center p-6 bg-red-50 rounded-lg">
              <div class="text-4xl mb-3">🏦</div>
              <h3 class="text-xl font-bold text-red-700 mb-2">不是借债</h3>
              <p class="text-gray-600">无需抵押担保，没有刚性还款，更没有个人连带责任！</p>
            </div>
            
            <div class="text-center p-6 bg-orange-50 rounded-lg">
              <div class="text-4xl mb-3">💰</div>
              <h3 class="text-xl font-bold text-orange-700 mb-2">收入分成</h3>
              <p class="text-gray-600">按约定比例从收入分成，风险共担，还款弹性，现金流压力小！</p>
            </div>
            
            <div class="text-center p-6 bg-yellow-50 rounded-lg">
              <div class="text-4xl mb-3">⚡</div>
              <h3 class="text-xl font-bold text-yellow-700 mb-2">资金直达</h3>
              <p class="text-gray-600">资金直达抖音广告账户，投放即马上+利润，助力新年业绩增长！</p>
            </div>
          </div>

          <div class="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg p-6">
            <h3 class="text-2xl font-bold mb-4 text-center">灵活的分成方案</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-white/30">
                    <th class="py-3 px-4 text-left">分成频率</th>
                    <th class="py-3 px-4 text-center">年化成本（锚定）</th>
                    <th class="py-3 px-4 text-center">日度成本</th>
                    <th class="py-3 px-4 text-center">核心规则</th>
                    <th class="py-3 px-4 text-center">早鸟客户融资有效期</th>
                  </tr>
                </thead>
                <tbody class="text-white/90">
                  <tr class="border-b border-white/20">
                    <td class="py-3 px-4 font-semibold">每日</td>
                    <td class="py-3 px-4 text-center">13%</td>
                    <td class="py-3 px-4 text-center">约0.036%</td>
                    <td class="py-3 px-4 text-center">每天报数、按频率分成打款</td>
                    <td class="py-3 px-4 text-center">两个月内</td>
                  </tr>
                  <tr class="border-b border-white/20">
                    <td class="py-3 px-4 font-semibold">每周</td>
                    <td class="py-3 px-4 text-center">15%</td>
                    <td class="py-3 px-4 text-center">约0.042%</td>
                    <td class="py-3 px-4 text-center">当累计分成达到约定条件时</td>
                    <td class="py-3 px-4 text-center">可循环申请</td>
                  </tr>
                  <tr>
                    <td class="py-3 px-4 font-semibold">每两周</td>
                    <td class="py-3 px-4 text-center">18%</td>
                    <td class="py-3 px-4 text-center">0.050%</td>
                    <td class="py-3 px-4 text-center">收入分成立即停止</td>
                    <td class="py-3 px-4 text-center">还达即停</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Two Calculators */}
        <div class="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Financing Calculator */}
          <div class="bg-white rounded-lg shadow-lg p-8 border-t-4 border-red-600">
            <div class="flex items-center mb-6">
              <div class="bg-red-100 rounded-full p-3 mr-4">
                <i class="fas fa-store text-2xl text-red-600"></i>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-800">单笔联营融资方计算器</h2>
                <p class="text-sm text-gray-600">评估您的融资成本（YITO封顶）</p>
              </div>
            </div>
            
            <form id="financingForm" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  融资金额 (元)
                </label>
                <input 
                  type="number" 
                  id="f_investmentAmount" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="例如：500000"
                  value="500000"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  日均GMV (元)
                </label>
                <input 
                  type="number" 
                  id="f_dailyGMV" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="例如：300000"
                  value="300000"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  分成比例 (%)
                </label>
                <input 
                  type="number" 
                  id="f_revenueSharingRate" 
                  step="0.1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="例如：15"
                  value="15"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  打款频率（自动锚定年化成本）
                </label>
                <select 
                  id="f_paymentFrequency"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="daily">每日（年化13%）</option>
                  <option value="weekly">每周（年化15%）</option>
                  <option value="biweekly">每两周（年化18%）</option>
                </select>
              </div>
              
              <button 
                type="submit"
                class="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition shadow-lg"
              >
                计算融资成本
              </button>
            </form>
            
            <div id="financingResult" class="mt-6 hidden">
              <div class="bg-red-50 rounded-lg p-4 space-y-3">
                <h3 class="font-semibold text-gray-800 mb-3 text-lg border-b pb-2">融资评估结果（YITO封顶）</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="bg-white p-3 rounded">
                    <span class="text-gray-600 block mb-1">年化成本</span>
                    <span class="font-bold text-red-600 text-lg" id="f_annualRate"></span>
                  </div>
                  <div class="bg-white p-3 rounded">
                    <span class="text-gray-600 block mb-1">每日分成支出</span>
                    <span class="font-bold text-red-600 text-lg" id="f_dailyCost"></span>
                  </div>
                  <div class="bg-white p-3 rounded">
                    <span class="text-gray-600 block mb-1">预计联营天数</span>
                    <span class="font-bold text-red-600 text-lg" id="f_days"></span>
                  </div>
                  <div class="bg-white p-3 rounded">
                    <span class="text-gray-600 block mb-1">总支付金额（封顶）</span>
                    <span class="font-bold text-red-600 text-lg" id="f_totalPayment"></span>
                  </div>
                  <div class="bg-white p-3 rounded">
                    <span class="text-gray-600 block mb-1">实际融资成本</span>
                    <span class="font-bold text-red-600 text-lg" id="f_actualCost"></span>
                  </div>
                </div>
                <div class="bg-white p-3 rounded border-l-4 border-red-500">
                  <div class="text-sm text-gray-600 mb-1">打款方式</div>
                  <div class="font-semibold" id="f_paymentInfo"></div>
                </div>
                <div class="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                  <div class="text-xs text-gray-600">💡 YITO封顶公式</div>
                  <div class="text-sm font-mono" id="f_yitoFormula"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Calculator */}
          <div class="bg-white rounded-lg shadow-lg p-8 border-t-4 border-blue-600">
            <div class="flex items-center mb-6">
              <div class="bg-blue-100 rounded-full p-3 mr-4">
                <i class="fas fa-hand-holding-usd text-2xl text-blue-600"></i>
              </div>
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-gray-800">单笔联营投资方计算器</h2>
                <p class="text-sm text-gray-600">评估CFO资产投资回报</p>
              </div>
              <button 
                id="copyFromFinancing"
                class="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition"
                title="一键套用融资方数据"
              >
                <i class="fas fa-copy mr-1"></i>套用
              </button>
            </div>
            
            <form id="investmentForm" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  投资金额 (元)
                </label>
                <input 
                  type="number" 
                  id="i_investmentAmount" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：500000"
                  value="500000"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  标的日均GMV (元)
                </label>
                <input 
                  type="number" 
                  id="i_dailyGMV" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：300000"
                  value="300000"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  分成比例 (%)
                </label>
                <input 
                  type="number" 
                  id="i_revenueSharingRate" 
                  step="0.1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：15"
                  value="15"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  目标回报率 (%)
                </label>
                <input 
                  type="number" 
                  id="i_targetReturnRate" 
                  step="0.1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：18"
                  value="18"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  回款频率
                </label>
                <select 
                  id="i_paymentFrequency"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">每日</option>
                  <option value="weekly">每周</option>
                  <option value="biweekly">每两周</option>
                </select>
              </div>
              
              <button 
                type="submit"
                class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                计算投资回报
              </button>
            </form>
            
            <div id="investmentResult" class="mt-6 hidden">
              <div class="bg-blue-50 rounded-lg p-4 space-y-3">
                <h3 class="font-semibold text-gray-800 mb-3 text-lg border-b pb-2">投资评估结果（YITO封顶）</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="bg-white p-3 rounded">
                    <span class="text-gray-600 block mb-1">每日分成收入</span>
                    <span class="font-bold text-blue-600 text-lg" id="i_dailyRevenue"></span>
                  </div>
                  <div class="bg-white p-3 rounded">
                    <span class="text-gray-600 block mb-1">预计联营天数</span>
                    <span class="font-bold text-blue-600 text-lg" id="i_days"></span>
                  </div>
                  <div class="bg-white p-3 rounded col-span-2">
                    <span class="text-gray-600 block mb-1">目标回收总额（封顶）</span>
                    <span class="font-bold text-blue-600 text-lg" id="i_targetTotal"></span>
                  </div>
                </div>
                <div class="bg-gradient-to-r from-blue-100 to-green-100 p-4 rounded-lg mt-3">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-700 font-semibold">投资周期总收益率</span>
                    <span class="text-2xl font-bold text-green-700" id="i_totalReturn"></span>
                  </div>
                  <div class="text-xs text-gray-600 mt-1">
                    （<span id="i_returnDays"></span>天投资周期的总回报）
                  </div>
                  <div class="mt-2 pt-2 border-t border-gray-300">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600 text-sm">总收益金额</span>
                      <span class="text-lg font-bold text-green-600" id="i_totalProfit"></span>
                    </div>
                  </div>
                </div>
                <div class="bg-white p-3 rounded border-l-4 border-blue-500">
                  <div class="text-sm text-gray-600 mb-1">回款方式</div>
                  <div class="font-semibold" id="i_paymentInfo"></div>
                </div>
              </div>
              
              {/* Cash Flow Schedule */}
              <div class="mt-4 bg-white rounded-lg border p-4">
                <h4 class="font-semibold text-gray-800 mb-3">预计现金流时间表（前12期）</h4>
                <div class="overflow-x-auto">
                  <table class="w-full text-xs">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="py-2 px-2 text-left">期数</th>
                        <th class="py-2 px-2 text-right">回款金额</th>
                        <th class="py-2 px-2 text-right">累计回款</th>
                      </tr>
                    </thead>
                    <tbody id="i_cashFlowTable" class="text-gray-700">
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Form */}
        <div class="bg-white rounded-lg shadow-lg p-8 border-t-4 border-purple-600">
          <div class="flex items-center mb-6">
            <div class="bg-purple-100 rounded-full p-3 mr-4">
              <i class="fas fa-file-contract text-2xl text-purple-600"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-800">联营协议预填项收集</h2>
              <p class="text-sm text-gray-600">填写以下信息以生成协议草案</p>
            </div>
          </div>
          
          <form id="agreementForm" class="space-y-6">
            {/* 联营方信息 */}
            <div class="bg-red-50 rounded-lg p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-building text-red-600 mr-2"></i>
                联营方信息（品牌商家）
              </h3>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    企业名称 *
                  </label>
                  <input 
                    type="text" 
                    id="partner_company_name"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="例如：某某贸易有限公司"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    统一社会信用代码 *
                  </label>
                  <input 
                    type="text" 
                    id="partner_credit_code"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="18位统一社会信用代码"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    注册地址 *
                  </label>
                  <input 
                    type="text" 
                    id="partner_address"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="完整的注册地址"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    法定代表人 *
                  </label>
                  <input 
                    type="text" 
                    id="partner_legal_rep"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="法定代表人姓名"
                    required
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    经营品牌/商品类别 *
                  </label>
                  <input 
                    type="text" 
                    id="partner_business"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="例如：于抖音平台销售XX品牌相关商品"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 合作方信息 */}
            <div class="bg-orange-50 rounded-lg p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-handshake text-orange-600 mr-2"></i>
                合作方信息（投流代理商）
              </h3>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    企业名称 *
                  </label>
                  <input 
                    type="text" 
                    id="agency_company_name"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="例如：良辰美（厦门）网络科技有限公司"
                    value="良辰美（厦门）网络科技有限公司"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    统一社会信用代码
                  </label>
                  <input 
                    type="text" 
                    id="agency_credit_code"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="18位统一社会信用代码"
                  />
                </div>
              </div>
            </div>

            {/* 联营资金安排 */}
            <div class="bg-blue-50 rounded-lg p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-money-bill-wave text-blue-600 mr-2"></i>
                联营资金安排
              </h3>
              <div class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    联营资金总额 (元) *
                  </label>
                  <input 
                    type="number" 
                    id="total_investment"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="例如：500000"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    分几次提供 *
                  </label>
                  <select 
                    id="investment_times"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="1">1次（一次性提供）</option>
                    <option value="2">2次</option>
                    <option value="3">3次</option>
                    <option value="4">4次</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    单次投资金额 (元) *
                  </label>
                  <input 
                    type="number" 
                    id="single_investment"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="例如：500000"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 分成方案 */}
            <div class="bg-green-50 rounded-lg p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-percentage text-green-600 mr-2"></i>
                分成方案
              </h3>
              <div class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    分成比例 (%) *
                  </label>
                  <input 
                    type="number" 
                    id="revenue_sharing_rate"
                    step="0.1"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="例如：15"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    年化成本率 (%) *
                  </label>
                  <select 
                    id="annual_cost_rate"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="13">13%（每日打款）</option>
                    <option value="15">15%（每周打款）</option>
                    <option value="18">18%（每两周打款）</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    分成付款频率 *
                  </label>
                  <select 
                    id="payment_frequency"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="daily">每自然日</option>
                    <option value="weekly">一个自然周</option>
                    <option value="biweekly">两个自然周</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 银行账户信息 */}
            <div class="bg-yellow-50 rounded-lg p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-university text-yellow-600 mr-2"></i>
                银行账户信息
              </h3>
              <div class="space-y-4">
                <div class="border-b pb-4">
                  <h4 class="font-semibold text-gray-700 mb-3">合作方收款账户</h4>
                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        户名
                      </label>
                      <input 
                        type="text" 
                        id="agency_account_name"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        账号
                      </label>
                      <input 
                        type="text" 
                        id="agency_account_number"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        开户行
                      </label>
                      <input 
                        type="text" 
                        id="agency_bank"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        开户支行
                      </label>
                      <input 
                        type="text" 
                        id="agency_bank_branch"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 class="font-semibold text-gray-700 mb-3">联营方开票信息</h4>
                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        企业名称
                      </label>
                      <input 
                        type="text" 
                        id="partner_invoice_name"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        纳税人识别号
                      </label>
                      <input 
                        type="text" 
                        id="partner_tax_id"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              class="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg text-lg"
            >
              <i class="fas fa-file-download mr-2"></i>
              生成协议草案
            </button>
          </form>
          
          <div id="agreementResult" class="mt-6 hidden">
            <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div class="flex items-center">
                <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
                <div>
                  <h4 class="font-semibold text-gray-800">协议信息已收集</h4>
                  <p class="text-sm text-gray-600 mt-1">
                    所有必要信息已填写完成，可以联系滴灌通工作人员生成正式协议文档。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Case Study */}
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow-lg p-8 border-l-4 border-yellow-500 mt-8">
          <h3 class="text-2xl font-bold text-gray-800 mb-4">
            <i class="fas fa-lightbulb text-yellow-600 mr-2"></i>
            举例试算
          </h3>
          <div class="bg-white rounded-lg p-6">
            <p class="text-gray-700 mb-4">
              <strong>以首次申请 500,000 元为例（遵守YITO封顶机制）</strong>
            </p>
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-semibold text-red-700 mb-2">方案：每周 · 收入分成（年化 15%）</h4>
                <p class="text-sm text-gray-600 mb-2">该方案下，<strong class="text-red-600">每周打款</strong>，根据YITO封顶公式计算。例如：</p>
                <ul class="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• <strong>第 15 天还款</strong>：封顶金额 <strong class="text-red-600">503,125.00 元</strong> = 500,000 × (1 + 15% × 15 ÷ 360)</li>
                  <li>• <strong>第 20 天还款</strong>：封顶金额 <strong class="text-red-600">504,166.67 元</strong> = 500,000 × (1 + 15% × 20 ÷ 360)</li>
                </ul>
                <p class="text-xs text-gray-500 mt-2">💡 达到封顶金额即停止，不多收一分钱！</p>
              </div>
              <div class="border-l-2 border-gray-200 pl-6">
                <h4 class="font-semibold text-gray-700 mb-2">💡 YITO机制说明</h4>
                <p class="text-sm text-gray-600 mb-2"><strong>封顶公式：</strong></p>
                <p class="text-sm font-mono bg-gray-100 p-2 rounded">封顶金额 = 本金 × (1 + 年化成本率 × 天数 ÷ 360)</p>
                <p class="text-xs text-gray-500 mt-2">这是<strong>单利</strong>计算，确保融资成本透明可控！</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div class="bg-gray-800 text-white py-8 mt-12">
        <div class="max-w-7xl mx-auto px-4">
          <div class="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <h4 class="font-bold text-lg mb-3">关于滴灌通</h4>
              <p class="text-gray-400 text-sm">以金融科技连接全球资本与中小微企业，让好生意不缺钱。</p>
            </div>
            <div>
              <h4 class="font-bold text-lg mb-3">核心数据</h4>
              <ul class="text-gray-400 text-sm space-y-1">
                <li>• 服务品牌：25,000+</li>
                <li>• 年营收：30亿+</li>
                <li>• 合作城市：300+</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-lg mb-3">创始团队</h4>
              <p class="text-gray-400 text-sm">李小加 - 前香港交易所行政总裁<br/>引领沪港通、深港通等关键改革</p>
            </div>
          </div>
          <div class="border-t border-gray-700 pt-6 text-center">
            <p class="text-gray-400 text-sm">© 2025 滴灌通集团 | 以金融科技连接全球资本与小微企业</p>
          </div>
        </div>
      </div>

      {/* JavaScript */}
      <script src="/static/app.js"></script>
    </div>
  )
})

export default app
