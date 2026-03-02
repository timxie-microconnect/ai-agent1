import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { calculateScore } from './scoring';
import { generateSubmissionCode, formatDateTime, getStatusText, getStatusColor, createSimpleToken, verifySimpleToken } from './utils';
import adminExtendedApi from './api-admin-extended';
import sieveApi from './api-sieve';

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// Middleware: Auth check for user routes
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未授权' }, 401);
  }
  
  const token = authHeader.substring(7);
  const user = verifySimpleToken(token);
  
  if (!user) {
    return c.json({ error: '令牌无效或已过期' }, 401);
  }
  
  c.set('user', user);
  await next();
};

// Middleware: Admin auth check
const adminAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未授权' }, 401);
  }
  
  const token = authHeader.substring(7);
  const user = verifySimpleToken(token);
  
  if (!user) {
    return c.json({ error: '令牌无效或已过期' }, 401);
  }
  
  // Check if user is admin
  const { DB } = c.env;
  const result = await DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(user.userId).first();
  
  if (!result || !result.is_admin) {
    return c.json({ error: '需要管理员权限' }, 403);
  }
  
  c.set('user', user);
  await next();
};

// ==================== 用户认证 API ====================

// 用户注册
app.post('/api/register', async (c) => {
  const { DB } = c.env;
  const body = await c.req.json();
  
  const { username, password, companyName, contactName, contactPhone, contactEmail } = body;
  
  // 验证必填字段
  if (!username || !password || !companyName || !contactName || !contactPhone || !contactEmail) {
    return c.json({ error: '所有字段都是必填的' }, 400);
  }
  
  // 检查用户名是否已存在
  const existing = await DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (existing) {
    return c.json({ error: '用户名已存在' }, 400);
  }
  
  // 插入新用户
  const result = await DB.prepare(
    'INSERT INTO users (username, password, company_name, contact_name, contact_phone, contact_email) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(username, password, companyName, contactName, contactPhone, contactEmail).run();
  
  const userId = result.meta.last_row_id;
  const token = createSimpleToken(userId, username);
  
  return c.json({ 
    success: true, 
    token,
    user: { 
      id: userId, 
      username, 
      companyName, 
      contactName 
    } 
  });
});

// 用户登录
app.post('/api/login', async (c) => {
  const { DB } = c.env;
  const body = await c.req.json();
  
  const { username, password } = body;
  
  if (!username || !password) {
    return c.json({ error: '用户名和密码不能为空' }, 400);
  }
  
  const user = await DB.prepare(
    'SELECT id, username, company_name, contact_name, is_admin FROM users WHERE username = ? AND password = ?'
  ).bind(username, password).first();
  
  if (!user) {
    return c.json({ error: '用户名或密码错误' }, 401);
  }
  
  const token = createSimpleToken(user.id as number, user.username as string);
  
  return c.json({ 
    success: true, 
    token,
    user: { 
      id: user.id, 
      username: user.username, 
      companyName: user.company_name, 
      contactName: user.contact_name,
      isAdmin: user.is_admin
    } 
  });
});

// 管理员登录
app.post('/api/admin/login', async (c) => {
  const { DB } = c.env;
  const body = await c.req.json();
  
  const { username, password } = body;
  
  if (!username || !password) {
    return c.json({ error: '用户名和密码不能为空' }, 400);
  }
  
  const user = await DB.prepare(
    'SELECT id, username, company_name, contact_name FROM users WHERE username = ? AND password = ? AND is_admin = 1'
  ).bind(username, password).first();
  
  if (!user) {
    return c.json({ error: '用户名或密码错误，或您不是管理员' }, 401);
  }
  
  const token = createSimpleToken(user.id as number, user.username as string);
  
  return c.json({ 
    success: true, 
    token,
    user: { 
      id: user.id, 
      username: user.username, 
      companyName: user.company_name, 
      contactName: user.contact_name,
      isAdmin: true
    } 
  });
});

// ==================== 项目管理 API ====================

// 提交项目（10步表单）
app.post('/api/projects', authMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const body = await c.req.json();
  
  const submissionCode = generateSubmissionCode();
  
  try {
    // 插入项目主表
    const projectResult = await DB.prepare(`
      INSERT INTO projects (
        user_id, submission_code, status,
        is_same_entity, has_income_sharing, relationship_type, fund_usage,
        company_name_a, credit_code_a, address_a, established_date_a, industry_a, 
        introduction_a, business_scope_a, business_description_a,
        product_category, roi, return_rate, profit_rate, shop_score, operation_months,
        company_name_b, credit_code_b, address_b, introduction_b, shop_model_b,
        contact_name, contact_phone, contact_email, wechat, remark,
        bank_name, bank_account, bank_address, invoice_type, tax_id, invoice_address, invoice_phone,
        total_amount, batch_count, batch_amount, first_amount, subsequent_amount,
        roi_target, roi_recovery_days, roi_maintain_days, profit_share, annual_rate,
        repayment_frequency, repayment_rules
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.userId, submissionCode, 'pending',
      body.step1?.isSameEntity || null, body.step1?.hasIncomeSharing || null, body.step1?.relationshipType || null, body.step1?.fundUsage || null,
      body.step2?.companyName || null, body.step2?.creditCode || null, body.step2?.address || null, body.step2?.establishedDate || null, body.step2?.industry || null,
      body.step2?.introduction || null, body.step2?.businessScope || null, body.step2?.businessDescription || null,
      body.step2?.productCategory || null, body.step2?.roi || null, body.step2?.returnRate || null, body.step2?.profitRate || null, body.step2?.shopScore || null, body.step2?.operationMonths || null,
      body.step3?.companyName || null, body.step3?.creditCode || null, body.step3?.address || null, body.step3?.introduction || null, body.step3?.shopModel || null,
      body.step6?.contactName || null, body.step6?.contactPhone || null, body.step6?.contactEmail || null, body.step6?.wechat || null, body.step6?.remark || null,
      body.step7?.bankName || null, body.step7?.bankAccount || null, body.step7?.bankAddress || null, body.step7?.invoiceType || null, body.step7?.taxId || null, body.step7?.invoiceAddress || null, body.step7?.invoicePhone || null,
      body.step9?.totalAmount || null, body.step9?.batchCount || null, body.step9?.batchAmount || null, body.step9?.firstAmount || null, body.step9?.subsequentAmount || null,
      body.step9?.roiTarget || null, body.step9?.roiRecoveryDays || null, body.step9?.roiMaintainDays || null, body.step9?.profitShare || null, body.step9?.annualRate || null,
      body.step9?.repaymentFrequency || null, body.step9?.repaymentRules || null
    ).run();
    
    const projectId = projectResult.meta.last_row_id;
    
    // 插入法定代表人
    if (body.step4 && Array.isArray(body.step4)) {
      for (const rep of body.step4) {
        await DB.prepare(`
          INSERT INTO legal_representatives (project_id, entity_type, name, id_type, id_number, address, email, phone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(projectId, rep.entityType || null, rep.name || null, rep.idType || null, rep.idNumber || null, rep.address || null, rep.email || null, rep.phone || null).run();
      }
    }
    
    // 插入实控人
    if (body.step5 && Array.isArray(body.step5)) {
      for (const controller of body.step5) {
        await DB.prepare(`
          INSERT INTO actual_controllers (project_id, name, id_type, id_number, address, email, phone, shareholding)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(projectId, controller.name || null, controller.idType || null, controller.idNumber || null, controller.address || null, controller.email || null, controller.phone || null, controller.shareholding || null).run();
      }
    }
    
    // 插入平台账号
    if (body.step8 && Array.isArray(body.step8)) {
      for (const account of body.step8) {
        await DB.prepare(`
          INSERT INTO platform_accounts (project_id, platform_name, account_description, has_qianchuan, remark)
          VALUES (?, ?, ?, ?, ?)
        `).bind(projectId, account.platformName || null, account.accountDescription || null, account.hasQianchuan || null, account.remark || null).run();
      }
    }
    
    return c.json({ 
      success: true, 
      projectId, 
      submissionCode 
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return c.json({ error: '创建项目失败：' + error.message }, 500);
  }
});

// 获取用户的项目列表
app.get('/api/projects', authMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  
  const { results } = await DB.prepare(`
    SELECT id, submission_code, status, company_name_a as project_name, created_at
    FROM projects 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).bind(user.userId).all();
  
  return c.json({ 
    success: true, 
    projects: results.map((p: any) => ({
      id: p.id,
      submissionCode: p.submission_code,
      status: p.status,
      statusText: getStatusText(p.status),
      statusColor: getStatusColor(p.status),
      projectName: p.project_name,
      createdAt: formatDateTime(p.created_at)
    }))
  });
});

// 获取项目详情
app.get('/api/projects/:id', authMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const projectId = c.req.param('id');
  
  // 获取项目基本信息
  const project = await DB.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').bind(projectId, user.userId).first();
  
  if (!project) {
    return c.json({ error: '项目不存在' }, 404);
  }
  
  // 获取法定代表人
  const { results: legalReps } = await DB.prepare('SELECT * FROM legal_representatives WHERE project_id = ?').bind(projectId).all();
  
  // 获取实控人
  const { results: controllers } = await DB.prepare('SELECT * FROM actual_controllers WHERE project_id = ?').bind(projectId).all();
  
  // 获取平台账号
  const { results: accounts } = await DB.prepare('SELECT * FROM platform_accounts WHERE project_id = ?').bind(projectId).all();
  
  // 获取评分结果
  const scoring = await DB.prepare('SELECT * FROM scoring_results WHERE project_id = ? ORDER BY scored_at DESC LIMIT 1').bind(projectId).first();
  
  // 获取工作流历史
  const { results: workflowHistory } = await DB.prepare(`
    SELECT wh.*, u.username as operator_name
    FROM workflow_history wh
    LEFT JOIN users u ON wh.operator_id = u.id
    WHERE wh.project_id = ?
    ORDER BY wh.created_at ASC
  `).bind(projectId).all();
  
  return c.json({ 
    success: true, 
    project: {
      ...project,
      statusText: getStatusText(project.status as string),
      statusColor: getStatusColor(project.status as string),
      createdAt: formatDateTime(project.created_at as string),
      legalRepresentatives: legalReps,
      actualControllers: controllers,
      platformAccounts: accounts,
      scoring: scoring ? {
        ...scoring,
        scoredAt: formatDateTime(scoring.scored_at as string)
      } : null,
      workflowHistory: workflowHistory.map((h: any) => ({
        ...h,
        fromStatusText: getStatusText(h.from_status),
        toStatusText: getStatusText(h.to_status),
        createdAt: formatDateTime(h.created_at)
      }))
    }
  });
});

// ==================== 管理员 API ====================

// 获取所有项目（管理员）
app.get('/api/admin/projects', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  
  const { results } = await DB.prepare(`
    SELECT p.id, p.submission_code, p.status, p.company_name_a as project_name, p.created_at, u.username, u.company_name
    FROM projects p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all();
  
  return c.json({ 
    success: true, 
    projects: results.map((p: any) => ({
      id: p.id,
      submissionCode: p.submission_code,
      status: p.status,
      statusText: getStatusText(p.status),
      statusColor: getStatusColor(p.status),
      projectName: p.project_name,
      username: p.username,
      companyName: p.company_name,
      createdAt: formatDateTime(p.created_at)
    }))
  });
});

// 获取项目详情（管理员）
app.get('/api/admin/projects/:id', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const projectId = c.req.param('id');
  
  // 获取项目基本信息
  const project = await DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();
  
  if (!project) {
    return c.json({ error: '项目不存在' }, 404);
  }
  
  // 获取法定代表人
  const { results: legalReps } = await DB.prepare('SELECT * FROM legal_representatives WHERE project_id = ?').bind(projectId).all();
  
  // 获取实控人
  const { results: controllers } = await DB.prepare('SELECT * FROM actual_controllers WHERE project_id = ?').bind(projectId).all();
  
  // 获取平台账号
  const { results: accounts } = await DB.prepare('SELECT * FROM platform_accounts WHERE project_id = ?').bind(projectId).all();
  
  // 获取评分结果
  const scoring = await DB.prepare('SELECT * FROM scoring_results WHERE project_id = ? ORDER BY scored_at DESC LIMIT 1').bind(projectId).first();
  
  // 获取工作流历史
  const { results: workflowHistory } = await DB.prepare(`
    SELECT wh.*, u.username as operator_name
    FROM workflow_history wh
    LEFT JOIN users u ON wh.operator_id = u.id
    WHERE wh.project_id = ?
    ORDER BY wh.created_at ASC
  `).bind(projectId).all();
  
  return c.json({ 
    success: true, 
    project: {
      ...project,
      statusText: getStatusText(project.status as string),
      statusColor: getStatusColor(project.status as string),
      createdAt: formatDateTime(project.created_at as string),
      legalRepresentatives: legalReps,
      actualControllers: controllers,
      platformAccounts: accounts,
      scoring: scoring ? {
        ...scoring,
        scoredAt: formatDateTime(scoring.scored_at as string)
      } : null,
      workflowHistory: workflowHistory.map((h: any) => ({
        ...h,
        fromStatusText: getStatusText(h.from_status),
        toStatusText: getStatusText(h.to_status),
        createdAt: formatDateTime(h.created_at)
      }))
    }
  });
});

// 智能评分
app.post('/api/admin/projects/:id/score', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const projectId = c.req.param('id');
  
  // 获取项目信息
  const project = await DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();
  
  if (!project) {
    return c.json({ error: '项目不存在' }, 404);
  }
  
  // 执行评分
  const scoringResult = calculateScore(
    project.product_category as string,
    project.roi as number,
    project.return_rate as number,
    project.profit_rate as number,
    project.shop_score as number,
    project.operation_months as number
  );
  
  // 保存评分结果
  await DB.prepare(`
    INSERT INTO scoring_results (
      project_id, roi_score, return_rate_score, profit_score, 
      shop_score_value, operation_score, total_score, passed, evaluation_suggestion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    projectId,
    scoringResult.roiScore,
    scoringResult.returnRateScore,
    scoringResult.profitScore,
    scoringResult.shopScoreValue,
    scoringResult.operationScore,
    scoringResult.totalScore,
    scoringResult.passed ? 1 : 0,
    scoringResult.evaluationSuggestion
  ).run();
  
  // 根据评分结果决定状态
  let newStatus = 'scoring';
  let workflowRemark = '';
  
  // 如果评分低于60分，自动拒绝
  if (scoringResult.totalScore < 60) {
    newStatus = 'rejected';
    workflowRemark = `智能评分未通过（${scoringResult.totalScore}分），自动拒绝`;
  }
  
  // 更新项目状态
  await DB.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(newStatus, projectId).run();
  
  // 记录工作流
  await DB.prepare(`
    INSERT INTO workflow_history (project_id, from_status, to_status, operator_id, remark)
    VALUES (?, ?, ?, ?, ?)
  `).bind(projectId, project.status, newStatus, user.userId, workflowRemark).run();
  
  return c.json({ 
    success: true, 
    scoring: scoringResult,
    autoRejected: scoringResult.totalScore < 60
  });
});

// 审批操作
app.post('/api/admin/projects/:id/approve', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const projectId = c.req.param('id');
  const body = await c.req.json();
  
  const { action, remark } = body; // action: 'approve' or 'reject'
  
  const project = await DB.prepare('SELECT status FROM projects WHERE id = ?').bind(projectId).first();
  
  if (!project) {
    return c.json({ error: '项目不存在' }, 404);
  }
  
  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  
  // 更新项目状态
  await DB.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(newStatus, projectId).run();
  
  // 记录工作流
  await DB.prepare(`
    INSERT INTO workflow_history (project_id, from_status, to_status, operator_id, remark)
    VALUES (?, ?, ?, ?, ?)
  `).bind(projectId, project.status, newStatus, user.userId, remark || '').run();
  
  return c.json({ 
    success: true, 
    newStatus 
  });
});

// 上传协议
app.post('/api/admin/projects/:id/upload-contract', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const projectId = c.req.param('id');
  
  const project = await DB.prepare('SELECT status FROM projects WHERE id = ?').bind(projectId).first();
  
  if (!project) {
    return c.json({ error: '项目不存在' }, 404);
  }
  
  // 更新项目状态
  await DB.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind('contract_uploaded', projectId).run();
  
  // 记录工作流
  await DB.prepare(`
    INSERT INTO workflow_history (project_id, from_status, to_status, operator_id)
    VALUES (?, ?, ?, ?)
  `).bind(projectId, project.status, 'contract_uploaded', user.userId).run();
  
  return c.json({ 
    success: true 
  });
});

// 确认出资
app.post('/api/admin/projects/:id/confirm-funding', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const projectId = c.req.param('id');
  
  const project = await DB.prepare('SELECT status FROM projects WHERE id = ?').bind(projectId).first();
  
  if (!project) {
    return c.json({ error: '项目不存在' }, 404);
  }
  
  // 更新项目状态
  await DB.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind('funded', projectId).run();
  
  // 记录工作流
  await DB.prepare(`
    INSERT INTO workflow_history (project_id, from_status, to_status, operator_id)
    VALUES (?, ?, ?, ?)
  `).bind(projectId, project.status, 'funded', user.userId).run();
  
  return c.json({ 
    success: true 
  });
});

// 删除项目
app.delete('/api/admin/projects/:id', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const projectId = c.req.param('id');
  
  // 删除项目（级联删除会自动删除相关记录）
  await DB.prepare('DELETE FROM projects WHERE id = ?').bind(projectId).run();
  
  return c.json({ 
    success: true 
  });
});

// ==================== 尽调Checklist API ====================

// 提交尽调checklist并审批通过
app.post('/api/admin/projects/:id/due-diligence', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const projectId = c.req.param('id');
  const body = await c.req.json();
  
  const { creditFiles, trafficFiles, otherFiles } = body;
  
  try {
    // 保存尽调文件信息
    const saveFiles = async (files: any[], category: string) => {
      if (!files || !Array.isArray(files)) return;
      for (const file of files) {
        await DB.prepare(`
          INSERT INTO due_diligence_files (project_id, file_category, file_name, file_url, file_size, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(projectId, category, file.fileName, file.fileUrl, file.fileSize || 0, user.userId).run();
      }
    };
    
    await saveFiles(creditFiles, 'credit');
    await saveFiles(trafficFiles, 'traffic_data');
    await saveFiles(otherFiles, 'other');
    
    // 获取项目当前状态
    const project = await DB.prepare('SELECT status FROM projects WHERE id = ?').bind(projectId).first();
    
    // 更新项目状态为审批通过
    await DB.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind('approved', projectId).run();
    
    // 记录工作流
    await DB.prepare(`
      INSERT INTO workflow_history (project_id, from_status, to_status, operator_id, remark)
      VALUES (?, ?, ?, ?, ?)
    `).bind(projectId, project?.status, 'approved', user.userId, '已完成尽调核验').run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: '提交尽调失败：' + error.message }, 500);
  }
});

// 获取项目的尽调文件
app.get('/api/admin/projects/:id/due-diligence', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const projectId = c.req.param('id');
  
  const { results } = await DB.prepare('SELECT * FROM due_diligence_files WHERE project_id = ? ORDER BY uploaded_at DESC').bind(projectId).all();
  
  const creditFiles = results.filter((f: any) => f.file_category === 'credit');
  const trafficFiles = results.filter((f: any) => f.file_category === 'traffic_data');
  const otherFiles = results.filter((f: any) => f.file_category === 'other');
  
  return c.json({
    success: true,
    creditFiles,
    trafficFiles,
    otherFiles
  });
});

// ==================== 协议文件上传 API ====================

// 上传协议文件
app.post('/api/admin/projects/:id/upload-contract-file', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const projectId = c.req.param('id');
  const body = await c.req.json();
  
  const { fileName, fileUrl, fileSize } = body;
  
  try {
    // 保存协议文件信息
    await DB.prepare(`
      INSERT INTO contract_files (project_id, file_name, file_url, file_size, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(projectId, fileName, fileUrl, fileSize || 0, user.userId).run();
    
    // 获取项目当前状态
    const project = await DB.prepare('SELECT status FROM projects WHERE id = ?').bind(projectId).first();
    
    // 更新项目状态
    await DB.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind('contract_uploaded', projectId).run();
    
    // 记录工作流
    await DB.prepare(`
      INSERT INTO workflow_history (project_id, from_status, to_status, operator_id, remark)
      VALUES (?, ?, ?, ?, ?)
    `).bind(projectId, project?.status, 'contract_uploaded', user.userId, `上传协议：${fileName}`).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: '上传失败：' + error.message }, 500);
  }
});

// 获取项目的协议文件列表
app.get('/api/admin/projects/:id/contract-files', adminAuthMiddleware, async (c) => {
  const { DB } = c.env;
  const projectId = c.req.param('id');
  
  const { results } = await DB.prepare('SELECT * FROM contract_files WHERE project_id = ? ORDER BY uploaded_at DESC').bind(projectId).all();
  
  return c.json({
    success: true,
    files: results
  });
});

// 用户端也可以查看协议文件
app.get('/api/projects/:id/contract-files', authMiddleware, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const projectId = c.req.param('id');
  
  // 确认项目属于该用户
  const project = await DB.prepare('SELECT user_id FROM projects WHERE id = ?').bind(projectId).first();
  if (!project || project.user_id !== user.userId) {
    return c.json({ error: '无权访问' }, 403);
  }
  
  const { results } = await DB.prepare('SELECT * FROM contract_files WHERE project_id = ? ORDER BY uploaded_at DESC').bind(projectId).all();
  
  return c.json({
    success: true,
    files: results
  });
});

// 模拟文件下载
app.get('/api/files/download/:fileName', async (c) => {
  const fileName = c.req.param('fileName');
  
  // 这里应该从R2或其他存储获取真实文件
  // 目前返回提示信息
  return c.json({
    message: '文件下载功能需要配置Cloudflare R2存储',
    fileName,
    note: '这是模拟下载，生产环境请配置R2 bucket'
  });
});

// ==================== 前端路由 ====================

// 导航首页
app.get('/nav', (c) => {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>滴灌投资系统 - 快速导航</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-500 to-purple-600 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
        <div class="text-center mb-8">
            <i class="fas fa-seedling text-6xl text-blue-600 mb-4"></i>
            <h1 class="text-4xl font-bold text-gray-800 mb-2">滴灌投资信息收集系统</h1>
            <p class="text-gray-600">选择您的身份进入系统</p>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mb-8">
            <a href="/login" class="group block p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-105">
                <div class="text-white">
                    <i class="fas fa-user-circle text-5xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">用户端</h2>
                    <p class="text-blue-100 mb-4">企业用户登录和项目提交</p>
                    <div class="flex items-center justify-between">
                        <span class="text-sm">点击进入 →</span>
                    </div>
                </div>
            </a>

            <a href="/admin/login" class="group block p-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-105">
                <div class="text-white">
                    <i class="fas fa-shield-alt text-5xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">管理员</h2>
                    <p class="text-gray-300 mb-4">系统管理和项目审批</p>
                    <div class="flex items-center justify-between">
                        <span class="text-sm">点击进入 →</span>
                    </div>
                </div>
            </a>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-200">
            <h3 class="text-sm font-semibold text-gray-600 mb-3">快速链接</h3>
            <div class="flex flex-wrap gap-2">
                <a href="/login" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition">
                    <i class="fas fa-sign-in-alt mr-1"></i>用户登录
                </a>
                <a href="/admin/login" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition">
                    <i class="fas fa-user-shield mr-1"></i>管理员登录
                </a>
                <a href="/sieve-demo" class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm hover:shadow-lg transition">
                    <i class="fas fa-filter mr-1"></i>🔥 筛子系统演示
                </a>
                <a href="/apply-financing" class="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg text-sm hover:shadow-lg transition">
                    <i class="fas fa-hand-holding-usd mr-1"></i>💰 融资申请（筛子）
                </a>
            </div>
        </div>

        <div class="mt-6 text-center text-sm text-gray-500">
            <p>© 2026 滴灌投资信息收集系统 | v2.0.0</p>
        </div>
    </div>
</body>
</html>`;
  return c.html(html);
});

// 筛子系统演示页面
app.get('/sieve-demo', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>筛子评分系统演示</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto p-8">
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-filter text-blue-600 mr-2"></i>
                    抖店投流垫资准入筛子 + 智能评分系统
                </h1>
                <p class="text-gray-600">基于1487个二级类目精确阈值的准入与评分系统</p>
            </div>

            <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-sitemap text-green-600 mr-2"></i>
                        类目结构
                    </h2>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between p-2 bg-gray-50 rounded">
                            <span>主营类目</span>
                            <span class="font-bold text-blue-600">13个</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-50 rounded">
                            <span>一级类目</span>
                            <span class="font-bold text-blue-600">111个</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-50 rounded">
                            <span>二级类目</span>
                            <span class="font-bold text-blue-600">1393个</span>
                        </div>
                        <div class="flex justify-between p-2 bg-green-50 rounded">
                            <span class="font-bold">精确阈值记录</span>
                            <span class="font-bold text-green-600">1487条</span>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-sliders-h text-purple-600 mr-2"></i>
                        四个筛子指标
                    </h2>
                    <div class="space-y-3">
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                            <div>
                                <div class="font-semibold">净成交ROI</div>
                                <div class="text-sm text-gray-600">近90天实际ROI值</div>
                            </div>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                            <div>
                                <div class="font-semibold">14日结算ROI</div>
                                <div class="text-sm text-gray-600">回款安全核心指标</div>
                            </div>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                            <div>
                                <div class="font-semibold">14日订单结算率</div>
                                <div class="text-sm text-gray-600">资金周转效率（%）</div>
                            </div>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                            <div>
                                <div class="font-semibold">历史消耗额</div>
                                <div class="text-sm text-gray-600">累计投流规模（≥10万）</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-flask text-blue-600 mr-2"></i>
                    API测试工具
                </h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">1. 搜索类目</label>
                        <div class="flex gap-2">
                            <input type="text" id="searchKeyword" placeholder="输入关键词（如：水果、女装）" 
                                   class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            <button onclick="searchCategories()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <i class="fas fa-search mr-2"></i>搜索
                            </button>
                        </div>
                        <div id="searchResult" class="mt-2 text-sm"></div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">2. 获取类目阈值</label>
                        <div class="grid grid-cols-3 gap-2 mb-2">
                            <input type="text" id="mainCat" placeholder="主营类目" class="px-3 py-2 border rounded-lg">
                            <input type="text" id="level1Cat" placeholder="一级类目（可选）" class="px-3 py-2 border rounded-lg">
                            <input type="text" id="level2Cat" placeholder="二级类目（可选）" class="px-3 py-2 border rounded-lg">
                        </div>
                        <button onclick="getThresholds()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-cogs mr-2"></i>获取阈值（支持兜底）
                        </button>
                        <div id="thresholdResult" class="mt-2 text-sm"></div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">3. 准入检查</label>
                        <div class="grid grid-cols-4 gap-2 mb-2">
                            <input type="number" id="netRoi" placeholder="净成交ROI" step="0.01" class="px-3 py-2 border rounded-lg">
                            <input type="number" id="settleRoi" placeholder="14日结算ROI" step="0.01" class="px-3 py-2 border rounded-lg">
                            <input type="number" id="settleRate" placeholder="结算率（%）" class="px-3 py-2 border rounded-lg">
                            <input type="number" id="historySpend" placeholder="历史消耗额" class="px-3 py-2 border rounded-lg">
                        </div>
                        <button onclick="checkAdmission()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <i class="fas fa-check-double mr-2"></i>检查准入
                        </button>
                        <div id="admissionResult" class="mt-2 text-sm"></div>
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
                <h3 class="text-lg font-bold mb-2">系统状态</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <i class="fas fa-check-circle mr-2"></i>数据库：✅ 1487条阈值已导入
                    </div>
                    <div>
                        <i class="fas fa-check-circle mr-2"></i>后端API：✅ 4个端点就绪
                    </div>
                    <div>
                        <i class="fas fa-check-circle mr-2"></i>评分算法：✅ 方案A实现
                    </div>
                    <div>
                        <i class="fas fa-clock mr-2"></i>前端表单：⏳ 待集成
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const API_BASE = window.location.origin;
            
            async function searchCategories() {
                const keyword = document.getElementById('searchKeyword').value;
                const resultDiv = document.getElementById('searchResult');
                
                if (!keyword) {
                    resultDiv.innerHTML = '<div class="text-red-600">请输入搜索关键词</div>';
                    return;
                }
                
                try {
                    const res = await axios.get(\`\${API_BASE}/api/sieve/categories/search?q=\${keyword}\`);
                    if (res.data.success && res.data.data.length > 0) {
                        resultDiv.innerHTML = \`
                            <div class="bg-green-50 border border-green-200 rounded p-3">
                                <div class="font-semibold text-green-800 mb-2">找到 \${res.data.data.length} 个类目：</div>
                                <div class="space-y-1">
                                    \${res.data.data.slice(0, 10).map(item => \`
                                        <div class="text-gray-700">\${item.path}</div>
                                    \`).join('')}
                                </div>
                            </div>
                        \`;
                    } else {
                        resultDiv.innerHTML = '<div class="text-gray-600">未找到匹配的类目</div>';
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`<div class="text-red-600">错误：\${error.message}</div>\`;
                }
            }
            
            async function getThresholds() {
                const main = document.getElementById('mainCat').value;
                const level1 = document.getElementById('level1Cat').value;
                const level2 = document.getElementById('level2Cat').value;
                const resultDiv = document.getElementById('thresholdResult');
                
                if (!main) {
                    resultDiv.innerHTML = '<div class="text-red-600">请至少填写主营类目</div>';
                    return;
                }
                
                try {
                    const res = await axios.post(\`\${API_BASE}/api/sieve/categories/get-thresholds\`, {
                        main_category: main,
                        level1_category: level1 || null,
                        level2_category: level2 || null
                    });
                    
                    if (res.data.success) {
                        const data = res.data.data;
                        resultDiv.innerHTML = \`
                            <div class="bg-blue-50 border border-blue-200 rounded p-3">
                                <div class="font-semibold text-blue-800 mb-2">阈值配置（\${data.threshold_level}）：</div>
                                <div class="grid grid-cols-2 gap-2 text-gray-700">
                                    <div>净成交ROI ≥ \${data.net_roi_min}</div>
                                    <div>14日结算ROI ≥ \${data.settle_roi_min}</div>
                                    <div>14日结算率 ≥ \${(data.settle_rate_min * 100).toFixed(1)}%</div>
                                    <div>历史消耗额 ≥ \${data.history_spend_min}元</div>
                                </div>
                            </div>
                        \`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`<div class="text-red-600">错误：\${error.response?.data?.error || error.message}</div>\`;
                }
            }
            
            async function checkAdmission() {
                const main = document.getElementById('mainCat').value;
                const netRoi = parseFloat(document.getElementById('netRoi').value);
                const settleRoi = parseFloat(document.getElementById('settleRoi').value);
                const settleRate = parseFloat(document.getElementById('settleRate').value) / 100;
                const historySpend = parseInt(document.getElementById('historySpend').value);
                const resultDiv = document.getElementById('admissionResult');
                
                if (!main || isNaN(netRoi) || isNaN(settleRoi) || isNaN(settleRate) || isNaN(historySpend)) {
                    resultDiv.innerHTML = '<div class="text-red-600">请填写完整的类目和四项指标</div>';
                    return;
                }
                
                try {
                    const res = await axios.post(\`\${API_BASE}/api/sieve/check-admission\`, {
                        main_category: main,
                        level1_category: document.getElementById('level1Cat').value || null,
                        level2_category: document.getElementById('level2Cat').value || null,
                        net_roi: netRoi,
                        settle_roi: settleRoi,
                        settle_rate: settleRate,
                        history_spend: historySpend
                    });
                    
                    if (res.data.success) {
                        const data = res.data.data;
                        const admitted = data.is_admitted;
                        resultDiv.innerHTML = \`
                            <div class="bg-\${admitted ? 'green' : 'red'}-50 border border-\${admitted ? 'green' : 'red'}-200 rounded p-3">
                                <div class="font-semibold text-\${admitted ? 'green' : 'red'}-800 mb-2">
                                    \${admitted ? '✅ 通过准入' : '❌ 未通过准入'}
                                </div>
                                \${!admitted ? \`
                                    <div class="text-red-700 text-xs space-y-1">
                                        \${data.reasons.map(r => \`<div>• \${r}</div>\`).join('')}
                                    </div>
                                \` : '<div class="text-green-700">所有指标均满足阈值要求</div>'}
                            </div>
                        \`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`<div class="text-red-600">错误：\${error.response?.data?.error || error.message}</div>\`;
                }
            }
        </script>
    </body>
    </html>
  `);
});

// 融资申请表单（筛子系统集成）
app.get('/apply-financing', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>抖店投流垫资申请 - 筛子准入系统</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-8">
        <div class="max-w-4xl mx-auto px-4">
            <!-- 头部 -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">
                            <i class="fas fa-hand-holding-usd text-blue-600 mr-2"></i>
                            抖店投流垫资申请
                        </h1>
                        <p class="text-gray-600 mt-1">基于1487个类目精确阈值的智能准入与评分系统</p>
                    </div>
                    <a href="/nav" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-home mr-1"></i>返回首页
                    </a>
                </div>
            </div>

            <!-- 申请表单 -->
            <div class="bg-white rounded-lg shadow-lg p-8">
                <form id="financing-form" class="space-y-6">
                    
                    <!-- 企业信息 -->
                    <div class="border-b pb-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-building text-green-600 mr-2"></i>
                            企业信息
                        </h2>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                企业名称 <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="company_name" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="请输入营业执照上的完整企业名称">
                        </div>
                    </div>

                    <!-- 类目选择 -->
                    <div class="border-b pb-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-sitemap text-purple-600 mr-2"></i>
                            经营类目选择
                        </h2>
                        
                        <!-- 搜索功能 -->
                        <div class="category-search-container relative mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-search text-gray-500 mr-1"></i>
                                快速搜索类目（支持拼音和中文）
                            </label>
                            <input type="text" id="category-search-input"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="输入关键词，如：水果、女装、nz、sg...">
                            <div id="category-search-results" 
                                 class="hidden absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"></div>
                        </div>

                        <!-- 三级联动下拉选择 -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    主营类目 <span class="text-red-500">*</span>
                                </label>
                                <select id="main-category-select" required
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">-- 请选择主营类目 --</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    一级类目 <span class="text-gray-400">(可选)</span>
                                </label>
                                <select id="level1-category-select" disabled
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">-- 请先选择主营类目 --</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    二级类目 <span class="text-gray-400">(可选)</span>
                                </label>
                                <select id="level2-category-select" disabled
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">-- 请先选择一级类目 --</option>
                                </select>
                            </div>
                        </div>

                        <!-- 已选类目显示 -->
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div class="text-sm font-medium text-gray-700 mb-2">当前选择：</div>
                            <div id="selected-category-path" class="text-gray-400">
                                <i class="fas fa-info-circle mr-2"></i>未选择（至少需要选择主营类目）
                            </div>
                        </div>
                        
                        <!-- 隐藏字段存储类目JSON -->
                        <input type="hidden" id="selected_category_json">
                    </div>

                    <!-- 阈值预览 -->
                    <div id="threshold-preview" class="mb-6"></div>

                    <!-- 经营数据 -->
                    <div class="border-b pb-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-chart-line text-orange-600 mr-2"></i>
                            近90天经营数据
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    净成交ROI <span class="text-red-500">*</span>
                                    <span class="text-xs text-gray-500 ml-2">(大于0，如：1.85表示185%)</span>
                                </label>
                                <input type="number" id="net_roi" step="0.01" min="0.01" required
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                       placeholder="例如：1.85">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    14日结算ROI <span class="text-red-500">*</span>
                                    <span class="text-xs text-gray-500 ml-2">(大于0，如：1.62)</span>
                                </label>
                                <input type="number" id="settle_roi" step="0.01" min="0.01" required
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                       placeholder="例如：1.62">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    14日订单结算率 <span class="text-red-500">*</span>
                                    <span class="text-xs text-gray-500 ml-2">(0-100，如：82表示82%)</span>
                                </label>
                                <input type="number" id="settle_rate" min="0" max="100" step="0.01" required
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                       placeholder="例如：82">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    历史消耗金额（元）<span class="text-red-500">*</span>
                                    <span class="text-xs text-gray-500 ml-2">(累计消耗，整数)</span>
                                </label>
                                <input type="number" id="history_spend" min="0" step="1000" required
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                       placeholder="例如：500000">
                            </div>
                        </div>
                        
                        <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-info-circle text-yellow-600 mt-0.5"></i>
                                <div class="text-sm text-yellow-800">
                                    <strong>数据要求：</strong>
                                    所有指标必须达到所选类目的最低阈值才能通过准入审核。系统会自动应用"精确匹配 → 一级兜底 → 主营兜底"的规则。
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 提交按钮 -->
                    <div class="flex justify-end gap-4">
                        <button type="button" onclick="window.location.href='/nav'"
                                class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            <i class="fas fa-times mr-2"></i>取消
                        </button>
                        <button type="submit" id="submit-btn"
                                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                            <i class="fas fa-paper-plane mr-2"></i>提交申请
                        </button>
                    </div>
                </form>

                <!-- 准入结果显示 -->
                <div id="admission-result" class="mt-6 hidden"></div>
            </div>

            <!-- 帮助说明 -->
            <div class="mt-6 bg-white rounded-lg shadow p-6">
                <h3 class="font-bold text-gray-800 mb-3">
                    <i class="fas fa-question-circle text-blue-600 mr-2"></i>
                    填写说明
                </h3>
                <ul class="space-y-2 text-sm text-gray-700">
                    <li><i class="fas fa-check text-green-600 mr-2"></i>至少需要选择<strong>主营类目</strong>，可进一步选择一级、二级类目以获得更精确的阈值</li>
                    <li><i class="fas fa-check text-green-600 mr-2"></i>如果您的二级类目没有精确阈值，系统会自动应用<strong>一级类目</strong>的最严格阈值</li>
                    <li><i class="fas fa-check text-green-600 mr-2"></i>如果一级类目也无阈值，系统会应用<strong>主营类目</strong>下所有二级类目的最严格阈值</li>
                    <li><i class="fas fa-check text-green-600 mr-2"></i>四项经营数据（净ROI、14日ROI、结算率、消耗）<strong>必须全部达标</strong>才能通过准入</li>
                    <li><i class="fas fa-check text-green-600 mr-2"></i>通过准入后，系统会根据您的超额表现进行智能评分（满分100分）</li>
                </ul>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/sieve-frontend.js"></script>
        <script>
            // 页面加载时初始化
            document.addEventListener('DOMContentLoaded', async function() {
                await window.SIEVE.init();
                console.log('✅ 筛子系统初始化完成');
            });

            // 表单提交
            document.getElementById('financing-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submit-btn');
                const resultDiv = document.getElementById('admission-result');
                
                // 获取表单数据
                const categoryJson = document.getElementById('selected_category_json').value;
                if (!categoryJson) {
                    alert('请选择经营类目');
                    return;
                }
                
                const category = JSON.parse(categoryJson);
                if (!category.main) {
                    alert('至少需要选择主营类目');
                    return;
                }
                
                const formData = {
                    company_name: document.getElementById('company_name').value,
                    main_category: category.main,
                    level1_category: category.level1 || null,
                    level2_category: category.level2 || null,
                    net_roi: parseFloat(document.getElementById('net_roi').value),
                    settle_roi: parseFloat(document.getElementById('settle_roi').value),
                    settle_rate: parseFloat(document.getElementById('settle_rate').value),
                    history_spend: parseInt(document.getElementById('history_spend').value)
                };
                
                // 禁用按钮
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>检查中...';
                
                try {
                    // 调用准入检查API
                    const result = await window.SIEVE.checkAdmission(formData);
                    
                    // 显示结果
                    resultDiv.classList.remove('hidden');
                    window.SIEVE.displayAdmissionResult(result);
                    
                    // 滚动到结果
                    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // 如果通过准入，可以进一步操作
                    if (result.data.admission_result === '可评分') {
                        setTimeout(() => {
                            if (confirm('恭喜通过准入审核！是否进入详细评分页面？')) {
                                // 这里可以跳转到评分页面或者直接进行评分
                                // window.location.href = '/scoring-detail?data=' + encodeURIComponent(JSON.stringify(formData));
                            }
                        }, 1500);
                    }
                    
                } catch (error) {
                    alert('提交失败：' + error.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>提交申请';
                }
            });
        </script>
    </body>
    </html>
  `);
});

// 主页（10步表单）
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>滴灌投资信息收集系统</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/app-extended.js"></script>
    </body>
    </html>
  `);
});

// 用户仪表盘
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>用户仪表盘 - 滴灌投资</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/app-extended.js"></script>
    </body>
    </html>
  `);
});

// 项目详情
app.get('/project/:id', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>项目详情 - 滴灌投资</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/app-extended.js"></script>
    </body>
    </html>
  `);
});

// 用户登录
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>登录/注册 - 滴灌投资</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/app-extended.js"></script>
    </body>
    </html>
  `);
});

// 管理员登录
app.get('/admin/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理员登录 - 滴灌投资</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/app-extended.js"></script>
    </body>
    </html>
  `);
});

// 管理员后台
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理员后台 - 滴灌投资</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/app-extended.js"></script>
    </body>
    </html>
  `);
});

// 挂载扩展管理员API
app.route('/api/admin', adminExtendedApi);

// 挂载筛子评分API
app.route('/api/sieve', sieveApi);

export default app;
