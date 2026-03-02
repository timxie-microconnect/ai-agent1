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
          value: level1Cat,
          label: level1Cat,
          children: level2Categories.results.map((level2: any) => ({
            value: level2.level2_category,
            label: level2.level2_category
          }))
        })
      }
      
      tree.push({
        value: mainCat,
        label: mainCat,
        children: level1Items
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
app.post('/sieve/check-admission', async (c) => {
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

export default app
