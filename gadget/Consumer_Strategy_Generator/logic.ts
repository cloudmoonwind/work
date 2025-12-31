
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
  // 确定峰值位置
  let peakIdx = 0;
  let minDist = Math.abs(colNames[0] - targetExpectation);
  for (let i = 1; i < n; i++) {
    const d = Math.abs(colNames[i] - targetExpectation);
    if (d < minDist) {
      minDist = d;
      peakIdx = i;
    }
  }

  // 1. 基于高斯分布生成初始浮点分布，并进行初步整数化
  const sigma = 1.5; 
  let rawProbs = colNames.map(c => gaussian(c, targetExpectation, sigma));
  const sumRaw = rawProbs.reduce((a, b) => a + b, 0);
  let values = rawProbs.map(p => Math.round((p / sumRaw) * targetSum));

  // 2. 强行修正为单峰形态（初始校准）
  // 修正左侧
  for (let i = 1; i <= peakIdx; i++) {
    if (values[i] < values[i - 1]) values[i] = values[i - 1];
  }
  // 修正右侧
  for (let i = peakIdx + 1; i < n; i++) {
    if (values[i] > values[i - 1]) values[i] = values[i - 1];
  }

  // 3. 循环调整总和直到等于 targetSum
  let iterLimit = 200;
  while (values.reduce((a, b) => a + b, 0) !== targetSum && iterLimit-- > 0) {
    const currentSum = values.reduce((a, b) => a + b, 0);
    const diff = targetSum - currentSum;
    const step = diff > 0 ? 1 : -1;

    let bestIdx = -1;
    let minErr = Infinity;

    for (let i = 0; i < n; i++) {
      if (step === -1 && values[i] <= 0) continue;
      
      // 尝试在i位置变动1单位
      values[i] += step;
      // 检查变动后是否仍满足单峰
      if (isUnimodal(values, peakIdx)) {
        const currentMean = values.reduce((s, v, idx) => s + v * colNames[idx], 0) / targetSum;
        const err = Math.abs(currentMean - targetExpectation);
        if (err < minErr) {
          minErr = err;
          bestIdx = i;
        }
      }
      values[i] -= step; // 还原
    }

    if (bestIdx !== -1) {
      values[bestIdx] += step;
    } else {
      // 如果找不到满足单峰的变动位置，说明形态太死，尝试放宽：直接在峰值调整
      values[peakIdx] += step;
    }
  }

  // 4. 均值微调：在保持总和和形态的前提下，通过“搬运”数值微调均值
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
  const { firstRowExpectation, minCol, maxCol } = config;
  const colNames = Array.from({ length: maxCol - minCol + 1 }, (_, i) => minCol + i);
  const rows: RowData[] = [];
  const expectations = new Array(16);

  // 1. 构建期望值序列
  expectations[0] = firstRowExpectation;
  // 第二行比第一行高 0.8 左右 (固定为 0.8)
  expectations[1] = firstRowExpectation + 0.8;

  // 约束：Max - Min <= 3.0。由于 Max 是 expectations[1]，所以 Min 必须 >= expectations[1] - 3.0
  const minAllowedExp = expectations[1] - 3.0;
  // 计算剩余 14 行需要分配的总衰减量
  // 我们希望平滑衰减，假设总共衰减 D，D 属于 [1.5, 2.8] 之间比较自然
  const totalDecay = 2.2 + (Math.random() * 0.4); 
  const remainingRows = 14;
  const baseStep = totalDecay / remainingRows;

  for (let i = 2; i < 16; i++) {
    const jitter = (Math.random() - 0.5) * 0.1; // 随机波动
    const step = Math.max(0.02, baseStep + jitter);
    expectations[i] = expectations[i - 1] - step;
    // 强制兜底，不突破 Max-Min <= 3 的底线
    if (expectations[i] < minAllowedExp) expectations[i] = minAllowedExp + Math.random() * 0.1;
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
