// 扩展管理员API - 评分配置管理、文件上传、尽调checklist

import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// ========== 评分配置管理 API ==========

// 获取所有评分配置（按品类分组）
app.get('/scoring-config', async (c) => {
  const { DB } = c.env
  
  const configs = await DB.prepare(`
    SELECT * FROM scoring_config 
    WHERE is_active = 1 
    ORDER BY category, display_order
  `).all()
  
  // 按品类分组
  const grouped = configs.results.reduce((acc: any, config: any) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push(config)
    return acc
  }, {})
  
  return c.json({ success: true, data: grouped })
})

// 获取指定品类的评分配置
app.get('/scoring-config/:category', async (c) => {
  const { DB } = c.env
  const category = c.req.param('category')
  
  const configs = await DB.prepare(`
    SELECT * FROM scoring_config 
    WHERE category = ? AND is_active = 1 
    ORDER BY display_order
  `).bind(category).all()
  
  return c.json({ success: true, data: configs.results })
})

// 创建新的评分配置字段
app.post('/scoring-config', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  
  const {
    category,
    field_name,
    field_label,
    field_type,
    threshold_value,
    comparison_operator,
    max_score,
    scoring_rule,
    is_required,
    display_order
  } = body
  
  const result = await DB.prepare(`
    INSERT INTO scoring_config (
      category, field_name, field_label, field_type, threshold_value,
      comparison_operator, max_score, scoring_rule, is_required, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    category, field_name, field_label, field_type, threshold_value || null,
    comparison_operator || '>=', max_score, scoring_rule || null,
    is_required || 1, display_order || 0
  ).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 更新评分配置
app.put('/scoring-config/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const body = await c.req.json()
  
  const {
    field_label,
    field_type,
    threshold_value,
    comparison_operator,
    max_score,
    scoring_rule,
    is_required,
    display_order,
    is_active
  } = body
  
  await DB.prepare(`
    UPDATE scoring_config SET
      field_label = ?,
      field_type = ?,
      threshold_value = ?,
      comparison_operator = ?,
      max_score = ?,
      scoring_rule = ?,
      is_required = ?,
      display_order = ?,
      is_active = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    field_label, field_type, threshold_value || null, comparison_operator,
    max_score, scoring_rule || null, is_required, display_order, is_active, id
  ).run()
  
  return c.json({ success: true })
})

// 删除评分配置（软删除）
app.delete('/scoring-config/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare(`
    UPDATE scoring_config SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run()
  
  return c.json({ success: true })
})

// 批量更新品类的评分配置
app.post('/scoring-config/batch-update', async (c) => {
  const { DB } = c.env
  const { category, configs } = await c.req.json()
  
  // 先删除该品类的所有配置
  await DB.prepare(`UPDATE scoring_config SET is_active = 0 WHERE category = ?`).bind(category).run()
  
  // 插入新配置
  for (const config of configs) {
    await DB.prepare(`
      INSERT INTO scoring_config (
        category, field_name, field_label, field_type, threshold_value,
        comparison_operator, max_score, scoring_rule, is_required, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      category,
      config.field_name,
      config.field_label,
      config.field_type,
      config.threshold_value || null,
      config.comparison_operator || '>=',
      config.max_score,
      config.scoring_rule || null,
      config.is_required || 1,
      config.display_order || 0
    ).run()
  }
  
  return c.json({ success: true })
})

// ========== 智能评分增强 API ==========

// 手动修改评分结果
app.post('/projects/:id/override-score', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('id')
  const { manual_total_score, override_reason, override_by } = await c.req.json()
  
  await DB.prepare(`
    UPDATE scoring_results SET
      is_manual_override = 1,
      manual_total_score = ?,
      override_reason = ?,
      override_by = ?,
      override_at = CURRENT_TIMESTAMP
    WHERE project_id = ?
  `).bind(manual_total_score, override_reason, override_by, projectId).run()
  
  return c.json({ success: true })
})

// 根据配置动态评分
app.post('/projects/:id/score-dynamic', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('id')
  
  // 获取项目信息
  const project = await DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(projectId).first()
  if (!project) {
    return c.json({ error: '项目不存在' }, 404)
  }
  
  const category = project.product_category as string
  
  // 获取该品类的评分配置
  const configs = await DB.prepare(`
    SELECT * FROM scoring_config 
    WHERE category = ? AND is_active = 1 
    ORDER BY display_order
  `).bind(category).all()
  
  if (!configs.results || configs.results.length === 0) {
    return c.json({ error: '该品类未配置评分标准' }, 400)
  }
  
  // 动态计算分数
  let totalScore = 0
  const breakdown: any = {}
  const failedItems: string[] = []
  
  for (const config of configs.results as any[]) {
    const fieldName = config.field_name
    const fieldValue = project[fieldName]
    
    if (fieldValue === null || fieldValue === undefined) {
      failedItems.push(`${config.field_label}数据缺失`)
      breakdown[fieldName] = 0
      continue
    }
    
    let score = 0
    
    // 解析评分规则
    if (config.scoring_rule) {
      const rule = JSON.parse(config.scoring_rule)
      
      if (rule.type === 'threshold') {
        // 阈值型：达标得满分，否则0分
        const passed = compareValue(fieldValue, config.comparison_operator, config.threshold_value)
        score = passed ? rule.pass_score : (rule.fail_score || 0)
        
        if (!passed) {
          failedItems.push(`${config.field_label}未达标（当前${fieldValue}，要求${config.comparison_operator}${config.threshold_value}）`)
        }
      } else if (rule.type === 'tiered') {
        // 分段型：按区间给分
        const tiers = rule.tiers.sort((a: any, b: any) => b.min - a.min)
        for (const tier of tiers) {
          if (fieldValue >= tier.min) {
            score = tier.score
            break
          }
        }
      }
    } else {
      // 简单阈值比较
      const passed = compareValue(fieldValue, config.comparison_operator, config.threshold_value)
      score = passed ? config.max_score : 0
      
      if (!passed) {
        failedItems.push(`${config.field_label}未达标（当前${fieldValue}，要求${config.comparison_operator}${config.threshold_value}）`)
      }
    }
    
    breakdown[fieldName] = score
    totalScore += score
  }
  
  const passed = totalScore >= 60
  const suggestion = passed 
    ? '该项目各项指标表现良好，达到投资标准，建议通过审批。'
    : `该项目存在以下问题：${failedItems.join('；')}。建议进一步评估或拒绝投资。`
  
  // 保存评分结果
  await DB.prepare(`
    INSERT OR REPLACE INTO scoring_results (
      project_id, roi_score, return_rate_score, profit_score, 
      shop_score_value, operation_score, total_score, passed, evaluation_suggestion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    projectId,
    breakdown.roi || 0,
    breakdown.return_rate || 0,
    breakdown.profit_rate || 0,
    breakdown.shop_score || 0,
    breakdown.operation_months || 0,
    totalScore,
    passed ? 1 : 0,
    suggestion
  ).run()
  
  // 如果不及格，自动拒绝
  if (!passed) {
    await DB.prepare(`UPDATE projects SET status = 'rejected' WHERE id = ?`).bind(projectId).run()
    
    await DB.prepare(`
      INSERT INTO workflow_history (project_id, from_status, to_status, operator_id, remark)
      VALUES (?, 'scoring', 'rejected', 1, ?)
    `).bind(projectId, `自动拒绝：评分${totalScore}分，低于60分阈值`).run()
  } else {
    await DB.prepare(`UPDATE projects SET status = 'scoring' WHERE id = ?`).bind(projectId).run()
  }
  
  return c.json({
    success: true,
    totalScore,
    passed,
    breakdown,
    suggestion,
    autoRejected: !passed
  })
})

// ========== 协议文件上传 API ==========

// 上传协议文件
app.post('/projects/:id/upload-contract', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('id')
  
  // 模拟文件上传（实际应使用R2）
  const { file_name, file_url, file_size, file_type, uploaded_by } = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO contract_files (project_id, file_name, file_url, file_size, file_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(projectId, file_name, file_url, file_size || null, file_type || 'application/pdf', uploaded_by).run()
  
  // 更新项目状态为"已上传协议"
  await DB.prepare(`UPDATE projects SET status = 'contract_uploaded' WHERE id = ?`).bind(projectId).run()
  
  await DB.prepare(`
    INSERT INTO workflow_history (project_id, from_status, to_status, operator_id, remark)
    VALUES (?, 'approved', 'contract_uploaded', ?, '上传协议文件')
  `).bind(projectId, uploaded_by).run()
  
  return c.json({ success: true, fileId: result.meta.last_row_id })
})

// 获取协议文件列表
app.get('/projects/:id/contracts', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('id')
  
  const files = await DB.prepare(`
    SELECT cf.*, u.username as uploaded_by_name
    FROM contract_files cf
    LEFT JOIN users u ON cf.uploaded_by = u.id
    WHERE cf.project_id = ?
    ORDER BY cf.uploaded_at DESC
  `).bind(projectId).all()
  
  return c.json({ success: true, files: files.results })
})

// ========== 尽调Checklist API ==========

// 创建尽调checklist
app.post('/projects/:id/create-checklist', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('id')
  
  // 创建3个标准部分
  const sections = [
    { name: 'credit', label: '主体信用/资质核验' },
    { name: 'traffic_data', label: '投流历史数据核验' },
    { name: 'other', label: '其他核验文件' }
  ]
  
  for (const section of sections) {
    await DB.prepare(`
      INSERT INTO due_diligence_checklist (project_id, section_name, section_label)
      VALUES (?, ?, ?)
    `).bind(projectId, section.name, section.label).run()
  }
  
  return c.json({ success: true })
})

// 获取尽调checklist
app.get('/projects/:id/checklist', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('id')
  
  const checklist = await DB.prepare(`
    SELECT * FROM due_diligence_checklist WHERE project_id = ? ORDER BY id
  `).bind(projectId).all()
  
  // 获取每个部分的文件
  for (const item of checklist.results as any[]) {
    const files = await DB.prepare(`
      SELECT * FROM due_diligence_files 
      WHERE checklist_id = ? 
      ORDER BY uploaded_at DESC
    `).bind(item.id).all()
    
    item.files = files.results
  }
  
  return c.json({ success: true, checklist: checklist.results })
})

// 上传尽调文件
app.post('/projects/:id/upload-dd-file', async (c) => {
  const { DB } = c.env
  const projectId = c.req.param('id')
  
  const {
    checklist_id,
    file_category,
    file_name,
    file_url,
    file_size,
    file_type,
    uploaded_by
  } = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO due_diligence_files (
      project_id, checklist_id, file_category, file_name, file_url, 
      file_size, file_type, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    projectId, checklist_id || null, file_category, file_name, file_url,
    file_size || null, file_type || 'application/pdf', uploaded_by
  ).run()
  
  return c.json({ success: true, fileId: result.meta.last_row_id })
})

// 完成某个checklist部分
app.post('/checklist/:id/complete', async (c) => {
  const { DB } = c.env
  const checklistId = c.req.param('id')
  const { notes, completed_by } = await c.req.json()
  
  await DB.prepare(`
    UPDATE due_diligence_checklist SET
      notes = ?,
      completed_by = ?,
      completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(notes || null, completed_by, checklistId).run()
  
  return c.json({ success: true })
})

// ========== 工具函数 ==========

function compareValue(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case '>=': return value >= threshold
    case '>': return value > threshold
    case '<=': return value <= threshold
    case '<': return value < threshold
    case '=': case '==': return value === threshold
    default: return false
  }
}

export default app
