
export interface TableConfig {
  firstRowExpectation: number;
  minCol: number;
  maxCol: number;
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
