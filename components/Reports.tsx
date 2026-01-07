import React, { useState, useMemo } from 'react';
import { dbService } from '../services/storageService';
import { generateFinancialAnalysis } from '../services/aiService';
import { ReportData, Invoice } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Calculator, Bot, Loader2, AlertCircle, FileText, 
  Database, Cpu, ChevronUp, ChevronDown 
} from 'lucide-react';

type VendorSortField = 'name' | 'count' | 'amount';
type InvoiceSortField = 'date' | 'description' | 'amount';
type SortDirection = 'asc' | 'desc';

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: new Date().toISOString().split('T')[0]
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [vendorStats, setVendorStats] = useState<{name: string, amount: number, count: number}[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportLoadingMessage, setReportLoadingMessage] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiLoadingMessage, setAiLoadingMessage] = useState('');

  // Sorting State
  const [vendorSort, setVendorSort] = useState<{ field: VendorSortField; dir: SortDirection }>({ field: 'amount', dir: 'desc' });
  const [invoiceSort, setInvoiceSort] = useState<{ field: InvoiceSortField; dir: SortDirection }>({ field: 'date', dir: 'desc' });

  const calculateReport = async () => {
    if (!dateRange.start || !dateRange.end) return;
    
    setLoadingReport(true);
    setReportLoadingMessage('Accessing local database...');
    await new Promise(resolve => setTimeout(resolve, 800));

    setReportLoadingMessage('Fetching purchase invoices...');
    const allInvoices = await dbService.getInvoices();
    
    setReportLoadingMessage('Fetching sales records...');
    const allSales = await dbService.getSales();

    setReportLoadingMessage('Filtering data by date range...');
    const invoices = allInvoices.filter(i => i.date >= dateRange.start && i.date <= dateRange.end);
    const sales = allSales.filter(s => s.date >= dateRange.start && s.date <= dateRange.end);

    setReportLoadingMessage('Aggregating financial metrics...');
    const totalSales = sales.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = invoices.reduce((acc, curr) => acc + curr.amount, 0); 
    const netProfit = totalSales - totalExpenses; 
    
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    const returnOnCapital = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

    setReportLoadingMessage('Calculating vendor performance...');
    const vStats: Record<string, { name: string, amount: number, count: number }> = {};
    invoices.forEach(inv => {
        if (!vStats[inv.sellerId]) {
            vStats[inv.sellerId] = { name: inv.sellerName, amount: 0, count: 0 };
        }
        vStats[inv.sellerId].amount += inv.amount;
        vStats[inv.sellerId].count += 1;
    });

    setVendorStats(Object.values(vStats));
    setFilteredInvoices(invoices);

    setReportData({
      totalSales,
      totalExpenses,
      netProfit,
      profitMargin,
      returnOnCapital,
      saleCount: sales.length,
      invoiceCount: invoices.length,
      periodStart: dateRange.start,
      periodEnd: dateRange.end,
    });
    setAiAnalysis(''); 
    setLoadingReport(false);
    setReportLoadingMessage('');
  };

  const sortedVendors = useMemo(() => {
    return [...vendorStats].sort((a, b) => {
      const { field, dir } = vendorSort;
      let comparison = 0;
      if (field === 'name') comparison = a.name.localeCompare(b.name);
      else comparison = a[field] - b[field];
      return dir === 'asc' ? comparison : -comparison;
    });
  }, [vendorStats, vendorSort]);

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      const { field, dir } = invoiceSort;
      let comparison = 0;
      if (field === 'date') comparison = a.date.localeCompare(b.date);
      else if (field === 'description') comparison = (a.description || '').localeCompare(b.description || '');
      else comparison = a.amount - b.amount;
      return dir === 'asc' ? comparison : -comparison;
    });
  }, [filteredInvoices, invoiceSort]);

  const toggleVendorSort = (field: VendorSortField) => {
    setVendorSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleInvoiceSort = (field: InvoiceSortField) => {
    setInvoiceSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDirection }) => {
    if (!active) return <div className="w-4 h-4 opacity-20"><ChevronDown className="w-4 h-4" /></div>;
    return dir === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const handleRunAi = async () => {
    if (!reportData) return;
    setLoadingAi(true);
    setAiLoadingMessage('Preparing structured report data...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setAiLoadingMessage('Connecting to Gemini 3 Pro...');
    await new Promise(resolve => setTimeout(resolve, 600));
    setAiLoadingMessage('Consulting Senior Financial Model...');
    const analysis = await generateFinancialAnalysis(reportData);
    setAiLoadingMessage('Finalizing insights...');
    await new Promise(resolve => setTimeout(resolve, 500));
    setAiAnalysis(analysis);
    setLoadingAi(false);
    setAiLoadingMessage('');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">4. Financial Reports</h2>
         <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">IndexedDB Database Aggregation</span>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Report Configuration</h3>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button
              onClick={calculateReport}
              disabled={loadingReport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-blue-400 h-11 min-w-[180px]"
            >
              {loadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              {loadingReport ? 'Querying...' : 'Generate Report'}
            </button>
          </div>
        </div>
        {loadingReport && (
            <div className="mt-4 flex items-center gap-3 text-blue-600 text-sm animate-pulse">
                <Database className="w-4 h-4" />
                <span>{reportLoadingMessage}</span>
            </div>
        )}
      </div>

      {reportData ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800">3. Final Profitability Table</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Total Sales Revenue</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-2">${reportData.totalSales.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Gross Profit (Net)</p>
                            <p className={`text-2xl font-bold mt-2 ${reportData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                ${reportData.netProfit.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Profit Margin %</p>
                            <p className="text-2xl font-bold text-slate-800 mt-2">{reportData.profitMargin.toFixed(2)}%</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold">ROI %</p>
                            <p className="text-2xl font-bold text-purple-600 mt-2">{reportData.returnOnCapital.toFixed(2)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-800">1. Vendor Expenditure Table</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">
                                      <button 
                                        onClick={() => toggleVendorSort('name')}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase font-bold"
                                      >
                                        Vendor Name
                                        <SortIcon active={vendorSort.field === 'name'} dir={vendorSort.dir} />
                                      </button>
                                    </th>
                                    <th className="px-6 py-3">
                                      <button 
                                        onClick={() => toggleVendorSort('count')}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase font-bold mx-auto"
                                      >
                                        Trans. Count
                                        <SortIcon active={vendorSort.field === 'count'} dir={vendorSort.dir} />
                                      </button>
                                    </th>
                                    <th className="px-6 py-3">
                                      <button 
                                        onClick={() => toggleVendorSort('amount')}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase font-bold ml-auto"
                                      >
                                        Total Expenditure
                                        <SortIcon active={vendorSort.field === 'amount'} dir={vendorSort.dir} />
                                      </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedVendors.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400">No data</td></tr>
                                ) : (
                                    sortedVendors.map((v, i) => (
                                        <tr key={i} className="border-b hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-slate-800">{v.name}</td>
                                            <td className="px-6 py-3 text-center">{v.count}</td>
                                            <td className="px-6 py-3 text-right text-orange-600 font-mono">${v.amount.toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) }
                                {vendorStats.length > 0 && (
                                    <tr className="bg-slate-100 font-bold">
                                        <td className="px-6 py-3">TOTAL</td>
                                        <td className="px-6 py-3 text-center">{reportData.invoiceCount}</td>
                                        <td className="px-6 py-3 text-right">${reportData.totalExpenses.toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-800">2. Inventory Adjustment Table</h3>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 bg-slate-50">
                                      <button 
                                        onClick={() => toggleInvoiceSort('date')}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase font-bold"
                                      >
                                        Date
                                        <SortIcon active={invoiceSort.field === 'date'} dir={invoiceSort.dir} />
                                      </button>
                                    </th>
                                    <th className="px-6 py-3 bg-slate-50">
                                      <button 
                                        onClick={() => toggleInvoiceSort('description')}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase font-bold"
                                      >
                                        Description
                                        <SortIcon active={invoiceSort.field === 'description'} dir={invoiceSort.dir} />
                                      </button>
                                    </th>
                                    <th className="px-6 py-3 bg-slate-50">
                                      <button 
                                        onClick={() => toggleInvoiceSort('amount')}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase font-bold ml-auto"
                                      >
                                        Adj. Cost
                                        <SortIcon active={invoiceSort.field === 'amount'} dir={invoiceSort.dir} />
                                      </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedInvoices.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400">No data</td></tr>
                                ) : (
                                    sortedInvoices.map((inv) => (
                                        <tr key={inv.id} className="border-b hover:bg-slate-50">
                                            <td className="px-6 py-3 whitespace-nowrap">{inv.date}</td>
                                            <td className="px-6 py-3">{inv.description || 'N/A'}</td>
                                            <td className="px-6 py-3 text-right font-mono">${inv.amount.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Visual Comparison</h3>
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Revenue', amount: reportData.totalSales },
                        { name: 'COGS', amount: reportData.totalExpenses },
                        { name: 'Gross Profit', amount: reportData.netProfit },
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 text-slate-100 p-6 rounded-xl shadow-lg flex flex-col h-80">
                    <div className="flex items-center gap-2 mb-4">
                    <div className="bg-purple-600 p-2 rounded-lg">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold">AI Analyst Feedback</h3>
                    </div>
                    
                    <div className="flex-1 bg-slate-800/50 rounded-lg p-4 text-sm leading-relaxed mb-4 overflow-y-auto">
                    {loadingAi ? (
                        <div className="flex flex-col items-center justify-center h-full text-purple-400 gap-4 text-center animate-pulse">
                            <div className="relative">
                                <Cpu className="w-10 h-10 animate-spin" />
                                <Bot className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-white uppercase tracking-widest text-xs">AI Core Processing</p>
                                <p className="text-purple-300 italic">{aiLoadingMessage}</p>
                            </div>
                        </div>
                    ) : aiAnalysis ? (
                        <div className="prose prose-invert prose-sm">
                        {aiAnalysis.split('\n').map((line, i) => (
                            <p key={i} className="mb-2">{line}</p>
                        ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 text-center">
                        <p>Generate a report first, then run AI analysis for database-driven insights.</p>
                        </div>
                    )}
                    </div>

                    <button
                    onClick={handleRunAi}
                    disabled={loadingAi}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 h-11"
                    >
                    {loadingAi ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    ) : (
                        <>Analyze with Gemini AI</>
                    )}
                    </button>
                </div>
            </div>

        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Select a date range and click "Generate Report" to query the database.</p>
        </div>
      )}
    </div>
  );
};