const actualValues = {
  net_roi: 1.6,
  settle_roi: 1.47,
  settle_rate: 0.79,
  history_spend: 100000
};

const thresholds = {
  net_roi_min: 1.6,
  settle_roi_min: 1.47,
  settle_rate_min: 0.79,
  history_spend_min: 100000
};

// 计算uplift
function calculateUplift(actual, threshold, type) {
  if (type === 'ratio') {
    return Math.max(0, actual / threshold - 1);
  } else if (type === 'settle_rate') {
    return Math.max(0, (actual - threshold) / (1 - threshold));
  } else {
    if (actual <= threshold) return 0;
    return Math.log10(actual / threshold);
  }
}

// 计算子分 (新算法: 60 + 40 * (1 - exp(-k * u)))
function calculateSubScore(uplift, k) {
  const baseScore = 60;
  const extraScore = 40 * (1 - Math.exp(-k * uplift));
  return baseScore + extraScore;
}

const u_net = calculateUplift(actualValues.net_roi, thresholds.net_roi_min, 'ratio');
const u_settle = calculateUplift(actualValues.settle_roi, thresholds.settle_roi_min, 'ratio');
const u_sr = calculateUplift(actualValues.settle_rate, thresholds.settle_rate_min, 'settle_rate');
const u_spend = calculateUplift(actualValues.history_spend, thresholds.history_spend_min, 'spend');

console.log('Uplifts:', { u_net, u_settle, u_sr, u_spend });

const s_net = calculateSubScore(u_net, 3.0);
const s_settle = calculateSubScore(u_settle, 4.0);
const s_sr = calculateSubScore(u_sr, 4.0);
const s_spend = calculateSubScore(u_spend, 1.5);

console.log('Sub scores:', { s_net, s_settle, s_sr, s_spend });

const totalScore = 0.20 * s_net + 0.35 * s_settle + 0.30 * s_sr + 0.15 * s_spend;

console.log('Total score:', totalScore);
