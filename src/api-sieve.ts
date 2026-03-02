// 筛子评分系统 - 类目查询与兜底规则API
// src/api-sieve.ts

import { Hono } from 'hono'
import type { Context } from 'hono'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

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
    
    // 计算评分
    const scoring = calculateSieveScore(
      {
        net_roi: project.net_roi,
        settle_roi: project.settle_roi,
        settle_rate: project.settle_rate,
        history_spend: project.history_spend
      },
      {
        net_roi_min: thresholdsResult.net_roi_min,
        settle_roi_min: thresholdsResult.settle_roi_min,
        settle_rate_min: thresholdsResult.settle_rate_min,
        history_spend_min: thresholdsResult.history_spend_min || 100000
      }
    )
    
    // 保存评分结果到数据库
    await db.prepare(`
      UPDATE projects 
      SET sieve_score = ?, 
          sieve_score_details = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      scoring.total_score,
      JSON.stringify(scoring),
      projectId
    ).run()
    
    return c.json({ success: true, data: scoring })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 评分计算函数
function calculateSieveScore(actual: any, thresholds: any) {
  const weights = {
    net_roi: 0.20,
    settle_roi: 0.35,
    settle_rate: 0.30,
    history_spend: 0.15
  }
  
  const kValues = {
    net_roi: 3.0,
    settle_roi: 4.0,
    settle_rate: 4.0,
    history_spend: 1.5
  }
  
  // 计算单项分数
  const calculateSubScore = (actualValue: number, threshold: number, k: number, isRate: boolean = false) => {
    let uplift = 0
    
    if (isRate) {
      // 结算率特殊处理：标准化到0-1空间
      uplift = Math.max(0, (actualValue - threshold) / (1 - threshold))
    } else {
      uplift = Math.max(0, actualValue / threshold - 1)
    }
    
    const baseScore = 100 * (1 - Math.exp(-k * uplift))
    return { baseScore, uplift }
  }
  
  // 净成交ROI
  const netRoiResult = calculateSubScore(actual.net_roi, thresholds.net_roi_min, kValues.net_roi)
  const netRoiScore = weights.net_roi * netRoiResult.baseScore
  
  // 14日结算ROI
  const settleRoiResult = calculateSubScore(actual.settle_roi, thresholds.settle_roi_min, kValues.settle_roi)
  const settleRoiScore = weights.settle_roi * settleRoiResult.baseScore
  
  // 14日订单结算率
  const settleRateResult = calculateSubScore(actual.settle_rate, thresholds.settle_rate_min, kValues.settle_rate, true)
  const settleRateScore = weights.settle_rate * settleRateResult.baseScore
  
  // 历史消耗（对数标准化）
  const spendUplift = Math.max(0, Math.log10(actual.history_spend / thresholds.history_spend_min))
  const spendBaseScore = 100 * (1 - Math.exp(-kValues.history_spend * spendUplift))
  const spendScore = weights.history_spend * spendBaseScore
  
  const totalScore = netRoiScore + settleRoiScore + settleRateScore + spendScore
  
  return {
    total_score: Math.round(totalScore * 10) / 10,  // 保留1位小数
    passed: totalScore >= 60,
    threshold_level: '二级类目',
    details: [
      {
        field_name: '净成交ROI',
        actual_value: actual.net_roi,
        threshold_value: thresholds.net_roi_min,
        actual_display: `${(actual.net_roi * 100).toFixed(2)}%`,
        threshold_display: `≥${(thresholds.net_roi_min * 100).toFixed(2)}%`,
        uplift: netRoiResult.uplift,
        base_score: netRoiResult.baseScore,
        weight: weights.net_roi,
        sub_score: netRoiScore
      },
      {
        field_name: '14日结算ROI',
        actual_value: actual.settle_roi,
        threshold_value: thresholds.settle_roi_min,
        actual_display: `${(actual.settle_roi * 100).toFixed(2)}%`,
        threshold_display: `≥${(thresholds.settle_roi_min * 100).toFixed(2)}%`,
        uplift: settleRoiResult.uplift,
        base_score: settleRoiResult.baseScore,
        weight: weights.settle_roi,
        sub_score: settleRoiScore
      },
      {
        field_name: '14日订单结算率',
        actual_value: actual.settle_rate,
        threshold_value: thresholds.settle_rate_min,
        actual_display: `${(actual.settle_rate * 100).toFixed(2)}%`,
        threshold_display: `≥${(thresholds.settle_rate_min * 100).toFixed(2)}%`,
        uplift: settleRateResult.uplift,
        base_score: settleRateResult.baseScore,
        weight: weights.settle_rate,
        sub_score: settleRateScore
      },
      {
        field_name: '历史消耗金额',
        actual_value: actual.history_spend,
        threshold_value: thresholds.history_spend_min,
        actual_display: `¥${actual.history_spend.toLocaleString()}`,
        threshold_display: `≥¥${thresholds.history_spend_min.toLocaleString()}`,
        uplift: spendUplift,
        base_score: spendBaseScore,
        weight: weights.history_spend,
        sub_score: spendScore
      }
    ]
  }
}

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
