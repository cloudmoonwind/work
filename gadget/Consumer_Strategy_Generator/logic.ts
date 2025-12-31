
import { TableConfig, TableResult, RowData } from './types.ts';

/**
 * 非对称正态分布密度函数
 */
function skewedGaussian(x: number, mean: number, sigmaLeft: number, sigmaRight: number): number {
  const sigma = x < mean ? sigmaLeft : sigmaRight;
  return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)));
}

/**
 * 检查序列是否满足严格单峰分布
 */
function isUnimodal(values: number[], peakIdx: number): boolean {
  for (let i = 1; i <= peakIdx; i++) {
    if (values[i] < values[i - 1]) return false;
  }
  for (let i = peakIdx + 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) return false;
  }
  return true;
}

/**
 * 核心优化函数：寻找满足单峰、期望值精准、峰值在 [25, 50] 之间的整数解
 */
function adjustToUnimodal(
  colNames: number[],
  targetExpectation: number,
  targetSum: number = 100
): number[] {
  const n = colNames.length;
  let bestValues: number[] = [];
  let minGlobalErr = Infinity;

  // 1. 随机化尝试：为了打破一致性，我们尝试多种随机风格并选出最优解
  const attempts = 5;
  for (let a = 0; a < attempts; a++) {
    // 目标峰值高度在 [25, 50] 之间，对应的 sigma 范围大约在 [0.8, 1.6]
    // 随机一个基础 sigma
    const baseSigma = 0.8 + Math.random() * 0.8;
    // 随机一个偏斜因子 [0.7, 1.4]
    const skew = 0.7 + Math.random() * 0.7;
    const sigmaLeft = baseSigma * skew;
    const sigmaRight = baseSigma / skew;

    let peakIdx = 0;
    let minDist = Math.abs(colNames[0] - targetExpectation);
    for (let i = 1; i < n; i++) {
      const d = Math.abs(colNames[i] - targetExpectation);
      if (d < minDist) {
        minDist = d;
        peakIdx = i;
      }
    }

    let rawProbs = colNames.map(c => skewedGaussian(c, targetExpectation, sigmaLeft, sigmaRight));
    const sumRaw = rawProbs.reduce((acc, b) => acc + b, 0);
    let values = rawProbs.map(p => Math.round((p / sumRaw) * targetSum));

    // 强制单峰修正
    for (let i = 1; i <= peakIdx; i++) if (values[i] < values[i - 1]) values[i] = values[i - 1];
    for (let i = peakIdx + 1; i < n; i++) if (values[i] > values[i - 1]) values[i] = values[i - 1];

    // 凑齐总和
    let iter = 200;
    while (values.reduce((s, v) => s + v, 0) !== targetSum && iter-- > 0) {
      const diff = targetSum - values.reduce((s, v) => s + v, 0);
      const step = diff > 0 ? 1 : -1;
      let bestIdx = -1;
      let minErr = Infinity;
      for (let i = 0; i < n; i++) {
        if (step === -1 && values[i] <= 0) continue;
        values[i] += step;
        if (isUnimodal(values, peakIdx)) {
          const m = values.reduce((s, v, idx) => s + v * colNames[idx], 0) / targetSum;
          const e = Math.abs(m - targetExpectation);
          if (e < minErr) { minErr = e; bestIdx = i; }
        }
        values[i] -= step;
      }
      if (bestIdx !== -1) values[bestIdx] += step;
      else values[peakIdx] += step;
    }

    // 终极搬运优化：同时优化期望值和峰值约束
    iter = 300;
    while (iter-- > 0) {
      const currentWS = values.reduce((s, v, i) => s + v * colNames[i], 0);
      const currentM = currentWS / targetSum;
      const currentPeak = Math.max(...values);
      
      let bestMove = { from: -1, to: -1, score: -Infinity };
      
      for (let i = 0; i < n; i++) {
        if (values[i] <= 0) continue;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          values[i]--; values[j]++;
          if (isUnimodal(values, peakIdx)) {
            const nextM = (currentWS - colNames[i] + colNames[j]) / targetSum;
            const nextPeak = Math.max(...values);
            
            // 评分机制：优先让期望值更准，同时惩罚超出 [25, 50] 的峰值
            const mImprovement = Math.abs(currentM - targetExpectation) - Math.abs(nextM - targetExpectation);
            
            let peakScore = 0;
            // 如果当前峰值不在范围内，增加对范围内移动的巨大奖励
            if (nextPeak >= 25 && nextPeak <= 50) peakScore += 0.5;
            if (currentPeak < 25 && nextPeak > currentPeak) peakScore += 0.3;
            if (currentPeak > 50 && nextPeak < currentPeak) peakScore += 0.3;

            const totalScore = mImprovement + peakScore;
            if (totalScore > bestMove.score) {
              bestMove = { from: i, to: j, score: totalScore };
            }
          }
          values[i]++; values[j]--;
        }
      }
      if (bestMove.from !== -1 && bestMove.score > 0) {
        values[bestMove.from]--;
        values[bestMove.to]++;
      } else break;
    }

    const finalM = values.reduce((s, v, i) => s + v * colNames[i], 0) / targetSum;
    const finalPeak = Math.max(...values);
    // 全局评价分：期望误差 + 峰值违规惩罚
    let globalErr = Math.abs(finalM - targetExpectation);
    if (finalPeak < 25 || finalPeak > 50) globalErr += 10; 

    if (globalErr < minGlobalErr) {
      minGlobalErr = globalErr;
      bestValues = [...values];
    }
  }

  return bestValues;
}

export function generateTable(config: TableConfig): TableResult {
  const { firstRowExpectation, minCol, maxCol, maxDiff } = config;
  const colNames = Array.from({ length: maxCol - minCol + 1 }, (_, i) => minCol + i);
  const rows: RowData[] = [];
  const expectations = new Array(16);

  // 1. 设置目标期望值路径
  expectations[0] = firstRowExpectation;
  expectations[1] = firstRowExpectation + 0.8;
  // 第三行强制设置，满足 0.1-0.3 差值要求
  expectations[2] = firstRowExpectation - 0.2;

  const targetMinExp = expectations[1] - maxDiff;
  const decaySteps = 13;
  const totalDecay = expectations[2] - targetMinExp;
  const stepSize = totalDecay / decaySteps;

  for (let i = 3; i < 16; i++) {
    const jitter = (Math.random() - 0.5) * 0.05;
    expectations[i] = expectations[i - 1] - (stepSize + jitter);
  }

  // 2. 生成行数据
  for (let r = 0; r < 16; r++) {
    const targetE = expectations[r];
    const finalValues = adjustToUnimodal(colNames, targetE);

    const valuesMap: Record<number, number> = {};
    let ws = 0;
    finalValues.forEach((v, i) => {
      valuesMap[colNames[i]] = v;
      ws += v * colNames[i];
    });

    rows.push({
      rowIndex: r + 1,
      targetExpectation: targetE,
      actualExpectation: ws / 100,
      values: valuesMap,
      sum: 100
    });
  }

  return { columns: colNames, rows };
}
