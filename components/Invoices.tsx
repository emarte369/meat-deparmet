import React, { useState, useEffect } from 'react';
import { Invoice, Seller } from '../types';
import { dbService } from '../services/storageService';
import { FileText, Calendar, DollarSign, List, CheckCircle, Loader2, Pencil, Trash2, XCircle } from 'lucide-react';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
    setInvoices(invData.sort((a, b) => b.date.localeCompare(a.date)));
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
    if (window.confirm("Are you sure you want to delete this invoice record?")) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">2. Invoice Management (Purchases)</h2>
        {editingId && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                EDITING MODE ACTIVE
            </span>
        )}
      </div>

      {!loading && sellers.length === 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700">
          <p>Warning: You must create at least one Seller before you can create an invoice.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
            {showSuccess && (
                <div className="absolute top-0 left-0 w-full bg-orange-100 text-orange-800 text-sm font-medium p-2 text-center flex items-center justify-center gap-2 animate-pulse z-10">
                    <CheckCircle className="w-4 h-4" /> Record Updated Successfully!
                </div>
            )}
            
            <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-2">
                {editingId ? 'Edit Invoice Details' : 'Record New Invoice'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Seller *</label>
                <select
                  name="sellerId"
                  value={formData.sellerId}
                  onChange={handleChange}
                  disabled={sellers.length === 0 || loading}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                  required
                >
                  <option value="">-- Choose a Seller --</option>
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Purchase *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount ($) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Items Description</label>
                <div className="relative">
                  <List className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 50 units of Widget X"
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
                    disabled={sellers.length === 0 || isSaving}
                    className={`flex-[2] ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'} text-white font-medium py-2 rounded-lg transition-colors shadow-md disabled:bg-slate-300 flex items-center justify-center gap-2`}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSaving ? 'Saving...' : editingId ? 'Update Record' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Invoice History</h3>
              {loading && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Seller</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && invoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        No invoices recorded.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className={`bg-white border-b hover:bg-slate-50 transition-colors ${editingId === inv.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}`}>
                        <td className="px-6 py-4">{inv.date}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                            <div>{inv.sellerName}</div>
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-[150px]">{inv.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-orange-600 font-bold">
                          ${inv.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                                <button 
                                    onClick={() => handleEdit(inv)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Record"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(inv.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Record"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                      </tr>
                    ))
                  )}
                  {loading && (
                     <tr><td colSpan={4} className="px-6 py-8 text-center">Querying Database...</td></tr>
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