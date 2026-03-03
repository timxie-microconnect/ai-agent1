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
// 3. 上传90天数据（新路径：revenue-data）
// ==========================================
app.post('/projects/:id/revenue-data', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    const body = await c.req.json()
    
    // 验证数据格式
    if (!body.revenueData || !Array.isArray(body.revenueData)) {
      return c.json({ success: false, error: '数据格式错误' }, 400)
    }
    
    const data = body.revenueData
    
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
// 5. 创建投资方案（YITO封顶计算 - 新逻辑）
// ==========================================
app.post('/projects/:id/investment-plan', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    const body = await c.req.json()
    
    // 验证必填字段
    if (!body.investmentAmount || !body.paymentFrequency || !body.profitShareRatio) {
      return c.json({ success: false, error: '缺少必填字段' }, 400)
    }
    
    const investmentAmount = parseFloat(body.investmentAmount)
    const paymentFrequency = body.paymentFrequency // 'daily', 'weekly', 'biweekly'
    const profitShareRatio = parseFloat(body.profitShareRatio)
    
    // 获取项目的90天数据
    const project = await db.prepare(`
      SELECT daily_revenue_data FROM projects WHERE id = ?
    `).bind(projectId).first()
    
    if (!project || !project.daily_revenue_data) {
      return c.json({ success: false, error: '请先上传90天净成交数据' }, 400)
    }
    
    // 计算平均净成交
    const revenueData = JSON.parse(project.daily_revenue_data as string)
    const amounts = revenueData.map((d: any) => d.amount)
    const avgDailyRevenue = amounts.reduce((sum: number, a: number) => sum + a, 0) / amounts.length
    
    // 核心逻辑：每日回款 = 平均净成交 × 分成比例
    const dailyRepayment = avgDailyRevenue * profitShareRatio
    
    // 核心逻辑：预计联营天数 = 联营资金总额 ÷ 每日回款
    const estimatedDays = Math.ceil(investmentAmount / dailyRepayment)
    
    // 获取年化收益率配置
    const rateKey = `annual_rate_${paymentFrequency}`
    const rateConfig = await db.prepare(`
      SELECT config_value FROM system_config WHERE config_key = ?
    `).bind(rateKey).first()
    
    if (!rateConfig) {
      return c.json({ success: false, error: '无效的付款频率' }, 400)
    }
    
    const annualRate = parseFloat(rateConfig.config_value as string)
    
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
          profit_share_ratio = ?,
          annual_rate = ?,
          estimated_days = ?,
          daily_repayment = ?,
          total_return_amount = ?,
          investment_plan_created_at = datetime('now')
      WHERE id = ?
    `).bind(
      investmentAmount,
      paymentFrequency,
      profitShareRatio,
      annualRate,
      estimatedDays,
      dailyRepayment,
      totalReturnAmount,
      projectId
    ).run()
    
    return c.json({
      success: true,
      data: {
        investmentAmount: Math.round(investmentAmount * 100) / 100,
        paymentFrequency: paymentFrequency,
        profitShareRatio: profitShareRatio,
        avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
        dailyRepayment: Math.round(dailyRepayment * 100) / 100,
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
        investment_amount,
        profit_share_ratio,
        payment_frequency,
        annual_rate,
        estimated_days,
        daily_repayment,
        total_return_amount,
        investment_plan_created_at
      FROM projects 
      WHERE id = ?
    `).bind(projectId).first()
    
    if (!project) {
      return c.json({ success: false, error: '项目不存在' }, 404)
    }
    
    // 如果有revenue_data，解析并返回
    let revenueData = null
    if (project.daily_revenue_data) {
      revenueData = JSON.parse(project.daily_revenue_data as string)
    }
    
    return c.json({
      success: true,
      data: {
        revenueData: revenueData,
        revenueDataUploadedAt: project.daily_revenue_uploaded_at,
        volatility: project.daily_revenue_volatility,
        investmentAmount: project.investment_amount,
        profitShareRatio: project.profit_share_ratio || 0.15,
        paymentFrequency: project.payment_frequency || 'daily',
        annualRate: project.annual_rate,
        estimatedDays: project.estimated_days,
        dailyRepayment: project.daily_repayment,
        totalReturnAmount: project.total_return_amount,
        investmentPlanCreatedAt: project.investment_plan_created_at
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app

// ==========================================

// ==========================================
// 7. 保存/更新挂牌信息（修复版）
// ==========================================
app.post('/projects/:id/listing-info', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    const body = await c.req.json()
    
    // 检查项目是否存在
    const project = await db.prepare(`
      SELECT id FROM projects WHERE id = ?
    `).bind(projectId).first()
    
    if (!project) {
      return c.json({ success: false, error: '项目不存在' }, 404)
    }
    
    // 检查是否已存在记录
    const existing = await db.prepare(`
      SELECT id FROM listing_info WHERE project_id = ?
    `).bind(projectId).first()
    
    const isSubmitted = body.is_submitted === true || body.is_submitted === 'true'
    const now = new Date().toISOString()
    
    // 字段列表（业务字段）
    const fields = [
      'company_name', 'registration_number', 'registered_address', 'establishment_date',
      'business_format', 'business_intro', 'business_scope',
      'legal_rep_name', 'legal_rep_id_type', 'legal_rep_id_number',
      'legal_rep_address', 'legal_rep_email', 'legal_rep_phone',
      'actual_controller_name', 'actual_controller_id_type', 'actual_controller_id_number',
      'actual_controller_address', 'actual_controller_email', 'actual_controller_phone',
      'beneficial_owner_name', 'beneficial_owner_id_type', 'beneficial_owner_id_number',
      'beneficial_owner_address', 'beneficial_owner_email', 'beneficial_owner_phone',
      'condition_1', 'condition_1_note', 'condition_2', 'condition_2_note',
      'condition_3', 'condition_4', 'condition_5',
      'revenue_2026', 'revenue_2027', 'revenue_2028', 'revenue_2029',
      'authorizer_name', 'authorizer_id_type', 'authorizer_id_number',
      'authorizer_address', 'authorizer_email', 'authorizer_phone'
    ]
    
    if (existing) {
      // 更新现有记录
      const setClause = fields.map(f => `${f} = ?`).join(', ')
      const values = fields.map(f => body[f] || null)
      
      await db.prepare(`
        UPDATE listing_info 
        SET ${setClause},
            is_submitted = ?,
            submitted_at = ?,
            updated_at = ?
        WHERE project_id = ?
      `).bind(...values, isSubmitted ? 1 : 0, isSubmitted ? now : null, now, projectId).run()
    } else {
      // 插入新记录
      const columns = ['project_id', ...fields, 'is_submitted', 'submitted_at']
      const placeholders = columns.map(() => '?').join(', ')
      const values = [projectId, ...fields.map(f => body[f] || null), isSubmitted ? 1 : 0, isSubmitted ? now : null]
      
      await db.prepare(`
        INSERT INTO listing_info (${columns.join(', ')})
        VALUES (${placeholders})
      `).bind(...values).run()
    }
    
    return c.json({
      success: true,
      message: isSubmitted ? '挂牌信息提交成功' : '草稿保存成功'
    })
  } catch (error: any) {
    console.error('保存挂牌信息失败:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 8. 获取挂牌信息
// ==========================================
app.get('/projects/:id/listing-info', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    
    const listingInfo = await db.prepare(`
      SELECT * FROM listing_info WHERE project_id = ?
    `).bind(projectId).first()
    
    if (!listingInfo) {
      return c.json({ success: true, data: null })
    }
    
    return c.json({
      success: true,
      data: listingInfo
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 导出挂牌信息为Excel
// ==========================================
app.get('/projects/:id/listing-info/export', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    
    // 获取项目基本信息（包括投资方案信息）
    const project = await db.prepare(`
      SELECT 
        submission_code, status, created_at,
        investment_amount, profit_share_ratio, payment_frequency,
        daily_repayment, estimated_days, annual_rate, total_return_amount
      FROM projects WHERE id = ?
    `).bind(projectId).first()
    
    if (!project) {
      return c.json({ success: false, error: '项目不存在' }, 404)
    }
    
    // 获取挂牌信息
    const listingInfo = await db.prepare(`
      SELECT * FROM listing_info WHERE project_id = ?
    `).bind(projectId).first()
    
    if (!listingInfo) {
      return c.json({ success: false, error: '未找到挂牌信息' }, 404)
    }
    
    // 构建Excel数据
    // 辅助函数：格式化回款频率
    const formatFrequency = (freq: string | null): string => {
      if (!freq) return '-'
      const freqMap: Record<string, string> = {
        'daily': '每日',
        'weekly': '每周',
        'biweekly': '每两周'
      }
      return freqMap[freq] || freq
    }
    
    const excelData: any = {
      '项目编号': project.submission_code,
      '项目状态': project.status,
      '创建时间': project.created_at,
      
      // 投资方案信息
      '联营资金总额（元）': project.investment_amount || '-',
      '分成比例': project.profit_share_ratio ? `${(project.profit_share_ratio * 100).toFixed(2)}%` : '-',
      '回款频率': formatFrequency(project.payment_frequency),
      '每日回款金额（元）': project.daily_repayment || '-',
      '预计联营天数': project.estimated_days || '-',
      '年化收益率': project.annual_rate ? `${(project.annual_rate * 100).toFixed(2)}%` : '-',
      '总支付金额（元）': project.total_return_amount || '-',
      
      // 1. 挂牌主体工商信息
      '企业中文名称': listingInfo.company_name || '-',
      '注册编号': listingInfo.registration_number || '-',
      '注册地址': listingInfo.registered_address || '-',
      '企业成立日期': listingInfo.establishment_date || '-',
      '主题业态': listingInfo.business_format || '-',
      '主营业务简介': listingInfo.business_intro || '-',
      '经营范围': listingInfo.business_scope || '-',
      
      // 2. 法定代表人
      '法定代表人中文姓名': listingInfo.legal_rep_name || '-',
      '法定代表人证件类型': listingInfo.legal_rep_id_type || '-',
      '法定代表人证件号码': listingInfo.legal_rep_id_number || '-',
      '法定代表人实际居住地址': listingInfo.legal_rep_address || '-',
      '法定代表人电邮': listingInfo.legal_rep_email || '-',
      '法定代表人电话': listingInfo.legal_rep_phone || '-',
      
      // 3. 实控人
      '实控人中文姓名': listingInfo.actual_controller_name || '-',
      '实控人证件类型': listingInfo.actual_controller_id_type || '-',
      '实控人证件号码': listingInfo.actual_controller_id_number || '-',
      '实控人实际居住地址': listingInfo.actual_controller_address || '-',
      '实控人电邮': listingInfo.actual_controller_email || '-',
      '实控人电话': listingInfo.actual_controller_phone || '-',
      
      // 4. 实益拥有人
      '实益拥有人中文姓名': listingInfo.beneficial_owner_name || '-',
      '实益拥有人证件类型': listingInfo.beneficial_owner_id_type || '-',
      '实益拥有人证件号码': listingInfo.beneficial_owner_id_number || '-',
      '实益拥有人实际居住地址': listingInfo.beneficial_owner_address || '-',
      '实益拥有人电邮': listingInfo.beneficial_owner_email || '-',
      '实益拥有人电话': listingInfo.beneficial_owner_phone || '-',
      
      // 5. 准入条件
      '存续时间不短于12个月': listingInfo.condition_1 || '-',
      '存续时间说明': listingInfo.condition_1_note || '-',
      '最近连续365日合计营业额不低于500万人民币': listingInfo.condition_2 || '-',
      '营业额说明': listingInfo.condition_2_note || '-',
      '有可靠且运营情况良好的收入管控系统': listingInfo.condition_3 || '-',
      '整体营收状况良好，能够达到营收能力要求': listingInfo.condition_4 || '-',
      '不存在重大法律合规风险': listingInfo.condition_5 || '-',
      
      // 6. 企业预计营收信息
      '2026年营业总收入/门店数': listingInfo.revenue_2026 || '-',
      '2027年营业总收入/门店数': listingInfo.revenue_2027 || '-',
      '2028年营业总收入/门店数': listingInfo.revenue_2028 || '-',
      '2029年营业总收入/门店数': listingInfo.revenue_2029 || '-',
      
      // 7. 授权人信息
      '授权人中文姓名': listingInfo.authorizer_name || '-',
      '授权人证件类型': listingInfo.authorizer_id_type || '-',
      '授权人证件号码': listingInfo.authorizer_id_number || '-',
      '授权人实际居住地址': listingInfo.authorizer_address || '-',
      '授权人电邮': listingInfo.authorizer_email || '-',
      '授权人电话': listingInfo.authorizer_phone || '-',
      
      // 文件链接
      '企业注册证书+公章': parseFileUrl(listingInfo.file_company_registration),
      '法定代表人身份证件（正反面）': parseFileUrl(listingInfo.file_legal_rep_id),
      '法定代表人住址证明': parseFileUrl(listingInfo.file_legal_rep_address_proof),
      '实际控制人身份证件（正反面）': parseFileUrl(listingInfo.file_actual_controller_id),
      '实际控制人住址证明': parseFileUrl(listingInfo.file_actual_controller_address_proof),
      '实控人证明文件+公章': parseFileUrl(listingInfo.file_actual_controller_proof),
      '实益拥有人身份证件（正反面）': parseFileUrl(listingInfo.file_beneficial_owner_id),
      '实益拥有人住址证明': parseFileUrl(listingInfo.file_beneficial_owner_address_proof),
      '存续时间证明文件': parseFileUrl(listingInfo.file_condition_1_proof),
      '营业额证明文件+公章': parseFileUrl(listingInfo.file_condition_2_proof),
      '未来12个月预估营业额信息+公章': parseFileUrl(listingInfo.file_revenue_forecast),
      '董事会成员及其他主要人员名册+公章': parseFileUrl(listingInfo.file_directors_list),
      '董事会书面决议授权+公章': parseFileUrl(listingInfo.file_board_resolution),
      '电邮申请说明+公章+授权人/法人签名': parseFileUrl(listingInfo.file_email_authorization),
      
      // 提交信息
      '是否已提交': listingInfo.is_submitted ? '是' : '否',
      '提交时间': listingInfo.submitted_at || '-'
    }
    
    // 辅助函数：解析文件URL
    function parseFileUrl(fileData: any): string {
      if (!fileData) return '-'
      try {
        const fileInfo = typeof fileData === 'string' ? JSON.parse(fileData) : fileData
        return fileInfo?.file_url || '-'
      } catch {
        return '-'
      }
    }
    
    // 返回JSON数据，前端使用xlsx库生成Excel
    return c.json({
      success: true,
      data: excelData,
      filename: `挂牌信息_${project.submission_code}_${new Date().toISOString().split('T')[0]}.xlsx`
    })
    
  } catch (error: any) {
    console.error('导出Excel失败:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 获取所有KYC文件下载链接
// ==========================================
app.get('/projects/:id/listing-files', async (c) => {
  try {
    const projectId = c.req.param('id')
    const db = c.env.DB
    
    // 获取项目基本信息
    const project = await db.prepare(`
      SELECT submission_code FROM projects WHERE id = ?
    `).bind(projectId).first()
    
    if (!project) {
      return c.json({ success: false, error: '项目不存在' }, 404)
    }
    
    // 获取挂牌信息（包含所有文件）
    const listingInfo = await db.prepare(`
      SELECT * FROM listing_info WHERE project_id = ?
    `).bind(projectId).first()
    
    if (!listingInfo) {
      return c.json({ success: false, error: '未找到挂牌信息' }, 404)
    }
    
    // 辅助函数：解析文件信息
    const parseFileInfo = (fileData: any, fileName: string) => {
      if (!fileData) return null
      try {
        const fileInfo = typeof fileData === 'string' ? JSON.parse(fileData) : fileData
        if (fileInfo && fileInfo.file_url) {
          return {
            name: fileName,
            originalName: fileInfo.file_name,
            url: fileInfo.file_url,
            size: fileInfo.file_size,
            type: fileInfo.file_type
          }
        }
      } catch (e) {
        console.warn('解析文件信息失败:', fileName, e)
      }
      return null
    }
    
    // 收集所有文件
    const files = [
      parseFileInfo(listingInfo.file_company_registration, '1_企业注册证书+公章'),
      parseFileInfo(listingInfo.file_legal_rep_id, '2_法定代表人身份证件（正反面）'),
      parseFileInfo(listingInfo.file_legal_rep_address_proof, '2_法定代表人住址证明'),
      parseFileInfo(listingInfo.file_actual_controller_id, '3_实际控制人身份证件（正反面）'),
      parseFileInfo(listingInfo.file_actual_controller_address_proof, '3_实际控制人住址证明'),
      parseFileInfo(listingInfo.file_actual_controller_proof, '3_实控人证明文件+公章'),
      parseFileInfo(listingInfo.file_beneficial_owner_id, '4_实益拥有人身份证件（正反面）'),
      parseFileInfo(listingInfo.file_beneficial_owner_address_proof, '4_实益拥有人住址证明'),
      parseFileInfo(listingInfo.file_condition_1_proof, '5_存续时间证明文件'),
      parseFileInfo(listingInfo.file_condition_2_proof, '5_营业额证明文件+公章'),
      parseFileInfo(listingInfo.file_revenue_forecast, '6_未来12个月预估营业额信息+公章'),
      parseFileInfo(listingInfo.file_directors_list, '7_董事会成员及其他主要人员名册+公章'),
      parseFileInfo(listingInfo.file_board_resolution, '7_董事会书面决议授权+公章'),
      parseFileInfo(listingInfo.file_email_authorization, '7_电邮申请说明+公章+授权人法人签名')
    ].filter(f => f !== null)
    
    return c.json({
      success: true,
      data: {
        projectCode: project.submission_code,
        files: files,
        totalCount: files.length
      }
    })
    
  } catch (error: any) {
    console.error('获取文件列表失败:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

