// 筛子评分系统 - 类目查询与兜底规则API
// src/api-sieve.ts

import { Hono } from 'hono'
import type { Context } from 'hono'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

// ==========================================
// 内联评分算法（60-100分制，达到阈值=60分）
// ==========================================
function calculateUplift(actual: number, threshold: number, type: 'ratio' | 'settle_rate' | 'spend'): number {
  if (type === 'ratio') {
    return Math.max(0, actual / threshold - 1)
  } else if (type === 'settle_rate') {
    return Math.max(0, (actual - threshold) / (1 - threshold))
  } else {
    if (actual <= threshold) return 0
    return Math.log10(actual / threshold)
  }
}

function calculateSubScore(uplift: number, k: number): number {
  const baseScore = 60
  const extraScore = 40 * (1 - Math.exp(-k * uplift))
  return baseScore + extraScore
}

interface ScoringRule {
  weight_net_roi: number
  weight_settle_roi: number
  weight_settle_rate: number
  weight_history_spend: number
  weight_volatility: number
  k_net_roi: number
  k_settle_roi: number
  k_settle_rate: number
  k_history_spend: number
  k_volatility: number
}

const DEFAULT_SCORING_RULE: ScoringRule = {
  weight_net_roi: 15,
  weight_settle_roi: 25,
  weight_settle_rate: 25,
  weight_history_spend: 15,
  weight_volatility: 20,
  k_net_roi: 3,
  k_settle_roi: 4,
  k_settle_rate: 4,
  k_history_spend: 1.5,
  k_volatility: 2.0
}

function calculateSieveScore(
  actual: {net_roi: number, settle_roi: number, settle_rate: number, history_spend: number, volatility: number},
  thresholds: {net_roi_min: number, settle_roi_min: number, settle_rate_min: number, history_spend_min: number, volatility_max: number},
  rule: ScoringRule
) {
  const u_net = calculateUplift(actual.net_roi, thresholds.net_roi_min, 'ratio')
  const u_settle = calculateUplift(actual.settle_roi, thresholds.settle_roi_min, 'ratio')
  const u_sr = calculateUplift(actual.settle_rate, thresholds.settle_rate_min, 'settle_rate')
  const u_spend = calculateUplift(actual.history_spend, thresholds.history_spend_min, 'spend')
  // 波动率：越低越好，所以uplift = max(0, (threshold - actual) / threshold)
  const u_volatility = Math.max(0, (thresholds.volatility_max - actual.volatility) / thresholds.volatility_max)
  
  const s_net = calculateSubScore(u_net, rule.k_net_roi)
  const s_settle = calculateSubScore(u_settle, rule.k_settle_roi)
  const s_sr = calculateSubScore(u_sr, rule.k_settle_rate)
  const s_spend = calculateSubScore(u_spend, rule.k_history_spend)
  const s_volatility = calculateSubScore(u_volatility, rule.k_volatility)
  
  const totalScore = 
    (rule.weight_net_roi / 100) * s_net +
    (rule.weight_settle_roi / 100) * s_settle +
    (rule.weight_settle_rate / 100) * s_sr +
    (rule.weight_history_spend / 100) * s_spend +
    (rule.weight_volatility / 100) * s_volatility
  
  return {
    total_score: Math.round(totalScore * 10) / 10,
    net_roi_score: Math.round(s_net * 10) / 10,
    net_roi_uplift: Math.round(u_net * 1000) / 1000,
    settle_roi_score: Math.round(s_settle * 10) / 10,
    settle_roi_uplift: Math.round(u_settle * 1000) / 1000,
    settle_rate_score: Math.round(s_sr * 10) / 10,
    settle_rate_uplift: Math.round(u_sr * 1000) / 1000,
    history_spend_score: Math.round(s_spend * 10) / 10,
    history_spend_uplift: Math.round(u_spend * 1000) / 1000,
    volatility_score: Math.round(s_volatility * 10) / 10,
    volatility_uplift: Math.round(u_volatility * 1000) / 1000
  }
}

// ==========================================
// 1. 获取类目树结构（三级联动）
// ==========================================
app.get('/categories/tree', async (c) => {
  try {
    const db = c.env.DB
    
    // 获取所有主营类目
    const mainCategories = await db.prepare(`
      SELECT DISTINCT main_category 
      FROM category_thresholds 
      WHERE is_active = 1 AND version = 1
      ORDER BY main_category
    `).all()
    
    const tree: any[] = []
    
    for (const main of mainCategories.results) {
      const mainCat = main.main_category as string
      
      // 获取该主营类目下的一级类目
      const level1Categories = await db.prepare(`
        SELECT DISTINCT level1_category
        FROM category_thresholds
        WHERE main_category = ? AND is_active = 1 AND version = 1
        ORDER BY level1_category
      `).bind(mainCat).all()
      
      const level1Items: any[] = []
      
      for (const level1 of level1Categories.results) {
        const level1Cat = level1.level1_category as string
        
        // 获取该一级类目下的二级类目
        const level2Categories = await db.prepare(`
          SELECT DISTINCT level2_category
          FROM category_thresholds
          WHERE main_category = ? AND level1_category = ? AND is_active = 1 AND version = 1
          ORDER BY level2_category
        `).bind(mainCat, level1Cat).all()
        
        level1Items.push({
          level1_category: level1Cat,
          level2_count: level2Categories.results.length,
          level2_categories: level2Categories.results.map((level2: any) => level2.level2_category)
        })
      }
      
      tree.push({
        main_category: mainCat,
        level1_count: level1Items.length,
        level1_categories: level1Items
      })
    }
    
    return c.json({ success: true, data: tree })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 2. 搜索类目（支持模糊搜索）
// ==========================================
app.get('/categories/search', async (c) => {
  try {
    const keyword = c.req.query('q')
    if (!keyword) {
      return c.json({ success: false, error: '搜索关键词不能为空' }, 400)
    }
    
    const db = c.env.DB
    const searchPattern = `%${keyword}%`
    
    // 搜索匹配的类目（主营、一级、二级）
    const results = await db.prepare(`
      SELECT DISTINCT 
        main_category, 
        level1_category, 
        level2_category
      FROM category_thresholds
      WHERE (
        main_category LIKE ? OR 
        level1_category LIKE ? OR 
        level2_category LIKE ?
      )
      AND is_active = 1 AND version = 1
      ORDER BY main_category, level1_category, level2_category
      LIMIT 50
    `).bind(searchPattern, searchPattern, searchPattern).all()
    
    return c.json({ 
      success: true, 
      data: results.results.map((row: any) => ({
        main: row.main_category,
        level1: row.level1_category,
        level2: row.level2_category,
        path: `${row.main_category} > ${row.level1_category} > ${row.level2_category}`
      }))
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 3. 获取阈值（精确匹配或兜底）
// ==========================================
app.post('/categories/get-thresholds', async (c) => {
  try {
    const { main_category, level1_category, level2_category } = await c.req.json()
    
    if (!main_category) {
      return c.json({ success: false, error: '主营类目不能为空' }, 400)
    }
    
    const db = c.env.DB
    let thresholds: any = null
    let thresholdLevel = ''
    
    // 场景1：选择了完整的三级类目
    if (level2_category && level1_category) {
      const result = await db.prepare(`
        SELECT * FROM category_thresholds
        WHERE main_category = ? 
          AND level1_category = ? 
          AND level2_category = ?
          AND is_active = 1 AND version = 1
        LIMIT 1
      `).bind(main_category, level1_category, level2_category).first()
      
      if (result) {
        thresholds = result
        thresholdLevel = 'level2'
      }
    }
    
    // 场景2：只选了一级类目，需要兜底（取该一级下最严格阈值）
    if (!thresholds && level1_category) {
      const result = await db.prepare(`
        SELECT 
          MAX(net_roi_min) as net_roi_min,
          MAX(settle_roi_min) as settle_roi_min,
          MAX(settle_rate_min) as settle_rate_min,
          100000 as history_spend_min
        FROM category_thresholds
        WHERE main_category = ? 
          AND level1_category = ?
          AND is_active = 1 AND version = 1
      `).bind(main_category, level1_category).first()
      
      if (result) {
        thresholds = result
        thresholdLevel = 'level1_fallback'
      }
    }
    
    // 场景3：只选了主营类目，需要兜底（取该主营下最严格阈值）
    if (!thresholds) {
      const result = await db.prepare(`
        SELECT 
          MAX(net_roi_min) as net_roi_min,
          MAX(settle_roi_min) as settle_roi_min,
          MAX(settle_rate_min) as settle_rate_min,
          100000 as history_spend_min
        FROM category_thresholds
        WHERE main_category = ?
          AND is_active = 1 AND version = 1
      `).bind(main_category).first()
      
      if (result) {
        thresholds = result
        thresholdLevel = 'main_fallback'
      }
    }
    
    if (!thresholds) {
      return c.json({ success: false, error: '未找到对应的阈值配置' }, 404)
    }
    
    return c.json({ 
      success: true, 
      data: {
        net_roi_min: thresholds.net_roi_min,
        settle_roi_min: thresholds.settle_roi_min,
        settle_rate_min: thresholds.settle_rate_min,
        history_spend_min: thresholds.history_spend_min || 100000,
        threshold_level: thresholdLevel
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 4. 准入检查（四项指标）
// ==========================================
app.post('/check-admission', async (c) => {
  try {
    const data = await c.req.json()
    const { 
      main_category, level1_category, level2_category,
      net_roi, settle_roi, settle_rate, history_spend 
    } = data
    
    // 获取阈值
    const thresholdsRes = await app.fetch(
      new Request(new URL('/categories/get-thresholds', c.req.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ main_category, level1_category, level2_category })
      }),
      c.env
    )
    const thresholdsData = await thresholdsRes.json() as any
    
    if (!thresholdsData.success) {
      return c.json({ success: false, error: '无法获取阈值配置' }, 400)
    }
    
    const thresholds = thresholdsData.data
    
    // 检查四项指标
    const checks = {
      net_roi: net_roi >= thresholds.net_roi_min,
      settle_roi: settle_roi >= thresholds.settle_roi_min,
      settle_rate: settle_rate >= thresholds.settle_rate_min,
      history_spend: history_spend >= thresholds.history_spend_min
    }
    
    const isAdmitted = Object.values(checks).every(v => v)
    
    // 生成未通过原因
    const reasons = []
    if (!checks.net_roi) {
      const diff = (thresholds.net_roi_min - net_roi).toFixed(2)
      reasons.push(`净成交ROI不足（实际${net_roi}，要求≥${thresholds.net_roi_min}，差${diff}）`)
    }
    if (!checks.settle_roi) {
      const diff = (thresholds.settle_roi_min - settle_roi).toFixed(2)
      reasons.push(`14日结算ROI不足（实际${settle_roi}，要求≥${thresholds.settle_roi_min}，差${diff}）`)
    }
    if (!checks.settle_rate) {
      const diff = ((thresholds.settle_rate_min - settle_rate) * 100).toFixed(1)
      reasons.push(`14日订单结算率不足（实际${(settle_rate*100).toFixed(1)}%，要求≥${(thresholds.settle_rate_min*100).toFixed(1)}%，差${diff}%）`)
    }
    if (!checks.history_spend) {
      const diff = thresholds.history_spend_min - history_spend
      reasons.push(`历史消耗额不足（实际${history_spend}元，要求≥${thresholds.history_spend_min}元，差${diff}元）`)
    }
    
    return c.json({ 
      success: true, 
      data: {
        is_admitted: isAdmitted,
        checks,
        reasons,
        thresholds,
        threshold_level: thresholds.threshold_level
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 5. 筛子评分计算（针对已准入的项目）
// ==========================================
app.post('/scoring/calculate/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId')
    const db = c.env.DB
    
    // 获取项目信息
    const project = await db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first()
    
    if (!project) {
      return c.json({ success: false, error: '项目不存在' }, 404)
    }
    
    // 检查是否通过准入
    if (project.admission_result !== '可评分') {
      return c.json({ 
        success: false, 
        error: '项目未通过准入审核，无法评分'
      }, 400)
    }
    
    // 获取阈值
    const thresholdsResult = await db.prepare(`
      SELECT * FROM category_thresholds
      WHERE main_category = ? 
        AND level1_category = ? 
        AND level2_category = ?
        AND is_active = 1 AND version = 1
      LIMIT 1
    `).bind(
      project.main_category,
      project.level1_category || project.main_category,
      project.level2_category || project.level1_category || project.main_category
    ).first()
    
    if (!thresholdsResult) {
      return c.json({ success: false, error: '未找到对应阈值' }, 404)
    }
    
    // 获取系统配置的评分规则（权重和k值）
    const configResult = await db.prepare(`
      SELECT * FROM sieve_system_config LIMIT 1
    `).first()
    
    let scoringRule = DEFAULT_SCORING_RULE
    
    if (configResult && configResult.config_data) {
      try {
        const configData = JSON.parse(configResult.config_data as string)
        
        // 处理权重配置
        if (configResult.config_type === 'weights') {
          scoringRule = {
            weight_net_roi: (configData.net_roi || 0.15) * 100,
            weight_settle_roi: (configData.settle_roi || 0.25) * 100,
            weight_settle_rate: (configData.settle_rate || 0.25) * 100,
            weight_history_spend: (configData.history_spend || 0.15) * 100,
            weight_volatility: (configData.volatility || 0.20) * 100,
            k_net_roi: DEFAULT_SCORING_RULE.k_net_roi,
            k_settle_roi: DEFAULT_SCORING_RULE.k_settle_roi,
            k_settle_rate: DEFAULT_SCORING_RULE.k_settle_rate,
            k_history_spend: DEFAULT_SCORING_RULE.k_history_spend,
            k_volatility: DEFAULT_SCORING_RULE.k_volatility
          }
        }
      } catch (e) {
        console.error('解析配置数据失败:', e)
      }
    }
    
    // 计算评分 - 使用标准的scoring-sieve模块
    console.log('===== 评分计算输入 =====')
    console.log('项目数据:', {
      net_roi: project.net_roi,
      settle_roi: project.settle_roi,
      settle_rate: project.settle_rate,
      history_spend: project.history_spend,
      volatility: project.daily_revenue_volatility
    })
    console.log('阈值数据:', {
      net_roi_min: thresholdsResult.net_roi_min,
      settle_roi_min: thresholdsResult.settle_roi_min,
      settle_rate_min: thresholdsResult.settle_rate_min,
      history_spend_min: thresholdsResult.history_spend_min,
      volatility_max: thresholdsResult.volatility_max
    })
    console.log('评分规则:', scoringRule)
    
    const scoringResult = calculateSieveScore(
      {
        net_roi: project.net_roi as number,
        settle_roi: project.settle_roi as number,
        settle_rate: project.settle_rate as number,
        history_spend: project.history_spend as number,
        volatility: (project.daily_revenue_volatility as number) || 0
      },
      {
        net_roi_min: thresholdsResult.net_roi_min as number,
        settle_roi_min: thresholdsResult.settle_roi_min as number,
        settle_rate_min: thresholdsResult.settle_rate_min as number,
        history_spend_min: (thresholdsResult.history_spend_min as number) || 100000,
        volatility_max: (thresholdsResult.volatility_max as number) || 0.15
      },
      scoringRule
    )
    
    console.log('===== 评分计算输出 =====')
    console.log('scoringResult:', JSON.stringify(scoringResult, null, 2))
    
    // 构建详细结果
    const detailsArray = [
      {
        field_name: '净成交ROI',
        actual_value: project.net_roi,
        threshold_value: thresholdsResult.net_roi_min,
        actual_display: `${((project.net_roi as number) * 100).toFixed(2)}%`,
        threshold_display: `≥${((thresholdsResult.net_roi_min as number) * 100).toFixed(2)}%`,
        uplift: scoringResult.net_roi_uplift,
        base_score: scoringResult.net_roi_score,
        weight: scoringRule.weight_net_roi / 100,
        sub_score: (scoringRule.weight_net_roi / 100) * scoringResult.net_roi_score
      },
      {
        field_name: '14日结算ROI',
        actual_value: project.settle_roi,
        threshold_value: thresholdsResult.settle_roi_min,
        actual_display: `${((project.settle_roi as number) * 100).toFixed(2)}%`,
        threshold_display: `≥${((thresholdsResult.settle_roi_min as number) * 100).toFixed(2)}%`,
        uplift: scoringResult.settle_roi_uplift,
        base_score: scoringResult.settle_roi_score,
        weight: scoringRule.weight_settle_roi / 100,
        sub_score: (scoringRule.weight_settle_roi / 100) * scoringResult.settle_roi_score
      },
      {
        field_name: '14日订单结算率',
        actual_value: project.settle_rate,
        threshold_value: thresholdsResult.settle_rate_min,
        actual_display: `${((project.settle_rate as number) * 100).toFixed(2)}%`,
        threshold_display: `≥${((thresholdsResult.settle_rate_min as number) * 100).toFixed(2)}%`,
        uplift: scoringResult.settle_rate_uplift,
        base_score: scoringResult.settle_rate_score,
        weight: scoringRule.weight_settle_rate / 100,
        sub_score: (scoringRule.weight_settle_rate / 100) * scoringResult.settle_rate_score
      },
      {
        field_name: '历史消耗金额',
        actual_value: project.history_spend,
        threshold_value: thresholdsResult.history_spend_min || 100000,
        actual_display: `¥${(project.history_spend as number).toLocaleString()}`,
        threshold_display: `≥¥${((thresholdsResult.history_spend_min as number || 100000)).toLocaleString()}`,
        uplift: scoringResult.history_spend_uplift,
        base_score: scoringResult.history_spend_score,
        weight: scoringRule.weight_history_spend / 100,
        sub_score: (scoringRule.weight_history_spend / 100) * scoringResult.history_spend_score
      },
      {
        field_name: '90天净成交波动率',
        actual_value: project.daily_revenue_volatility,
        threshold_value: thresholdsResult.volatility_max || 0.15,
        actual_display: `${((project.daily_revenue_volatility as number || 0) * 100).toFixed(2)}%`,
        threshold_display: `≤${((thresholdsResult.volatility_max as number || 0.15) * 100).toFixed(2)}%`,
        uplift: scoringResult.volatility_uplift,
        base_score: scoringResult.volatility_score,
        weight: scoringRule.weight_volatility / 100,
        sub_score: (scoringRule.weight_volatility / 100) * scoringResult.volatility_score
      }
    ]
    
    const resultData = {
      total_score: scoringResult.total_score,
      passed: scoringResult.total_score >= 60,
      threshold_level: '二级类目',
      details: detailsArray
    }
    
    // 保存评分结果到数据库
    await db.prepare(`
      UPDATE projects 
      SET sieve_score = ?, 
          sieve_score_details = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      resultData.total_score,
      JSON.stringify(resultData),
      projectId
    ).run()
    
    return c.json({ success: true, data: resultData })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// 6. 筛子系统配置管理
// ==========================================

// 获取筛子配置
app.get('/config', async (c) => {
  try {
    const db = c.env.DB
    
    const weights = await db.prepare(`
      SELECT config_data FROM sieve_system_config 
      WHERE config_type = 'weights' 
      ORDER BY id DESC LIMIT 1
    `).first()
    
    const kValues = await db.prepare(`
      SELECT config_data FROM sieve_system_config 
      WHERE config_type = 'k_values' 
      ORDER BY id DESC LIMIT 1
    `).first()
    
    return c.json({
      success: true,
      data: {
        weights: weights ? JSON.parse(weights.config_data as string) : {
          net_roi: 0.20,
          settle_roi: 0.35,
          settle_rate: 0.30,
          history_spend: 0.15
        },
        k_values: kValues ? JSON.parse(kValues.config_data as string) : {
          net_roi: 3.0,
          settle_roi: 4.0,
          settle_rate: 4.0,
          history_spend: 1.5
        }
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 保存筛子配置
app.post('/config', async (c) => {
  try {
    const db = c.env.DB
    const { weights, k_values } = await c.req.json()
    
    // 验证权重总和
    const total = Object.values(weights).reduce((sum: number, w: any) => sum + Number(w), 0)
    if (Math.abs(total - 1.0) > 0.01) {
      return c.json({ success: false, error: '权重总和必须等于100%' }, 400)
    }
    
    // 保存权重配置
    await db.prepare(`
      INSERT INTO sieve_system_config (config_type, config_data)
      VALUES ('weights', ?)
    `).bind(JSON.stringify(weights)).run()
    
    // 保存k值配置
    await db.prepare(`
      INSERT INTO sieve_system_config (config_type, config_data)
      VALUES ('k_values', ?)
    `).bind(JSON.stringify(k_values)).run()
    
    return c.json({ success: true, message: '配置保存成功' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 更新阈值
app.put('/thresholds', async (c) => {
  try {
    const db = c.env.DB
    const { main_category, level1_category, level2_category, net_roi_min, settle_roi_min, settle_rate_min, history_spend_min } = await c.req.json()
    
    if (!main_category || !level1_category || !level2_category) {
      return c.json({ success: false, error: '类目信息不完整' }, 400)
    }
    
    // 更新阈值
    const result = await db.prepare(`
      UPDATE category_thresholds 
      SET net_roi_min = ?, settle_roi_min = ?, settle_rate_min = ?, history_spend_min = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE main_category = ? AND level1_category = ? AND level2_category = ?
        AND is_active = 1 AND version = 1
    `).bind(
      net_roi_min, settle_roi_min, settle_rate_min, history_spend_min,
      main_category, level1_category, level2_category
    ).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: '未找到对应的阈值记录' }, 404)
    }
    
    return c.json({ success: true, message: '阈值更新成功' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app
