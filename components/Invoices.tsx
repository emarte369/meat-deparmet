import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, Seller } from '../types';
import { dbService } from '../services/storageService';
import { 
  Calendar, DollarSign, List, CheckCircle, 
  Loader2, Pencil, Trash2, XCircle, BarChart3, 
  Filter, CalendarDays, ArrowRight,
  ChevronUp, ChevronDown, PlusCircle
} from 'lucide-react';

type HistorySortField = 'date' | 'sellerName' | 'amount';
type SortDirection = 'asc' | 'desc';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'entry' | 'summary'>('entry');
  
  const [historySort, setHistorySort] = useState<{ field: HistorySortField; dir: SortDirection }>({ 
    field: 'date', 
    dir: 'desc' 
  });

  const [summaryRange, setSummaryRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [formData, setFormData] = useState({
    sellerId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [invData, sellerData] = await Promise.all([
      dbService.getInvoices(),
      dbService.getSellers()
    ]);
    setInvoices(invData);
    setSellers(sellerData);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (inv: Invoice) => {
    setEditingId(inv.id);
    setFormData({
      sellerId: inv.sellerId,
      date: inv.date,
      amount: inv.amount.toString(),
      description: inv.description,
    });
    setActiveTab('entry');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      sellerId: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      description: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this invoice record?")) {
      await dbService.deleteInvoice(id);
      await fetchInitialData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sellerId || !formData.amount) return;

    const selectedSeller = sellers.find(s => s.id === formData.sellerId);
    if (!selectedSeller) return;

    setIsSaving(true);
    const updatedInvoice: Invoice = {
      id: editingId || crypto.randomUUID(),
      sellerId: formData.sellerId,
      sellerName: selectedSeller.companyName,
      date: formData.date,
      amount: parseFloat(formData.amount),
      description: formData.description,
      createdAt: editingId 
        ? (invoices.find(i => i.id === editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };

    await dbService.addInvoice(updatedInvoice);
    await fetchInitialData();
    
    cancelEdit();
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const toggleHistorySort = (field: HistorySortField) => {
    setHistorySort(prev => ({
      field,
      dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDirection }) => {
    if (!active) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return dir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const sortedHistoryInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const { field, dir } = historySort;
      let comparison = 0;
      if (field === 'date') comparison = a.date.localeCompare(b.date);
      else if (field === 'sellerName') comparison = a.sellerName.localeCompare(b.sellerName);
      else comparison = a.amount - b.amount;
      return dir === 'asc' ? comparison : -comparison;
    });
  }, [invoices, historySort]);

  const setQuickRange = (range: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (range) {
      case 'thisWeek':
        start.setDate(today.getDate() - today.getDay());
        end = today;
        break;
      case 'lastWeek':
        start.setDate(today.getDate() - today.getDay() - 7);
        end.setDate(today.getDate() - today.getDay() - 1);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
    }
    setSummaryRange({ start: formatDate(start), end: formatDate(end) });
  };

  const summaryData = useMemo(() => {
    const filtered = invoices.filter(inv => inv.date >= summaryRange.start && inv.date <= summaryRange.end);
    const totalsBySeller: Record<string, { name: string, amount: number, count: number }> = {};
    let grandTotal = 0;

    filtered.forEach(inv => {
      if (!totalsBySeller[inv.sellerId]) {
        totalsBySeller[inv.sellerId] = { name: inv.sellerName, amount: 0, count: 0 };
      }
      totalsBySeller[inv.sellerId].amount += inv.amount;
      totalsBySeller[inv.sellerId].count += 1;
      grandTotal += inv.amount;
    });

    return {
      rows: Object.values(totalsBySeller).sort((a, b) => b.amount - a.amount),
      grandTotal,
      invoiceCount: filtered.length
    };
  }, [invoices, summaryRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">2. Invoices (Purchases)</h2>
          <p className="text-sm text-slate-500">Log new stock or review expenditures</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-xl w-fit shadow-sm">
          <button 
            onClick={() => setActiveTab('entry')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'entry' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> ENTRY FORM
          </button>
          <button 
            onClick={() => setActiveTab('summary')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> SUMMARY VIEW
          </button>
        </div>
      </div>

      {activeTab === 'entry' && (
        <div className="animate-in fade-in duration-300 space-y-6">
          {!loading && sellers.length === 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700 rounded-r-lg shadow-sm">
              <p className="font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" /> Setup Required: Create at least one Seller before logging invoices.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                {showSuccess && (
                    <div className="absolute top-0 left-0 w-full bg-emerald-100 text-emerald-800 text-xs font-bold p-2 text-center flex items-center justify-center gap-2 animate-pulse z-10">
                        <CheckCircle className="w-4 h-4" /> RECORD COMMITTED TO DATABASE
                    </div>
                )}
                
                <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-2">
                    {editingId ? 'Update Purchase Record' : 'Record New Purchase'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Seller *</label>
                    <select
                      name="sellerId"
                      value={formData.sellerId}
                      onChange={handleChange}
                      disabled={sellers.length === 0 || loading}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                      required
                    >
                      <option value="">-- Choose Vendor --</option>
                      {sellers.map(s => (
                        <option key={s.id} value={s.id}>{s.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invoice Date *</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Bill Amount ($) *</label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Details</label>
                    <div className="relative">
                      <List className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="e.g. 50kg Ribeye, 20kg Sirloin"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingId && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg transition-colors text-xs flex items-center justify-center gap-2"
                        >
                            <XCircle className="w-4 h-4" /> CANCEL
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={sellers.length === 0 || isSaving}
                        className={`flex-[2] ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'} text-white font-bold py-2 rounded-lg transition-colors shadow-md disabled:bg-slate-300 text-xs flex items-center justify-center gap-2`}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSaving ? 'COMMITING...' : editingId ? 'UPDATE RECORD' : 'SAVE INVOICE'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <List className="w-4 h-4 text-blue-500" /> Recent Purchases
                  </h3>
                  {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 font-black border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">
                          <button 
                            onClick={() => toggleHistorySort('date')}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase"
                          >
                            Date
                            <SortIcon active={historySort.field === 'date'} dir={historySort.dir} />
                          </button>
                        </th>
                        <th className="px-6 py-4">
                          <button 
                            onClick={() => toggleHistorySort('sellerName')}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase"
                          >
                            Vendor
                            <SortIcon active={historySort.field === 'sellerName'} dir={historySort.dir} />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-right">
                          <button 
                            onClick={() => toggleHistorySort('amount')}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase ml-auto"
                          >
                            Amount
                            <SortIcon active={historySort.field === 'amount'} dir={historySort.dir} />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!loading && sortedHistoryInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                            No transactions found in local storage.
                          </td>
                        </tr>
                      ) : (
                        sortedHistoryInvoices.map((inv) => (
                          <tr key={inv.id} className={`bg-white border-b hover:bg-slate-50 transition-colors ${editingId === inv.id ? 'bg-blue-50 ring-1 ring-blue-500' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">{inv.date}</td>
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 truncate max-w-[150px]">{inv.sellerName}</div>
                                <div className="text-[10px] text-slate-400 font-normal truncate max-w-[150px]">{inv.description || '-'}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-orange-600 font-black">
                              ${inv.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-1">
                                    <button 
                                        onClick={() => handleEdit(inv)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Edit"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(inv.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                Aggregated Purchase Filters
              </h3>
              <div className="flex flex-wrap gap-2">
                {['thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setQuickRange(r as any)}
                    className="px-3 py-1 text-[10px] font-black uppercase tracking-wider border border-slate-200 rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-slate-500"
                  >
                    {r.replace(/([A-Z])/g, ' $1')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Starting From</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={summaryRange.start}
                    onChange={(e) => setSummaryRange({ ...summaryRange, start: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Ending At</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={summaryRange.end}
                    onChange={(e) => setSummaryRange({ ...summaryRange, end: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center justify-between h-[42px] px-4">
                   <span className="text-xs font-bold text-blue-800">Total Count:</span>
                   <span className="text-sm font-black text-blue-900">{summaryData.invoiceCount} Records</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Purchased</p>
                 <h4 className="text-3xl font-black text-white">${summaryData.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                 <div className="mt-6 pt-6 border-t border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Vendors Used</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-bold">{summaryData.rows.length}</span>
                       <span className="text-xs text-slate-500 font-medium tracking-wider">DISTINCT SELLERS</span>
                    </div>
                 </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                 <h5 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <CalendarDays className="w-4 h-4 text-emerald-500" />
                    Period Overview
                 </h5>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                       <span className="text-slate-400 uppercase">From</span>
                       <span className="font-mono text-slate-800">{summaryRange.start}</span>
                    </div>
                    <div className="flex justify-center">
                       <ArrowRight className="w-4 h-4 text-slate-200" />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                       <span className="text-slate-400 uppercase">To</span>
                       <span className="font-mono text-slate-800">{summaryRange.end}</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                   <h3 className="font-bold text-slate-800 text-sm">Summary per Seller</h3>
                   <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-black tracking-tighter">AGGREGATED BY VOL.</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-slate-500 uppercase font-black bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Seller Name</th>
                        <th className="px-6 py-4 text-center">Inv. Count</th>
                        <th className="px-6 py-4 text-right">Aggregate Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summaryData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                            No purchases found for the selected date range.
                          </td>
                        </tr>
                      ) : (
                        summaryData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-800">{row.name}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black">
                                {row.count}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-mono font-black text-orange-600">
                                ${row.amount.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {summaryData.rows.length > 0 && (
                       <tfoot className="bg-slate-50 font-black border-t border-slate-200">
                         <tr>
                            <td className="px-6 py-4 text-slate-800 uppercase text-[10px] tracking-widest">Grand Total Purchases</td>
                            <td className="px-6 py-4 text-center text-slate-800">{summaryData.invoiceCount}</td>
                            <td className="px-6 py-4 text-right text-slate-900 text-lg">${summaryData.grandTotal.toFixed(2)}</td>
                         </tr>
                       </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
