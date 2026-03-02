// 筛子评分算法实现（方案A：回款安全优先）
// src/scoring-sieve.ts

export interface ScoringRule {
  weight_net_roi: number
  weight_settle_roi: number
  weight_settle_rate: number
  weight_history_spend: number
  k_net_roi: number
  k_settle_roi: number
  k_settle_rate: number
  k_history_spend: number
}

export interface ThresholdValues {
  net_roi_min: number
  settle_roi_min: number
  settle_rate_min: number
  history_spend_min: number
}

export interface ActualValues {
  net_roi: number
  settle_roi: number
  settle_rate: number
  history_spend: number
}

export interface ScoringResult {
  total_score: number
  
  net_roi_score: number
  net_roi_uplift: number
  
  settle_roi_score: number
  settle_roi_uplift: number
  
  settle_rate_score: number
  settle_rate_uplift: number
  
  history_spend_score: number
  history_spend_uplift: number
  
  details: string
}

/**
 * 计算提升幅度（标准化）
 */
function calculateUplift(
  actual: number,
  threshold: number,
  type: 'ratio' | 'settle_rate' | 'spend'
): number {
  if (type === 'ratio') {
    // ROI类：u = max(0, actual/min - 1)
    return Math.max(0, actual / threshold - 1)
  } else if (type === 'settle_rate') {
    // 结算率：u = max(0, (actual-min)/(1-min))
    return Math.max(0, (actual - threshold) / (1 - threshold))
  } else {
    // 历史消耗额：u = max(0, log10(actual/min))
    if (actual <= threshold) return 0
    return Math.log10(actual / threshold)
  }
}

/**
 * 边际递减子分映射（0-100）
 * Score(u, k) = 100 * (1 - exp(-k * u))
 */
function calculateSubScore(uplift: number, k: number): number {
  return 100 * (1 - Math.exp(-k * uplift))
}

/**
 * 筛子评分主函数
 */
export function calculateSieveScore(
  actual: ActualValues,
  thresholds: ThresholdValues,
  rule: ScoringRule
): ScoringResult {
  // 1. 计算提升幅度
  const u_net = calculateUplift(actual.net_roi, thresholds.net_roi_min, 'ratio')
  const u_settle = calculateUplift(actual.settle_roi, thresholds.settle_roi_min, 'ratio')
  const u_sr = calculateUplift(actual.settle_rate, thresholds.settle_rate_min, 'settle_rate')
  const u_spend = calculateUplift(actual.history_spend, thresholds.history_spend_min, 'spend')
  
  // 2. 计算子分（0-100）
  const s_net = calculateSubScore(u_net, rule.k_net_roi)
  const s_settle = calculateSubScore(u_settle, rule.k_settle_roi)
  const s_sr = calculateSubScore(u_sr, rule.k_settle_rate)
  const s_spend = calculateSubScore(u_spend, rule.k_history_spend)
  
  // 3. 加权总分（方案A权重：20%, 35%, 30%, 15%）
  const totalScore = 
    (rule.weight_net_roi / 100) * s_net +
    (rule.weight_settle_roi / 100) * s_settle +
    (rule.weight_settle_rate / 100) * s_sr +
    (rule.weight_history_spend / 100) * s_spend
  
  // 4. 生成详细说明
  const details = `
    评分详情（方案A-回款安全优先）：
    
    1. 净成交ROI：
       - 实际值: ${actual.net_roi.toFixed(2)}
       - 阈值: ${thresholds.net_roi_min.toFixed(2)}
       - 提升幅度: ${(u_net * 100).toFixed(1)}%
       - 子分: ${s_net.toFixed(1)}
       - 权重: ${rule.weight_net_roi}%
       - 加权得分: ${((rule.weight_net_roi / 100) * s_net).toFixed(1)}
    
    2. 14日结算ROI：
       - 实际值: ${actual.settle_roi.toFixed(2)}
       - 阈值: ${thresholds.settle_roi_min.toFixed(2)}
       - 提升幅度: ${(u_settle * 100).toFixed(1)}%
       - 子分: ${s_settle.toFixed(1)}
       - 权重: ${rule.weight_settle_roi}%
       - 加权得分: ${((rule.weight_settle_roi / 100) * s_settle).toFixed(1)}
    
    3. 14日订单结算率：
       - 实际值: ${(actual.settle_rate * 100).toFixed(1)}%
       - 阈值: ${(thresholds.settle_rate_min * 100).toFixed(1)}%
       - 剩余空间提升: ${(u_sr * 100).toFixed(1)}%
       - 子分: ${s_sr.toFixed(1)}
       - 权重: ${rule.weight_settle_rate}%
       - 加权得分: ${((rule.weight_settle_rate / 100) * s_sr).toFixed(1)}
    
    4. 历史消耗额：
       - 实际值: ${actual.history_spend}元
       - 阈值: ${thresholds.history_spend_min}元
       - 对数提升: ${u_spend.toFixed(2)}
       - 子分: ${s_spend.toFixed(1)}
       - 权重: ${rule.weight_history_spend}%
       - 加权得分: ${((rule.weight_history_spend / 100) * s_spend).toFixed(1)}
    
    总分: ${totalScore.toFixed(1)} / 100
  `
  
  return {
    total_score: Math.round(totalScore * 10) / 10, // 保留1位小数
    
    net_roi_score: Math.round(s_net * 10) / 10,
    net_roi_uplift: Math.round(u_net * 1000) / 1000,
    
    settle_roi_score: Math.round(s_settle * 10) / 10,
    settle_roi_uplift: Math.round(u_settle * 1000) / 1000,
    
    settle_rate_score: Math.round(s_sr * 10) / 10,
    settle_rate_uplift: Math.round(u_sr * 1000) / 1000,
    
    history_spend_score: Math.round(s_spend * 10) / 10,
    history_spend_uplift: Math.round(u_spend * 1000) / 1000,
    
    details: details.trim()
  }
}

/**
 * 默认评分规则（方案A）
 */
export const DEFAULT_SCORING_RULE: ScoringRule = {
  weight_net_roi: 20,
  weight_settle_roi: 35,
  weight_settle_rate: 30,
  weight_history_spend: 15,
  k_net_roi: 3,
  k_settle_roi: 4,
  k_settle_rate: 4,
  k_history_spend: 1.5
}
