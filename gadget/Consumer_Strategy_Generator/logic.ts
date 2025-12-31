
import { TableConfig, TableResult, RowData } from './types.ts';

/**
 * 基础正态分布密度函数
 */
function gaussian(x: number, mean: number, sigma: number): number {
  return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)));
}

/**
 * 检查序列是否满足严格单峰分布（中间高两边低）
 */
function isUnimodal(values: number[], peakIdx: number): boolean {
  // 左侧非递减
  for (let i = 1; i <= peakIdx; i++) {
    if (values[i] < values[i - 1]) return false;
  }
  // 右侧非递增
  for (let i = peakIdx + 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) return false;
  }
  return true;
}

/**
 * 寻找最接近目标的单峰分布。
 * 增加了搜索深度和备选峰值检查，以确保在满足“中间高”的前提下，期望值尽可能精确。
 */
function adjustToUnimodal(
  colNames: number[],
  targetExpectation: number,
  targetSum: number = 100
): number[] {
  const n = colNames.length;
  
  // 备选方案：尝试在目标期望附近的多个列作为峰值中心进行搜索
  let bestValues: number[] = [];
  let minGlobalErr = Infinity;

  // 尝试不同的 Sigma 值来获得不同的分布宽度，以寻找最匹配期望的整数解
  const sigmas = [1.2, 1.5, 1.8];
  
  for (const sigma of sigmas) {
    // 自动确定最合理的峰值索引
    let peakIdx = 0;
    let minDist = Math.abs(colNames[0] - targetExpectation);
    for (let i = 1; i < n; i++) {
      const d = Math.abs(colNames[i] - targetExpectation);
      if (d < minDist) {
        minDist = d;
        peakIdx = i;
      }
    }

    let rawProbs = colNames.map(c => gaussian(c, targetExpectation, sigma));
    const sumRaw = rawProbs.reduce((a, b) => a + b, 0);
    let values = rawProbs.map(p => Math.round((p / sumRaw) * targetSum));

    // 初始强制单峰修正
    for (let i = 1; i <= peakIdx; i++) {
      if (values[i] < values[i - 1]) values[i] = values[i - 1];
    }
    for (let i = peakIdx + 1; i < n; i++) {
      if (values[i] > values[i - 1]) values[i] = values[i - 1];
    }

    // 凑齐总和
    let iter = 200;
    while (values.reduce((a, b) => a + b, 0) !== targetSum && iter-- > 0) {
      const currentSum = values.reduce((a, b) => a + b, 0);
      const diff = targetSum - currentSum;
      const step = diff > 0 ? 1 : -1;
      let bestAdjustIdx = -1;
      let minAdjustErr = Infinity;

      for (let i = 0; i < n; i++) {
        if (step === -1 && values[i] <= 0) continue;
        values[i] += step;
        if (isUnimodal(values, peakIdx)) {
          const m = values.reduce((s, v, idx) => s + v * colNames[idx], 0) / targetSum;
          const e = Math.abs(m - targetExpectation);
          if (e < minAdjustErr) {
            minAdjustErr = e;
            bestAdjustIdx = i;
          }
        }
        values[i] -= step;
      }
      if (bestAdjustIdx !== -1) values[bestAdjustIdx] += step;
      else values[peakIdx] += step;
    }

    // 微调期望值 (搬运优化)
    iter = 150;
    while (iter-- > 0) {
      const currentWS = values.reduce((s, v, i) => s + v * colNames[i], 0);
      const currentM = currentWS / targetSum;
      if (Math.abs(currentM - targetExpectation) < 0.001) break;

      let bestMove = { from: -1, to: -1, score: 0 };
      for (let i = 0; i < n; i++) {
        if (values[i] <= 0) continue;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          values[i]--; values[j]++;
          if (isUnimodal(values, peakIdx)) {
            const nextM = (currentWS - colNames[i] + colNames[j]) / targetSum;
            const imp = Math.abs(currentM - targetExpectation) - Math.abs(nextM - targetExpectation);
            if (imp > bestMove.score) {
              bestMove = { from: i, to: j, score: imp };
            }
          }
          values[i]++; values[j]--;
        }
      }
      if (bestMove.from !== -1) {
        values[bestMove.from]--;
        values[bestMove.to]++;
      } else break;
    }

    const finalM = values.reduce((s, v, i) => s + v * colNames[i], 0) / targetSum;
    const finalErr = Math.abs(finalM - targetExpectation);
    if (finalErr < minGlobalErr) {
      minGlobalErr = finalErr;
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
  // 第三行目标：比第一行低 0.2（处于 0.1-0.3 范围内）
  expectations[2] = firstRowExpectation - 0.2;

  // 最终行目标：最大期望(E2) - maxDiff
  const targetMinExp = expectations[1] - maxDiff;
  const decaySteps = 13; // 从第3行到第16行
  const totalDecay = expectations[2] - targetMinExp;
  const stepSize = totalDecay / decaySteps;

  for (let i = 3; i < 16; i++) {
    // 引入微小随机抖动保持动态感，但严格控制步长
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
