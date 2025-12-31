
import React, { useState } from 'react';
import { Download, RefreshCw, Table as TableIcon, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateTable } from './logic';
import { TableConfig, TableResult } from './types';

const App: React.FC = () => {
  const [config, setConfig] = useState<TableConfig>({
    firstRowExpectation: 8.0,
    minCol: 5,
    maxCol: 15
  });
  const [result, setResult] = useState<TableResult | null>(null);

  const handleGenerate = () => {
    if (config.maxCol <= config.minCol) return alert("最大列必须大于最小列");
    setResult(generateTable(config));
  };

  const exportExcel = () => {
    if (!result) return;
    const data = result.rows.map(row => ({
      '行号': row.rowIndex,
      ...row.values,
      '期望值': row.actualExpectation.toFixed(2),
      '合计': row.sum + '%'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "正态分布表.xlsx");
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <TableIcon size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">正态分布数据生成器</h1>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">第一行期望值</label>
            <input type="number" step="0.1" value={config.firstRowExpectation} 
              onChange={e => setConfig({...config, firstRowExpectation: parseFloat(e.target.value)})}
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">列名最小值</label>
            <input type="number" value={config.minCol} 
              onChange={e => setConfig({...config, minCol: parseInt(e.target.value)})}
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">列名最大值</label>
            <input type="number" value={config.maxCol} 
              onChange={e => setConfig({...config, maxCol: parseInt(e.target.value)})}
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <button onClick={handleGenerate} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition">
          <RefreshCw size={20} /> 生成表格内容
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <span className="font-bold text-gray-700">预览 (16行)</span>
            <button onClick={exportExcel} className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-md hover:bg-green-100 font-semibold border border-green-200">
              <FileSpreadsheet size={18} /> 导出 XLSX
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 border-b text-left">行</th>
                  {result.columns.map(c => <th key={c} className="p-3 border-b text-center">{c}</th>)}
                  <th className="p-3 border-b text-right">期望</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map(row => (
                  <tr key={row.rowIndex} className="hover:bg-gray-50 border-b last:border-0">
                    <td className="p-3 font-medium text-gray-500">{row.rowIndex}</td>
                    {result.columns.map(c => (
                      <td key={c} className={`p-3 text-center ${row.values[c] === 0 ? 'text-gray-300' : 'text-gray-900 font-medium'}`}>
                        {row.values[c]}
                      </td>
                    ))}
                    <td className="p-3 text-right font-mono text-indigo-600">{row.actualExpectation.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
