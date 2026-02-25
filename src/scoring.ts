// 智能评分算法

export interface ScoringCriteria {
  roi: number;
  returnRate: number;
  profitRate: number;
  shopScore: number;
  operationMonths: number;
}

export const CATEGORY_CRITERIA: Record<string, ScoringCriteria> = {
  '女装': { roi: 1.8, returnRate: 35, profitRate: 15, shopScore: 3.5, operationMonths: 6 },
  '男装': { roi: 1.6, returnRate: 25, profitRate: 18, shopScore: 3.5, operationMonths: 6 },
  '美妆': { roi: 2.0, returnRate: 30, profitRate: 20, shopScore: 3.5, operationMonths: 6 },
  '食品': { roi: 1.5, returnRate: 15, profitRate: 12, shopScore: 3.5, operationMonths: 6 },
  '日用品': { roi: 1.4, returnRate: 20, profitRate: 10, shopScore: 3.5, operationMonths: 6 },
  '母婴': { roi: 2.0, returnRate: 25, profitRate: 18, shopScore: 3.5, operationMonths: 6 },
  '家电': { roi: 1.3, returnRate: 10, profitRate: 8, shopScore: 3.5, operationMonths: 6 },
  '家居': { roi: 1.5, returnRate: 15, profitRate: 12, shopScore: 3.5, operationMonths: 6 },
  '药品': { roi: 1.8, returnRate: 5, profitRate: 25, shopScore: 3.5, operationMonths: 6 }
};

export interface ScoringResult {
  roiScore: number;
  returnRateScore: number;
  profitScore: number;
  shopScoreValue: number;
  operationScore: number;
  totalScore: number;
  passed: boolean;
  roiPassed: boolean;
  returnRatePassed: boolean;
  profitPassed: boolean;
  evaluationSuggestion: string;
}

export function calculateScore(
  category: string,
  roi: number,
  returnRate: number,
  profitRate: number,
  shopScore: number,
  operationMonths: number
): ScoringResult {
  const criteria = CATEGORY_CRITERIA[category];
  
  if (!criteria) {
    throw new Error(`未知品类: ${category}`);
  }

  // 1. ROI评分 (25分)
  const roiPassed = roi >= criteria.roi;
  const roiScore = roiPassed ? 25 : 0;

  // 2. 退货率评分 (25分)
  const returnRatePassed = returnRate <= criteria.returnRate;
  const returnRateScore = returnRatePassed ? 25 : 0;

  // 3. 净利润评分 (25分)
  const profitPassed = profitRate >= criteria.profitRate;
  const profitScore = profitPassed ? 25 : 0;

  // 4. 店铺评分 (12.5分)
  let shopScoreValue = 0;
  if (shopScore >= 4.5) {
    shopScoreValue = 12.5;
  } else if (shopScore >= 4.0) {
    shopScoreValue = 10;
  } else if (shopScore >= 3.5) {
    shopScoreValue = 7.5;
  } else {
    shopScoreValue = 0;
  }

  // 5. 运营时间评分 (12.5分)
  let operationScore = 0;
  if (operationMonths >= 12) {
    operationScore = 12.5;
  } else if (operationMonths >= 6) {
    operationScore = 7.5;
  } else {
    operationScore = 0;
  }

  // 总分
  const totalScore = roiScore + returnRateScore + profitScore + shopScoreValue + operationScore;
  const passed = totalScore >= 60;

  // 评估建议
  let suggestion = '';
  if (passed) {
    suggestion = '该项目各项指标表现良好，达到投资标准，建议通过审批。';
  } else {
    const issues = [];
    if (!roiPassed) issues.push(`ROI未达标（当前${roi}%，标准≥${criteria.roi}%）`);
    if (!returnRatePassed) issues.push(`退货率过高（当前${returnRate}%，标准≤${criteria.returnRate}%）`);
    if (!profitPassed) issues.push(`净利润率不足（当前${profitRate}%，标准≥${criteria.profitRate}%）`);
    if (shopScore < 3.5) issues.push(`店铺评分过低（当前${shopScore}分，标准≥3.5分）`);
    if (operationMonths < 6) issues.push(`运营时间不足（当前${operationMonths}个月，标准≥6个月）`);
    
    suggestion = `该项目存在以下问题：${issues.join('；')}。建议进一步评估或拒绝投资。`;
  }

  return {
    roiScore,
    returnRateScore,
    profitScore,
    shopScoreValue,
    operationScore,
    totalScore,
    passed,
    roiPassed,
    returnRatePassed,
    profitPassed,
    evaluationSuggestion: suggestion
  };
}
