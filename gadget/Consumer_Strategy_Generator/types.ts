
export interface TableConfig {
  firstRowExpectation: number;
  minCol: number;
  maxCol: number;
  maxDiff: number; // 最大最小期望差值
}

export interface RowData {
  rowIndex: number;
  targetExpectation: number;
  actualExpectation: number;
  values: Record<number, number>;
  sum: number;
}

export interface TableResult {
  columns: number[];
  rows: RowData[];
}
