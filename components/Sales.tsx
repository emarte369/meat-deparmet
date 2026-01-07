import React, { useState, useEffect } from 'react';
import { Sale } from '../types';
import { dbService } from '../services/storageService';
import { TrendingUp, Calendar, DollarSign, Tag, CheckCircle, Loader2, Pencil, Trash2, XCircle } from 'lucide-react';

export const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const data = await dbService.getSales();
    setSales(data.sort((a, b) => b.date.localeCompare(a.date)));
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setFormData({
      date: sale.date,
      amount: sale.amount.toString(),
      description: sale.description,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      description: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this sales record?")) {
      await dbService.deleteSale(id);
      await fetchSales();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;

    setIsSaving(true);
    const updatedSale: Sale = {
      id: editingId || crypto.randomUUID(),
      date: formData.date,
      amount: parseFloat(formData.amount),
      description: formData.description,
      createdAt: editingId 
        ? (sales.find(s => s.id === editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };

    await dbService.addSale(updatedSale);
    await fetchSales();
    
    cancelEdit();
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">3. Sales Management</h2>
        {editingId && (
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                EDITING MODE ACTIVE
            </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
             {showSuccess && (
                <div className="absolute top-0 left-0 w-full bg-emerald-100 text-emerald-800 text-sm font-medium p-2 text-center flex items-center justify-center gap-2 animate-pulse z-10">
                    <CheckCircle className="w-4 h-4" /> Record Saved to Database!
                </div>
            )}

            <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-2">
                {editingId ? 'Edit Sale Details' : 'Record New Sale'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Sale *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Sale Amount ($) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description / Notes</label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Bulk order for Client X"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingId && (
                    <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle className="w-4 h-4" /> Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSaving}
                    className={`flex-[2] ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-medium py-2 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2`}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSaving ? 'Processing...' : editingId ? 'Update Record' : 'Save Sale Record'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Recent Sales Activity</h3>
              {loading && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && sales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        No sales recorded yet.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className={`bg-white border-b hover:bg-slate-50 transition-colors ${editingId === sale.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}`}>
                        <td className="px-6 py-4">{sale.date}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{sale.description || 'General Sale'}</td>
                        <td className="px-6 py-4 text-right font-mono text-emerald-600 font-bold">
                          ${sale.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                                <button 
                                    onClick={() => handleEdit(sale)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Sale"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(sale.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Sale"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                      </tr>
                    ))
                  )}
                  {loading && (
                     <tr><td colSpan={4} className="px-6 py-8 text-center">Accessing Records...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};