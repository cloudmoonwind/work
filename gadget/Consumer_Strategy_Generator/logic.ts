
import { TableConfig, TableResult, RowData } from './types';

function gaussian(x: number, mean: number, sigma: number): number {
  return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)));
}

function adjustSumAndMean(
  originalValues: number[],
  colNames: number[],
  targetSum: number,
  targetExpectation: number
): number[] {
  let values = [...originalValues];
  let currentSum = values.reduce((a, b) => a + b, 0);

  // 1. Adjust sum to 100
  while (currentSum !== targetSum) {
    const diff = targetSum - currentSum;
    const step = diff > 0 ? 1 : -1;
    let bestIdx = -1;
    let minMeanDiff = Infinity;

    for (let i = 0; i < values.length; i++) {
      if (step === -1 && values[i] <= 0) continue;
      const tempVal = values[i] + step;
      let tempWeightedSum = 0;
      for (let j = 0; j < values.length; j++) {
        tempWeightedSum += (j === i ? tempVal : values[j]) * colNames[j];
      }
      const meanDiff = Math.abs((tempWeightedSum / targetSum) - targetExpectation);
      if (meanDiff < minMeanDiff) {
        minMeanDiff = meanDiff;
        bestIdx = i;
      }
    }
    if (bestIdx !== -1) {
      values[bestIdx] += step;
      currentSum += step;
    } else break;
  }

  // 2. Fine-tune expectation
  for (let iter = 0; iter < 100; iter++) {
    let currentWS = values.reduce((sum, v, i) => sum + v * colNames[i], 0);
    const currentMean = currentWS / targetSum;
    if (Math.abs(currentMean - targetExpectation) < 0.001) break;

    let bestSwap = { from: -1, to: -1, imp: 0 };
    for (let i = 0; i < values.length; i++) {
      if (values[i] <= 0) continue;
      for (let j = 0; j < values.length; j++) {
        const change = colNames[j] - colNames[i];
        const newMean = (currentWS + change) / targetSum;
        const imp = Math.abs(currentMean - targetExpectation) - Math.abs(newMean - targetExpectation);
        if (imp > bestSwap.imp) {
          bestSwap = { from: i, to: j, imp };
        }
      }
    }
    if (bestSwap.from !== -1) {
      values[bestSwap.from]--;
      values[bestSwap.to]++;
    } else break;
  }
  return values;
}

export function generateTable(config: TableConfig): TableResult {
  const { firstRowExpectation, minCol, maxCol } = config;
  const colNames = Array.from({ length: maxCol - minCol + 1 }, (_, i) => minCol + i);
  const rows: RowData[] = [];
  const expectations = new Array(16);

  expectations[1] = firstRowExpectation + 0.2;
  expectations[0] = firstRowExpectation;
  for (let i = 2; i < 16; i++) expectations[i] = expectations[i - 1] - 0.1;

  for (let r = 0; r < 16; r++) {
    const targetE = expectations[r];
    const sigma = 1.8; 
    let probs = colNames.map(col => {
      if (r < 8 && (col < targetE - 8 || col > targetE + 5)) return 0;
      return gaussian(col, targetE, sigma);
    });

    const sumP = probs.reduce((a, b) => a + b, 0);
    let scaled = probs.map(p => Math.floor((p / sumP) * 100));
    const final = adjustSumAndMean(scaled, colNames, 100, targetE);

    const valuesMap: Record<number, number> = {};
    let ws = 0;
    final.forEach((v, i) => {
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
