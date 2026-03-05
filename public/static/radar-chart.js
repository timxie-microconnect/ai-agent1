/**
 * 资产端评估雷达图 - 投流赛道专用
 * 四象限设计：回报 / 管控够不够 / 收益够不够 / 风险
 * 基于筛子评分数据自动计算各维度得分（0-10分制）
 */

// ==================== 指标体系定义 ====================
/**
 * 雷达图8个维度与四象限对应关系（顺时针从正上方开始）：
 *
 * 象限一：回报（右上，蓝色）
 *   [0] 回报强度       → 净成交ROI uplift 映射
 *   [1] 回报质量       → 14日结算ROI uplift 映射
 *
 * 象限四：管控够不够（右下，紫色）
 *   [2] 名声敏感度     → 品类合规风险评分（基于主营类目）
 *   [3] Leverage管控力 → 历史消耗金额 uplift 映射
 *   [4] 自动报数和打款 → 14日订单结算率 uplift 映射
 *
 * 象限三：收益够不够（左下，绿色）
 *   [5] 生意的利润率   → 净ROI + 14日ROI 综合利润空间
 *
 * 象限二：风险（左上，红色）
 *   [6] 生命周期可见性 → 品类成熟度 + 历史消耗规模
 *   [7] 波动可控性     → 波动率反向映射（波动率越低分越高）
 *   [8] 现金流可靠性   → 结算率 × 结算ROI 综合
 *
 * 注：顺序为 [0]回报强度, [1]回报质量, [2]名声敏感度, [3]Leverage管控力,
 *           [4]自动报数和打款, [5]生意的利润率, [6]生命周期可见性,
 *           [7]波动可控性, [8]现金流可靠性
 */

const RADAR_DIMENSIONS = [
  // 象限一：回报（右上，蓝色）
  {
    key: 'return_strength',
    label: '回报强度',
    quadrant: 'return',
    color: '#4A90D9',
    description: '净成交ROI超越阈值的能力'
  },
  {
    key: 'return_quality',
    label: '回报质量',
    quadrant: 'return',
    color: '#4A90D9',
    description: '14日结算ROI反映的快速回款质量'
  },
  // 象限四：管控够不够（右下，紫色）
  {
    key: 'reputation_sensitivity',
    label: '名声敏感度',
    quadrant: 'control',
    color: '#9B6DB5',
    description: '品类合规风险与舆论敏感程度（反向：越低越稳健）'
  },
  {
    key: 'leverage_control',
    label: 'Leverage管控力',
    quadrant: 'control',
    color: '#9B6DB5',
    description: '历史消耗体量对融资规模的管控支撑'
  },
  {
    key: 'auto_settlement',
    label: '自动报数和打款',
    quadrant: 'control',
    color: '#9B6DB5',
    description: '14日订单结算率反映的自动化履约能力'
  },
  // 象限三：收益够不够（左下，绿色）
  {
    key: 'profit_margin',
    label: '生意的利润率',
    quadrant: 'profit',
    color: '#5BAD6F',
    description: '净ROI与结算ROI综合反映的利润空间'
  },
  // 象限二：风险（左上，红色）
  {
    key: 'lifecycle_visibility',
    label: '生命周期可见性',
    quadrant: 'risk',
    color: '#D95252',
    description: '品类成熟度与经营规模反映的可持续性'
  },
  {
    key: 'volatility_control',
    label: '波动可控性',
    quadrant: 'risk',
    color: '#D95252',
    description: '净成交数据波动率（越低分越高）'
  },
  {
    key: 'cashflow_reliability',
    label: '现金流可靠性',
    quadrant: 'risk',
    color: '#D95252',
    description: '结算率×结算ROI综合反映的现金流稳健性'
  }
];

// 品类合规风险评分表（越高=风险越大，最终在名声敏感度取10-risk）
const CATEGORY_RISK_MAP = {
  // 高风险品类（分值7-9）
  '医药健康': 8,
  '成人用品': 9,
  '隐形眼镜/护理液': 7,
  '医疗健康服务': 7,
  '保健食品/膳食营养补充食品': 7,
  '精制中药材': 6,
  '传统滋补品': 5,
  // 中风险品类（分值4-6）
  '烟品/打火机/瑞士军刀': 8,
  '虚拟商品': 6,
  '游戏服务/直播': 7,
  '珠宝/钻石/翡翠/黄金': 5,
  '影视/会员/腾讯QQ专区': 5,
  '酒类': 6,
  // 低风险品类（分值1-3）
  '食品保健': 4,
  '水果生鲜': 3,
  '母婴玩具': 4,
  '服饰箱包': 2,
  '家居生活': 2,
  '家纺家具家装': 2,
  '数码电器': 3,
  '运动户外': 2,
  '美容个护': 3,
  '海淘商品': 4,
  '汽配摩托': 3
};

// 品类生命周期成熟度（越高=越成熟=可见性越高）
const CATEGORY_LIFECYCLE_MAP = {
  '服饰箱包': 9,
  '食品保健': 9,
  '美容个护': 9,
  '数码电器': 8,
  '家居生活': 8,
  '母婴玩具': 8,
  '家纺家具家装': 7,
  '运动户外': 7,
  '水果生鲜': 7,
  '医药健康': 7,
  '汽配摩托': 6,
  '虚拟商品': 6,
  '海淘商品': 6
};

// ==================== 核心计算逻辑 ====================

/**
 * 将筛子评分数据映射到雷达图各维度（0-10分）
 * @param {Object} scoring - 筛子评分结果对象
 * @param {Object} volatilityData - 波动率数据（可选）
 * @param {String} mainCategory - 主营类目
 * @returns {Object} 各维度得分 { key: score }
 */
function computeRadarScores(scoring, volatilityData, mainCategory) {
  const details = scoring.details || [];
  
  // 提取各字段的原始数据
  const netRoiDetail = details.find(d => d.field_key === 'net_roi' || d.field_name?.includes('净成交'));
  const settleRoiDetail = details.find(d => d.field_key === 'settle_roi' || d.field_name?.includes('14日结算ROI'));
  const settleRateDetail = details.find(d => d.field_key === 'settle_rate' || d.field_name?.includes('结算率'));
  const historySpendDetail = details.find(d => d.field_key === 'history_spend' || d.field_name?.includes('历史消耗'));

  // 各指标的uplift值（超出阈值的比例）
  const netRoiUplift = netRoiDetail ? Math.max(0, netRoiDetail.uplift || 0) : 0;
  const settleRoiUplift = settleRoiDetail ? Math.max(0, settleRoiDetail.uplift || 0) : 0;
  const settleRateUplift = settleRateDetail ? Math.max(0, settleRateDetail.uplift || 0) : 0;
  const historySpendUplift = historySpendDetail ? Math.max(0, historySpendDetail.uplift || 0) : 0;

  // 各指标的基础分（0-100）
  const netRoiBaseScore = netRoiDetail ? (netRoiDetail.base_score || 0) : 0;
  const settleRoiBaseScore = settleRoiDetail ? (settleRoiDetail.base_score || 0) : 0;
  const settleRateBaseScore = settleRateDetail ? (settleRateDetail.base_score || 0) : 0;
  const historySpendBaseScore = historySpendDetail ? (historySpendDetail.base_score || 0) : 0;

  // 品类风险评分（0-10，越高风险越大）
  const categoryRisk = getCategoryRisk(mainCategory);
  // 品类生命周期成熟度（0-10）
  const categoryLifecycle = getCategoryLifecycle(mainCategory);
  
  // 波动率（0-1，如果有的话）
  const volatilityRate = volatilityData ? (volatilityData.volatility_rate || 0) : 0;

  // ========== 计算各维度得分（0-10分制）==========

  // [0] 回报强度：净成交ROI uplift → 边际递减转换到0-10
  // uplift=0 → 3分（刚达阈值），uplift=50% → 7分，uplift=100%+ → 9-10分
  const returnStrength = upliftToScore(netRoiUplift, { zeroBase: 3, k: 3.5 });

  // [1] 回报质量：14日结算ROI uplift → 更看重快速回款
  // 14日ROI高说明资金周转快，投流赛道极为重要
  const returnQuality = upliftToScore(settleRoiUplift, { zeroBase: 3, k: 4.0 });

  // [2] 名声敏感度：品类风险的反向（风险越低=越稳健=得分越高）
  // 名声敏感度高（如成人用品）意味着对滴灌通品牌风险大→ 得分低
  // 图中显示的是"名声敏感度"作为风险指标，越高越危险
  // 但我们在雷达图中展示实际敏感度（高=不利），所以用原始风险分
  const reputationSensitivity = Math.min(10, Math.max(1, categoryRisk));

  // [3] Leverage管控力：历史消耗体量 → 规模越大，对融资的管控支撑越强
  // 消耗10万=基础3分，消耗100万=7分，消耗1000万+=9-10分
  const leverageControl = upliftToScore(historySpendUplift, { zeroBase: 3, k: 2.5 }) +
    scaleFromSpend(historySpendDetail?.actual_value);

  // [4] 自动报数和打款：结算率 uplift → 结算率越高，自动化履约越强
  const autoSettlement = upliftToScore(settleRateUplift, { zeroBase: 3, k: 4.5 });

  // [5] 生意的利润率：净ROI与结算ROI的综合
  // 两者都高说明利润空间充足，资金方收益有保障
  const profitMargin = Math.min(10, 
    (netRoiBaseScore / 100 * 6) + (settleRoiBaseScore / 100 * 4)
  );

  // [6] 生命周期可见性：品类成熟度 + 历史消耗规模
  // 成熟品类（如服饰、食品）生命周期可预测性高
  const lifecycleVisibility = Math.min(10,
    categoryLifecycle * 0.6 + upliftToScore(historySpendUplift, { zeroBase: 2, k: 2 }) * 0.4
  );

  // [7] 波动可控性：波动率越低，得分越高
  // 波动率=0% → 10分，波动率=30% → 5分，波动率=100%+ → 1分
  const volatilityControl = volatilityRate > 0
    ? Math.max(1, Math.min(10, 10 - (volatilityRate / 0.15) * 3))
    : 6; // 无波动数据时给中等评分

  // [8] 现金流可靠性：结算率 × 结算ROI综合
  // 两者都达标且超出多 → 现金流稳定可靠
  const cashflowReliability = Math.min(10,
    (settleRateBaseScore / 100 * 5) + (settleRoiBaseScore / 100 * 5)
  );

  return {
    return_strength: roundScore(returnStrength),
    return_quality: roundScore(returnQuality),
    reputation_sensitivity: roundScore(reputationSensitivity),
    leverage_control: roundScore(Math.min(10, leverageControl)),
    auto_settlement: roundScore(autoSettlement),
    profit_margin: roundScore(profitMargin),
    lifecycle_visibility: roundScore(lifecycleVisibility),
    volatility_control: roundScore(volatilityControl),
    cashflow_reliability: roundScore(cashflowReliability)
  };
}

/**
 * uplift → 0-10分的边际递减映射
 * @param {number} uplift - 超出阈值的比例（0=刚达阈值，0.5=超出50%）
 * @param {Object} options - { zeroBase: uplift=0时的基础分, k: 递减系数 }
 */
function upliftToScore(uplift, { zeroBase = 3, k = 3.5 } = {}) {
  if (uplift <= 0) return zeroBase;
  // 边际递减：score = zeroBase + (10-zeroBase) * (1 - e^(-k*uplift))
  const additionalScore = (10 - zeroBase) * (1 - Math.exp(-k * uplift));
  return Math.min(10, zeroBase + additionalScore);
}

/**
 * 根据历史消耗金额给额外加分（规模bonus）
 */
function scaleFromSpend(actualValue) {
  if (!actualValue) return 0;
  const spend = parseFloat(actualValue) || 0;
  if (spend >= 5000000) return 2;      // 500万+
  if (spend >= 1000000) return 1.5;    // 100万+
  if (spend >= 500000) return 1;       // 50万+
  if (spend >= 100000) return 0.5;     // 10万+
  return 0;
}

/**
 * 获取品类合规风险评分
 */
function getCategoryRisk(mainCategory) {
  if (!mainCategory) return 4; // 默认中等风险
  // 先查主营类目
  if (CATEGORY_RISK_MAP[mainCategory] !== undefined) {
    return CATEGORY_RISK_MAP[mainCategory];
  }
  // 模糊匹配
  for (const [key, value] of Object.entries(CATEGORY_RISK_MAP)) {
    if (mainCategory.includes(key) || key.includes(mainCategory)) {
      return value;
    }
  }
  return 4; // 默认
}

/**
 * 获取品类生命周期成熟度
 */
function getCategoryLifecycle(mainCategory) {
  if (!mainCategory) return 6;
  if (CATEGORY_LIFECYCLE_MAP[mainCategory] !== undefined) {
    return CATEGORY_LIFECYCLE_MAP[mainCategory];
  }
  for (const [key, value] of Object.entries(CATEGORY_LIFECYCLE_MAP)) {
    if (mainCategory.includes(key) || key.includes(mainCategory)) {
      return value;
    }
  }
  return 6; // 默认中等
}

/**
 * 四舍五入到一位小数
 */
function roundScore(score) {
  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}


// ==================== Canvas 雷达图渲染 ====================

/**
 * 绘制资产端评估雷达图
 * @param {string} canvasId - Canvas元素ID
 * @param {Object} scores - 各维度得分 { key: 0-10 }
 * @param {Object} options - 绘制选项
 */
function drawAssetRadarChart(canvasId, scores, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // 设置高分辨率
  const displaySize = options.size || 420;
  canvas.width = displaySize * dpr;
  canvas.height = displaySize * dpr;
  canvas.style.width = displaySize + 'px';
  canvas.style.height = displaySize + 'px';
  ctx.scale(dpr, dpr);

  const cx = displaySize / 2;
  const cy = displaySize / 2;
  const maxR = displaySize * 0.36;  // 最大半径
  const levels = 5;                  // 刻度层数（2,4,6,8,10）

  // 清除画布
  ctx.clearRect(0, 0, displaySize, displaySize);

  // 9个维度的角度（从正上方顺时针，与图片一致）
  // 顺序：回报强度(正右上)、回报质量(右)、名声敏感度(右下)、
  //       Leverage管控力(下偏右)、自动报数和打款(正下)、生意的利润率(下偏左)、
  //       生命周期可见性(左)、波动可控性(左上)、现金流可靠性(左上偏上)
  const n = RADAR_DIMENSIONS.length; // 9
  const angles = RADAR_DIMENSIONS.map((_, i) => {
    // 从正上方（-90度）开始，顺时针均匀分布
    return (Math.PI * 2 / n) * i - Math.PI / 2;
  });

  // ---- 绘制背景四象限色块 ----
  drawQuadrantBackground(ctx, cx, cy, maxR, angles, n);

  // ---- 绘制网格线（同心多边形）----
  drawGridLines(ctx, cx, cy, maxR, angles, n, levels);

  // ---- 绘制坐标轴线 ----
  drawAxisLines(ctx, cx, cy, maxR, angles, n);

  // ---- 绘制数据多边形 ----
  const scoreValues = RADAR_DIMENSIONS.map(d => (scores[d.key] || 0) / 10);
  drawDataPolygon(ctx, cx, cy, maxR, angles, scoreValues);

  // ---- 绘制数据点 ----
  drawDataPoints(ctx, cx, cy, maxR, angles, scoreValues, scores);

  // ---- 绘制标签 ----
  drawLabels(ctx, cx, cy, maxR, angles, scores, displaySize);

  // ---- 绘制中心点 ----
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100,100,100,0.5)';
  ctx.fill();
}

/**
 * 绘制四象限背景色块
 */
function drawQuadrantBackground(ctx, cx, cy, maxR, angles, n) {
  // 象限映射：维度索引 → 象限颜色
  const quadrantColors = {
    'return': 'rgba(74, 144, 217, 0.12)',    // 蓝色：回报
    'control': 'rgba(155, 109, 181, 0.12)',   // 紫色：管控
    'profit': 'rgba(91, 173, 111, 0.12)',     // 绿色：收益
    'risk': 'rgba(217, 82, 82, 0.12)'         // 红色：风险
  };

  // 按象限分组绘制扇形背景
  const quadrantGroups = {
    'return': [0, 1],
    'control': [2, 3, 4],
    'profit': [5],
    'risk': [6, 7, 8]
  };

  for (const [quadrant, indices] of Object.entries(quadrantGroups)) {
    if (indices.length === 0) continue;
    
    const color = quadrantColors[quadrant];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    
    // 扇形从第一个维度之前半格开始，到最后一个维度之后半格结束
    const firstAngle = angles[indices[0]] - Math.PI / RADAR_DIMENSIONS.length;
    const lastAngle = angles[indices[indices.length - 1]] + Math.PI / RADAR_DIMENSIONS.length;
    
    ctx.arc(cx, cy, maxR * 1.12, firstAngle, lastAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/**
 * 绘制同心多边形网格
 */
function drawGridLines(ctx, cx, cy, maxR, angles, n, levels) {
  for (let level = 1; level <= levels; level++) {
    const r = (maxR / levels) * level;
    
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = cx + r * Math.cos(angles[i]);
      const y = cy + r * Math.sin(angles[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = level === levels ? 'rgba(150,150,150,0.5)' : 'rgba(180,180,180,0.3)';
    ctx.lineWidth = level === levels ? 1.5 : 0.8;
    ctx.stroke();

    // 最外圈标注刻度值
    if (level === levels || level === 3) {
      const labelR = r;
      const labelAngle = angles[0] - 0.08;
      const lx = cx + labelR * Math.cos(labelAngle);
      const ly = cy + labelR * Math.sin(labelAngle);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = 'rgba(120,120,120,0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(level * 2, lx, ly);
    }
  }
}

/**
 * 绘制坐标轴线
 */
function drawAxisLines(ctx, cx, cy, maxR, angles, n) {
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + maxR * Math.cos(angles[i]),
      cy + maxR * Math.sin(angles[i])
    );
    ctx.strokeStyle = 'rgba(150,150,150,0.4)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

/**
 * 绘制数据多边形（带渐变填充）
 */
function drawDataPolygon(ctx, cx, cy, maxR, angles, scoreRatios) {
  const n = scoreRatios.length;
  
  // 填充
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.15)');

  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const r = maxR * scoreRatios[i];
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // 描边
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const r = maxR * scoreRatios[i];
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(79, 70, 229, 0.8)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/**
 * 绘制数据点
 */
function drawDataPoints(ctx, cx, cy, maxR, angles, scoreRatios, scores) {
  const n = RADAR_DIMENSIONS.length;
  for (let i = 0; i < n; i++) {
    const r = maxR * scoreRatios[i];
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    const dim = RADAR_DIMENSIONS[i];
    const score = scores[dim.key] || 0;

    // 外圈
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = dim.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 内圈填色
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = dim.color;
    ctx.fill();

    // 得分数字（显示在数据点旁边）
    const labelOffset = 16;
    const lx = cx + (r + labelOffset) * Math.cos(angles[i]);
    const ly = cy + (r + labelOffset) * Math.sin(angles[i]);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = dim.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score.toFixed(1), lx, ly);
  }
}

/**
 * 绘制维度标签
 */
function drawLabels(ctx, cx, cy, maxR, angles, scores, displaySize) {
  const n = RADAR_DIMENSIONS.length;
  const labelR = maxR + 48;
  
  ctx.textBaseline = 'middle';

  for (let i = 0; i < n; i++) {
    const dim = RADAR_DIMENSIONS[i];
    const angle = angles[i];
    const lx = cx + labelR * Math.cos(angle);
    const ly = cy + labelR * Math.sin(angle);

    // 根据角度决定文字对齐方式
    const cosA = Math.cos(angle);
    if (cosA > 0.3) ctx.textAlign = 'left';
    else if (cosA < -0.3) ctx.textAlign = 'right';
    else ctx.textAlign = 'center';

    // 标签背景
    const textW = ctx.measureText(dim.label).width + 8;
    const bgX = ctx.textAlign === 'left' ? lx - 4 :
                ctx.textAlign === 'right' ? lx - textW + 4 :
                lx - textW / 2;
    
    ctx.font = 'bold 11px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = dim.color;
    ctx.fillText(dim.label, lx, ly);

    // 英文副标题（象限标识）
    const subLabels = {
      'return_strength': 'Return Strength',
      'return_quality': 'Return Quality',
      'reputation_sensitivity': 'Reputation Risk',
      'leverage_control': 'Leverage Control',
      'auto_settlement': 'Auto Settlement',
      'profit_margin': 'Profit Margin',
      'lifecycle_visibility': 'Lifecycle',
      'volatility_control': 'Volatility Ctrl',
      'cashflow_reliability': 'Cashflow'
    };
  }
}

// ==================== 象限标签渲染 ====================

/**
 * 在Canvas上绘制四象限大标签
 */
function drawQuadrantLabels(ctx, cx, cy, maxR) {
  const r = maxR * 1.35;
  const labels = [
    { text: '回报 Return', x: cx + r * 0.7, y: cy - r * 0.5, color: '#2563EB' },
    { text: '管控够不够', x: cx + r * 0.7, y: cy + r * 0.5, color: '#7C3AED' },
    { text: '收益够不够', x: cx - r * 0.7, y: cy + r * 0.5, color: '#059669' },
    { text: '风险 Risk', x: cx - r * 0.7, y: cy - r * 0.5, color: '#DC2626' }
  ];

  labels.forEach(({ text, x, y, color }) => {
    ctx.font = 'bold 12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.7;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  });
}


// ==================== HTML 生成（含 Canvas + 图例）====================

/**
 * 生成完整的雷达图HTML（含Canvas + 图例 + 指标说明）
 * @param {Object} scoring - 筛子评分数据
 * @param {Object} volatilityData - 波动率数据（可选）
 * @param {String} mainCategory - 主营类目
 * @param {String} canvasId - Canvas ID（唯一）
 */
function generateRadarChartHTML(scoring, volatilityData, mainCategory, canvasId = 'asset-radar-chart') {
  const scores = computeRadarScores(scoring, volatilityData, mainCategory);
  
  // 计算四个象限的综合得分
  const returnScore = ((scores.return_strength + scores.return_quality) / 2).toFixed(1);
  const controlScore = ((scores.reputation_sensitivity + scores.leverage_control + scores.auto_settlement) / 3).toFixed(1);
  const profitScore = scores.profit_margin.toFixed(1);
  // 名声敏感度在风险象限取反（原值越高=风险越大）
  const riskScore = ((scores.lifecycle_visibility + scores.volatility_control + scores.cashflow_reliability + (10 - scores.reputation_sensitivity)) / 4).toFixed(1);

  // 总体资产质量评级
  const overallScore = (
    parseFloat(returnScore) * 0.35 +
    parseFloat(controlScore) * 0.25 +
    parseFloat(profitScore) * 0.2 +
    parseFloat(riskScore) * 0.2
  ).toFixed(1);

  const qualityGrade = getAssetGrade(parseFloat(overallScore));

  return `
    <div class="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
      <!-- 头部 -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-chart-radar text-white text-sm" style="font-family:inherit">⬡</i>
            </div>
            <div>
              <h3 class="text-white font-bold text-lg">资产端综合评估雷达图</h3>
              <p class="text-indigo-200 text-xs">基于筛子评分 · 投流赛道专用模型</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-white text-3xl font-bold">${overallScore}</div>
            <div class="text-indigo-200 text-xs">综合评分（满10分）</div>
            <div class="mt-1 inline-block px-2 py-0.5 rounded text-xs font-bold ${qualityGrade.bgClass} ${qualityGrade.textClass}">
              ${qualityGrade.label}
            </div>
          </div>
        </div>
      </div>

      <div class="p-6">
        <!-- 雷达图主体 -->
        <div class="flex flex-col lg:flex-row gap-6 items-start">
          
          <!-- Canvas 区域 -->
          <div class="flex-shrink-0 mx-auto lg:mx-0">
            <div class="relative" style="width:420px;height:420px">
              <canvas id="${canvasId}" style="display:block"></canvas>
              <!-- 四象限角落标签 -->
              <div class="absolute top-2 right-8 text-right">
                <div class="text-xs font-bold text-blue-600">回报</div>
                <div class="text-xs text-blue-400">Return</div>
              </div>
              <div class="absolute bottom-2 right-8 text-right">
                <div class="text-xs font-bold text-purple-600">管控够不够</div>
              </div>
              <div class="absolute bottom-2 left-8">
                <div class="text-xs font-bold text-green-600">收益够不够</div>
              </div>
              <div class="absolute top-2 left-8">
                <div class="text-xs font-bold text-red-600">风险</div>
                <div class="text-xs text-red-400">Risk</div>
              </div>
            </div>
          </div>

          <!-- 右侧：象限得分 + 指标明细 -->
          <div class="flex-1 min-w-0 w-full">
            
            <!-- 四象限得分卡 -->
            <div class="grid grid-cols-2 gap-3 mb-5">
              <div class="rounded-lg p-3 bg-blue-50 border border-blue-200">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span class="text-xs font-bold text-blue-700">回报 Return</span>
                </div>
                <div class="text-2xl font-bold text-blue-600">${returnScore}<span class="text-sm text-blue-400">/10</span></div>
                <div class="text-xs text-blue-500 mt-1">回报强度 · 回报质量</div>
              </div>
              
              <div class="rounded-lg p-3 bg-purple-50 border border-purple-200">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span class="text-xs font-bold text-purple-700">管控够不够</span>
                </div>
                <div class="text-2xl font-bold text-purple-600">${controlScore}<span class="text-sm text-purple-400">/10</span></div>
                <div class="text-xs text-purple-500 mt-1">名声 · Leverage · 结算</div>
              </div>
              
              <div class="rounded-lg p-3 bg-green-50 border border-green-200">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded-full bg-green-500"></div>
                  <span class="text-xs font-bold text-green-700">收益够不够</span>
                </div>
                <div class="text-2xl font-bold text-green-600">${profitScore}<span class="text-sm text-green-400">/10</span></div>
                <div class="text-xs text-green-500 mt-1">生意的利润率</div>
              </div>
              
              <div class="rounded-lg p-3 bg-red-50 border border-red-200">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded-full bg-red-500"></div>
                  <span class="text-xs font-bold text-red-700">风险 Risk</span>
                </div>
                <div class="text-2xl font-bold text-red-600">${riskScore}<span class="text-sm text-red-400">/10</span></div>
                <div class="text-xs text-red-500 mt-1">生命周期 · 波动 · 现金流</div>
              </div>
            </div>

            <!-- 9个维度明细 -->
            <div class="space-y-1.5">
              <div class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">各维度详情</div>
              ${RADAR_DIMENSIONS.map(dim => {
                const score = scores[dim.key] || 0;
                const pct = Math.round(score / 10 * 100);
                const barColor = {
                  'return': 'bg-blue-400',
                  'control': 'bg-purple-400',
                  'profit': 'bg-green-400',
                  'risk': 'bg-red-400'
                }[dim.quadrant];
                const bgColor = {
                  'return': 'bg-blue-50',
                  'control': 'bg-purple-50',
                  'profit': 'bg-green-50',
                  'risk': 'bg-red-50'
                }[dim.quadrant];
                return `
                  <div class="${bgColor} rounded-lg px-3 py-2">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-medium text-gray-700">${dim.label}</span>
                      <span class="text-xs font-bold" style="color:${dim.color}">${score.toFixed(1)}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                      <div class="${barColor} rounded-full h-1.5 transition-all" style="width:${pct}%"></div>
                    </div>
                    <div class="text-xs text-gray-400 mt-0.5">${dim.description}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- 底部说明 -->
        <div class="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <i class="fas fa-info-circle mr-1 text-indigo-400"></i>
          <strong>雷达图说明：</strong>
          雷达图基于筛子四项指标（净ROI/结算ROI/结算率/历史消耗）结合品类特性自动计算。
          <span class="text-red-500">名声敏感度越高代表品类合规风险越大</span>，其余维度均为正向（越高越优）。
          综合评分 = 回报35% + 管控25% + 收益20% + 风险稳健性20%。
        </div>
      </div>
    </div>
  `;
}

/**
 * 获取资产质量评级
 */
function getAssetGrade(score) {
  if (score >= 8) return { label: 'A+ 优质资产', bgClass: 'bg-green-100', textClass: 'text-green-800' };
  if (score >= 7) return { label: 'A 良好资产', bgClass: 'bg-blue-100', textClass: 'text-blue-800' };
  if (score >= 6) return { label: 'B+ 合格资产', bgClass: 'bg-indigo-100', textClass: 'text-indigo-800' };
  if (score >= 5) return { label: 'B 基础资产', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' };
  if (score >= 4) return { label: 'C 待观察', bgClass: 'bg-orange-100', textClass: 'text-orange-800' };
  return { label: 'D 高风险', bgClass: 'bg-red-100', textClass: 'text-red-800' };
}

/**
 * 渲染雷达图到页面（调用此函数触发Canvas绘制）
 * @param {string} canvasId
 * @param {Object} scoring
 * @param {Object} volatilityData
 * @param {string} mainCategory
 */
function renderRadarChart(canvasId, scoring, volatilityData, mainCategory) {
  const scores = computeRadarScores(scoring, volatilityData, mainCategory);
  
  // 延迟一帧确保 Canvas 已挂载到 DOM
  requestAnimationFrame(() => {
    drawAssetRadarChart(canvasId, scores, { size: 420 });
    
    // 在Canvas内部补绘象限大标签
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const cx = 420 / 2;
      const cy = 420 / 2;
      const maxR = 420 * 0.36;
      ctx.save();
      ctx.scale(dpr, dpr);
      // 恢复scale会影响坐标，直接在原ctx上用像素坐标
      ctx.restore();
    }
  });
}

// ==================== 主入口：insertRadarChart ====================
/**
 * 将雷达图插入到指定容器（供 app.js 调用）
 * @param {string} containerId - 容器div的ID（如 'radar-chart-container-5'）
 * @param {Object} radarData  - { net_roi, settle_roi, settle_rate, history_spend,
 *                               daily_revenue_volatility, sieve_score, main_category }
 * @param {Object} scoreDetails - 筛子评分详细对象（含 details 数组 和 revenue_stats）
 */
window.insertRadarChart = function(containerId, radarData, scoreDetails) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[RadarChart] 容器未找到:', containerId);
    return;
  }

  // 构建 scoring 对象（sieve-frontend 格式）
  const scoring = buildScoringObject(radarData, scoreDetails);
  
  // 构建波动率数据
  const volatilityData = scoreDetails?.revenue_stats
    ? { volatility_rate: scoreDetails.revenue_stats.volatility || 0 }
    : (radarData.daily_revenue_volatility > 0
        ? { volatility_rate: radarData.daily_revenue_volatility / 100 }
        : null);

  const mainCategory = radarData.main_category || '';
  
  // 生成唯一canvas ID
  const canvasId = `radar-canvas-${containerId}-${Date.now()}`;

  // 生成HTML并插入
  container.innerHTML = generateRadarChartHTML(scoring, volatilityData, mainCategory, canvasId);

  // 触发Canvas绘制（需等待DOM更新）
  requestAnimationFrame(() => {
    const scores = computeRadarScores(scoring, volatilityData, mainCategory);
    drawAssetRadarChart(canvasId, scores, { size: 420 });
  });
};

/**
 * 将 app.js 传来的 radarData + scoreDetails 转成 scoring 格式
 */
function buildScoringObject(radarData, scoreDetails) {
  // 如果 scoreDetails 有 details 数组，直接使用
  if (scoreDetails && scoreDetails.details && scoreDetails.details.length > 0) {
    return {
      total_score: radarData.sieve_score || scoreDetails.total_score || 0,
      details: scoreDetails.details,
      threshold_level: scoreDetails.threshold_level || '品类'
    };
  }

  // 否则根据 radarData 原始字段构建模拟 details
  const details = [];

  if (radarData.net_roi != null) {
    details.push({
      field_key: 'net_roi',
      field_name: '净成交ROI',
      actual_value: radarData.net_roi,
      actual_display: `${(radarData.net_roi * 100).toFixed(0)}%`,
      threshold_display: '',
      uplift: Math.max(0, radarData.net_roi - 1.6) / 1.6,
      base_score: Math.min(100, upliftToScore(Math.max(0, radarData.net_roi - 1.6) / 1.6, { zeroBase: 30, k: 3.5 })),
      sub_score: 0,
      weight: 0.20
    });
  }

  if (radarData.settle_roi != null) {
    details.push({
      field_key: 'settle_roi',
      field_name: '14日结算ROI',
      actual_value: radarData.settle_roi,
      actual_display: `${(radarData.settle_roi * 100).toFixed(0)}%`,
      threshold_display: '',
      uplift: Math.max(0, radarData.settle_roi - 1.47) / 1.47,
      base_score: Math.min(100, upliftToScore(Math.max(0, radarData.settle_roi - 1.47) / 1.47, { zeroBase: 30, k: 4.0 })),
      sub_score: 0,
      weight: 0.35
    });
  }

  if (radarData.settle_rate != null) {
    details.push({
      field_key: 'settle_rate',
      field_name: '14日订单结算率',
      actual_value: radarData.settle_rate,
      actual_display: `${(radarData.settle_rate * 100).toFixed(0)}%`,
      threshold_display: '',
      uplift: Math.max(0, radarData.settle_rate - 0.79) / 0.79,
      base_score: Math.min(100, upliftToScore(Math.max(0, radarData.settle_rate - 0.79) / 0.79, { zeroBase: 30, k: 4.5 })),
      sub_score: 0,
      weight: 0.30
    });
  }

  if (radarData.history_spend != null) {
    details.push({
      field_key: 'history_spend',
      field_name: '历史消耗金额',
      actual_value: radarData.history_spend,
      actual_display: `¥${radarData.history_spend.toLocaleString()}`,
      threshold_display: '',
      uplift: Math.max(0, radarData.history_spend - 100000) / 100000,
      base_score: Math.min(100, upliftToScore(Math.max(0, radarData.history_spend - 100000) / 100000, { zeroBase: 20, k: 2.5 })),
      sub_score: 0,
      weight: 0.15
    });
  }

  return {
    total_score: radarData.sieve_score || 0,
    details,
    threshold_level: '默认'
  };
}

// 导出全局
window.generateRadarChartHTML = generateRadarChartHTML;
window.renderRadarChart = renderRadarChart;
window.computeRadarScores = computeRadarScores;
window.buildScoringObject = buildScoringObject;
window.RADAR_DIMENSIONS = RADAR_DIMENSIONS;
