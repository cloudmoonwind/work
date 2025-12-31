
import React, { useState, useMemo } from 'react';
import { RefreshCw, Table as TableIcon, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import * as XLSX from 'xlsx';
import { generateTable } from './logic.ts';
import { TableConfig, TableResult } from './types.ts';

const App: React.FC = () => {
  const [config, setConfig] = useState<TableConfig>({
    firstRowExpectation: 8.0,
    minCol: 5,
    maxCol: 15
  });
  const [result, setResult] = useState<TableResult | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);

  const handleGenerate = () => {
    if (config.maxCol <= config.minCol) return alert("最大列必须大于最小列");
    const newResult = generateTable(config);
    setResult(newResult);
    setActiveRowIndex(0); // 默认显示第一行
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

  // 准备图表数据
  const chartData = useMemo(() => {
    if (!result || !result.rows[activeRowIndex]) return [];
    const row = result.rows[activeRowIndex];
    return result.columns.map(col => ({
      name: col.toString(),
      percentage: row.values[col] || 0
    }));
  }, [result, activeRowIndex]);

  return (
    <div className="p-4 max-w-5xl mx-auto pb-20">
      <header className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg">
          <TableIcon size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">正态分布数据生成器</h1>
      </header>

      {/* 控制面板 */}
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
        <button onClick={handleGenerate} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-md active:scale-[0.98]">
          <RefreshCw size={20} /> 生成并绘制数据
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          {/* 图表展示区 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold">
              <BarChart3 size={20} className="text-indigo-500" />
              <span>第 {activeRowIndex + 1} 行分布曲线预览 (期望值: {result.rows[activeRowIndex].actualExpectation.toFixed(2)})</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} unit="%" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPct)" 
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4 italic">提示：在下方表格点击不同行可切换曲线</p>
          </div>

          {/* 数据表格区 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <span className="font-bold text-gray-700">数据预览 (共16行)</span>
              <button onClick={exportExcel} className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-md hover:bg-green-100 font-semibold border border-green-200 transition">
                <FileSpreadsheet size={18} /> 导出 Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 border-b text-left">行</th>
                    {result.columns.map(c => <th key={c} className="p-3 border-b text-center text-gray-400 font-normal">{c}</th>)}
                    <th className="p-3 border-b text-right text-indigo-600">实际期望</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => (
                    <tr 
                      key={row.rowIndex} 
                      onClick={() => setActiveRowIndex(idx)}
                      className={`cursor-pointer transition border-b last:border-0 ${activeRowIndex === idx ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <td className={`p-3 font-bold ${activeRowIndex === idx ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {row.rowIndex.toString().padStart(2, '0')}
                      </td>
                      {result.columns.map(c => (
                        <td key={c} className={`p-3 text-center ${row.values[c] === 0 ? 'text-gray-200' : 'text-gray-900 font-medium'}`}>
                          {row.values[c]}
                        </td>
                      ))}
                      <td className="p-3 text-right font-mono font-bold text-indigo-600">{row.actualExpectation.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
