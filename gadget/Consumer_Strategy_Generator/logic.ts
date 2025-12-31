
import { TableConfig, TableResult, RowData } from './types.ts';

/**
 * 基础正态分布密度函数
 */
function gaussian(x: number, mean: number, sigma: number): number {
  return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)));
}

/**
 * 检查序列是否满足单峰分布（中间高两边低）
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
 * 核心调整函数：在保持单峰形态的前提下，调整总和为100并逼近目标期望
 */
function adjustToUnimodal(
  colNames: number[],
  targetExpectation: number,
  targetSum: number = 100
): number[] {
  const n = colNames.length;
  let peakIdx = 0;
  let minDist = Math.abs(colNames[0] - targetExpectation);
  for (let i = 1; i < n; i++) {
    const d = Math.abs(colNames[i] - targetExpectation);
    if (d < minDist) {
      minDist = d;
      peakIdx = i;
    }
  }

  const sigma = 1.5; 
  let rawProbs = colNames.map(c => gaussian(c, targetExpectation, sigma));
  const sumRaw = rawProbs.reduce((a, b) => a + b, 0);
  let values = rawProbs.map(p => Math.round((p / sumRaw) * targetSum));

  for (let i = 1; i <= peakIdx; i++) {
    if (values[i] < values[i - 1]) values[i] = values[i - 1];
  }
  for (let i = peakIdx + 1; i < n; i++) {
    if (values[i] > values[i - 1]) values[i] = values[i - 1];
  }

  let iterLimit = 200;
  while (values.reduce((a, b) => a + b, 0) !== targetSum && iterLimit-- > 0) {
    const currentSum = values.reduce((a, b) => a + b, 0);
    const diff = targetSum - currentSum;
    const step = diff > 0 ? 1 : -1;

    let bestIdx = -1;
    let minErr = Infinity;

    for (let i = 0; i < n; i++) {
      if (step === -1 && values[i] <= 0) continue;
      values[i] += step;
      if (isUnimodal(values, peakIdx)) {
        const currentMean = values.reduce((s, v, idx) => s + v * colNames[idx], 0) / targetSum;
        const err = Math.abs(currentMean - targetExpectation);
        if (err < minErr) {
          minErr = err;
          bestIdx = i;
        }
      }
      values[i] -= step;
    }

    if (bestIdx !== -1) {
      values[bestIdx] += step;
    } else {
      values[peakIdx] += step;
    }
  }

  iterLimit = 100;
  while (iterLimit-- > 0) {
    const currentWS = values.reduce((s, v, i) => s + v * colNames[i], 0);
    const currentMean = currentWS / targetSum;
    if (Math.abs(currentMean - targetExpectation) < 0.01) break;

    let bestMove = { from: -1, to: -1, score: 0 };
    for (let i = 0; i < n; i++) {
      if (values[i] <= 0) continue;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        values[i]--;
        values[j]++;
        if (isUnimodal(values, peakIdx)) {
          const newMean = (currentWS - colNames[i] + colNames[j]) / targetSum;
          const improvement = Math.abs(currentMean - targetExpectation) - Math.abs(newMean - targetExpectation);
          if (improvement > bestMove.score) {
            bestMove = { from: i, to: j, score: improvement };
          }
        }
        values[i]++;
        values[j]--;
      }
    }
    if (bestMove.from !== -1) {
      values[bestMove.from]--;
      values[bestMove.to]++;
    } else break;
  }
  return values;
}

export function generateTable(config: TableConfig): TableResult {
  const { firstRowExpectation, minCol, maxCol, maxDiff } = config;
  const colNames = Array.from({ length: maxCol - minCol + 1 }, (_, i) => minCol + i);
  const rows: RowData[] = [];
  const expectations = new Array(16);

  // 1. 构建期望值序列
  // 第一行
  expectations[0] = firstRowExpectation;
  // 第二行比第一行高 0.8 左右
  expectations[1] = firstRowExpectation + 0.8;
  // 第三行比第一行小 0.1 到 0.3 左右
  expectations[2] = firstRowExpectation - (0.1 + Math.random() * 0.2);

  // 目标：Max(E1, E2) - E16 ≈ maxDiff
  // 由于 E2 = E1 + 0.8 必然是最大值
  const maxExp = expectations[1];
  const targetMinExp = maxExp - maxDiff;

  // 从第3行(E2)到第16行(E15)共有 13 个步长要走
  const totalRemainingDecay = expectations[2] - targetMinExp;
  const avgStep = totalRemainingDecay / 13;

  for (let i = 3; i < 16; i++) {
    // 允许步长在平均值上下波动 30%
    const jitter = (Math.random() - 0.5) * (avgStep * 0.6);
    expectations[i] = expectations[i - 1] - (avgStep + jitter);
  }

  // 2. 生成各行数据
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
