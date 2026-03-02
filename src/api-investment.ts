// 投资方案API模块
// src/api-investment.ts

import { Hono } from 'hono'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

// ==========================================
// 1. 生成90天CSV模板
// ==========================================
app.get('/template', async (c) => {
  try {
    // 生成最近90天的日期
    const dates = []
    const today = new Date()
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    // 生成CSV内容
    let csv = '日期,净成交金额（元）\n'
    dates.forEach(date => {
      csv += `${date},\n`
    })
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="daily_revenue_template.csv"'
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 2. 获取投资方案配置
// ==========================================
app.get('/config', async (c) => {
  try {
    const db = c.env.DB
    
    // 获取所有配置
    const configs = await db.prepare(`
      SELECT config_key, config_value, description 
      FROM system_config 
      WHERE config_key IN ('max_partnership_days', 'annual_rate_daily', 'annual_rate_weekly', 'annual_rate_biweekly')
    `).all()
    
    const configObj: any = {}
    configs.results.forEach((row: any) => {
      configObj[row.config_key] = parseFloat(row.config_value)
    })
    
    return c.json({
      success: true,
      data: {
        maxPartnershipDays: configObj.max_partnership_days || 60,
        annualRates: {
          daily: configObj.annual_rate_daily || 0.13,
          weekly: configObj.annual_rate_weekly || 0.15,
          biweekly: configObj.annual_rate_biweekly || 0.18
        }
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 3. 上传90天数据
// ==========================================
app.post('/projects/:id/daily-revenue', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    const body = await c.req.json()
    
    // 验证数据格式
    if (!body.data || !Array.isArray(body.data)) {
      return c.json({ success: false, error: '数据格式错误' }, 400)
    }
    
    const data = body.data
    
    // 验证数据完整性
    if (data.length !== 90) {
      return c.json({ success: false, error: `需要90天数据，当前只有${data.length}天` }, 400)
    }
    
    // 验证每条数据
    const validData: Array<{date: string, amount: number}> = []
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      if (!item.date || !item.amount) {
        return c.json({ success: false, error: `第${i+1}行数据不完整` }, 400)
      }
      
      const amount = parseFloat(item.amount)
      if (isNaN(amount) || amount < 0) {
        return c.json({ success: false, error: `第${i+1}行金额无效` }, 400)
      }
      
      validData.push({
        date: item.date,
        amount: amount
      })
    }
    
    // 计算统计数据
    const amounts = validData.map(d => d.amount)
    const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const stdDev = Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length)
    const volatility = avg > 0 ? stdDev / avg : 0
    
    // 存储数据
    await db.prepare(`
      UPDATE projects 
      SET daily_revenue_data = ?,
          daily_revenue_uploaded_at = datetime('now'),
          daily_revenue_volatility = ?
      WHERE id = ?
    `).bind(
      JSON.stringify(validData),
      volatility,
      projectId
    ).run()
    
    return c.json({
      success: true,
      data: {
        count: validData.length,
        average: Math.round(avg * 100) / 100,
        volatility: Math.round(volatility * 10000) / 100, // 转为百分比
        standardDeviation: Math.round(stdDev * 100) / 100
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 4. 计算最高可联营金额
// ==========================================
app.post('/projects/:id/max-investment', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    const body = await c.req.json()
    
    // 获取项目的90天数据
    const project = await db.prepare(`
      SELECT daily_revenue_data FROM projects WHERE id = ?
    `).bind(projectId).first()
    
    if (!project || !project.daily_revenue_data) {
      return c.json({ success: false, error: '请先上传90天净成交数据' }, 400)
    }
    
    // 解析数据
    const data = JSON.parse(project.daily_revenue_data as string)
    const amounts = data.map((d: any) => d.amount)
    const avgDailyRevenue = amounts.reduce((sum: number, a: number) => sum + a, 0) / amounts.length
    
    // 获取联营期限配置
    const config = await db.prepare(`
      SELECT config_value FROM system_config WHERE config_key = 'max_partnership_days'
    `).first()
    
    const maxDays = config ? parseInt(config.config_value as string) : 60
    
    // 获取分成比例
    const profitShareRatio = body.profitShareRatio || 0.15
    
    // 计算最高可联营金额 = 平均每日净成交 × 联营期限 × 分成比例
    const maxInvestment = avgDailyRevenue * maxDays * profitShareRatio
    
    // 更新到数据库
    await db.prepare(`
      UPDATE projects 
      SET max_investment_amount = ?,
          estimated_days = ?,
          profit_share_ratio = ?
      WHERE id = ?
    `).bind(
      maxInvestment,
      maxDays,
      profitShareRatio,
      projectId
    ).run()
    
    return c.json({
      success: true,
      data: {
        avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
        maxPartnershipDays: maxDays,
        profitShareRatio: profitShareRatio,
        maxInvestmentAmount: Math.round(maxInvestment * 100) / 100
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 5. 创建投资方案（YITO封顶计算）
// ==========================================
app.post('/projects/:id/investment-plan', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    const body = await c.req.json()
    
    // 验证必填字段
    if (!body.investmentAmount || !body.paymentFrequency) {
      return c.json({ success: false, error: '缺少必填字段' }, 400)
    }
    
    const investmentAmount = parseFloat(body.investmentAmount)
    const paymentFrequency = body.paymentFrequency // 'daily', 'weekly', 'biweekly'
    
    // 获取年化收益率配置
    const rateKey = `annual_rate_${paymentFrequency}`
    const rateConfig = await db.prepare(`
      SELECT config_value FROM system_config WHERE config_key = ?
    `).bind(rateKey).first()
    
    if (!rateConfig) {
      return c.json({ success: false, error: '无效的付款频率' }, 400)
    }
    
    const annualRate = parseFloat(rateConfig.config_value as string)
    
    // 获取联营天数
    const project = await db.prepare(`
      SELECT estimated_days, max_investment_amount FROM projects WHERE id = ?
    `).bind(projectId).first()
    
    if (!project) {
      return c.json({ success: false, error: '项目不存在' }, 404)
    }
    
    const estimatedDays = project.estimated_days as number || 60
    const maxInvestment = project.max_investment_amount as number || 0
    
    // 验证投资金额不超过最高可联营金额
    if (investmentAmount > maxInvestment) {
      return c.json({
        success: false,
        error: `联营资金总额不能超过最高可联营金额 ¥${maxInvestment.toLocaleString()}`
      }, 400)
    }
    
    // YITO封顶计算：总支付金额 = 联营资金总额 × (1 + 年化收益率 × 预计联营天数 / 360)
    const totalReturnAmount = investmentAmount * (1 + annualRate * estimatedDays / 360)
    
    // 计算每次支付金额
    let paymentsCount = 0
    let paymentAmount = 0
    
    switch (paymentFrequency) {
      case 'daily':
        paymentsCount = estimatedDays
        paymentAmount = totalReturnAmount / paymentsCount
        break
      case 'weekly':
        paymentsCount = Math.ceil(estimatedDays / 7)
        paymentAmount = totalReturnAmount / paymentsCount
        break
      case 'biweekly':
        paymentsCount = Math.ceil(estimatedDays / 14)
        paymentAmount = totalReturnAmount / paymentsCount
        break
    }
    
    // 保存投资方案
    await db.prepare(`
      UPDATE projects 
      SET investment_amount = ?,
          payment_frequency = ?,
          annual_rate = ?,
          total_return_amount = ?,
          investment_plan_created_at = datetime('now')
      WHERE id = ?
    `).bind(
      investmentAmount,
      paymentFrequency,
      annualRate,
      totalReturnAmount,
      projectId
    ).run()
    
    return c.json({
      success: true,
      data: {
        investmentAmount: Math.round(investmentAmount * 100) / 100,
        paymentFrequency: paymentFrequency,
        annualRate: annualRate,
        estimatedDays: estimatedDays,
        totalReturnAmount: Math.round(totalReturnAmount * 100) / 100,
        paymentsCount: paymentsCount,
        paymentAmount: Math.round(paymentAmount * 100) / 100
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 6. 获取项目投资方案详情
// ==========================================
app.get('/projects/:id/investment-plan', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    
    const project = await db.prepare(`
      SELECT 
        daily_revenue_data,
        daily_revenue_uploaded_at,
        daily_revenue_volatility,
        max_investment_amount,
        investment_amount,
        profit_share_ratio,
        payment_frequency,
        annual_rate,
        estimated_days,
        total_return_amount,
        investment_plan_created_at
      FROM projects 
      WHERE id = ?
    `).bind(projectId).first()
    
    if (!project) {
      return c.json({ success: false, error: '项目不存在' }, 404)
    }
    
    return c.json({
      success: true,
      data: {
        hasRevenueData: !!project.daily_revenue_data,
        revenueDataUploadedAt: project.daily_revenue_uploaded_at,
        volatility: project.daily_revenue_volatility,
        maxInvestmentAmount: project.max_investment_amount,
        investmentAmount: project.investment_amount,
        profitShareRatio: project.profit_share_ratio,
        paymentFrequency: project.payment_frequency,
        annualRate: project.annual_rate,
        estimatedDays: project.estimated_days,
        totalReturnAmount: project.total_return_amount,
        investmentPlanCreatedAt: project.investment_plan_created_at
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app
