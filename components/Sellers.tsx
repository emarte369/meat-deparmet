import React, { useState, useEffect } from 'react';
import { Seller } from '../types';
import { dbService } from '../services/storageService';
import { Plus, User, Building, Phone, Mail, CheckCircle, Loader2, Pencil, Trash2, XCircle } from 'lucide-react';

export const Sellers: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    const data = await dbService.getSellers();
    setSellers(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (seller: Seller) => {
    setEditingId(seller.id);
    setFormData({
      companyName: seller.companyName,
      contactName: seller.contactName,
      phone: seller.phone,
      email: seller.email,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ companyName: '', contactName: '', phone: '', email: '' });
  };

  const handleDelete = async (id: string) => {
    const hasInvoices = (await dbService.getInvoices()).some(inv => inv.sellerId === id);
    
    let confirmMsg = "Are you sure you want to delete this seller?";
    if (hasInvoices) {
      confirmMsg = "Warning: This seller has linked invoices. Deleting this seller will leave those invoices without a provider reference. Continue?";
    }

    if (window.confirm(confirmMsg)) {
      await dbService.deleteSeller(id);
      await fetchSellers();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactName) return;

    setIsSaving(true);
    
    const existingSeller = sellers.find(s => s.id === editingId);
    
    const sellerData: Seller = {
      id: editingId || crypto.randomUUID(),
      ...formData,
      createdAt: existingSeller ? existingSeller.createdAt : new Date().toISOString(),
    };

    await dbService.addSeller(sellerData);
    await fetchSellers();
    
    cancelEdit();
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">1. Sellers Management</h2>
        {editingId && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                EDITING MODE ACTIVE
            </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
            {showSuccess && (
                <div className="absolute top-0 left-0 w-full bg-emerald-100 text-emerald-800 text-sm font-medium p-2 text-center flex items-center justify-center gap-2 animate-pulse z-10">
                    <CheckCircle className="w-4 h-4" /> Seller Record {editingId ? 'Updated' : 'Committed'}!
                </div>
            )}
            
            <div className="flex items-center gap-2 mb-4 mt-2">
              {editingId ? <Pencil className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
              <h3 className="text-lg font-semibold text-slate-800">
                {editingId ? 'Edit Seller Details' : 'Add New Seller'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Acme Supplies"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contact@acme.com"
                  />
                </div>
              </div>

              <div className="flex gap-2">
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
                  className={`flex-[2] ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSaving ? 'Processing...' : editingId ? 'Update Seller' : 'Save Seller Record'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Registered Sellers Directory</h3>
              {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Company</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Info</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && sellers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        No sellers recorded yet. Add one to start.
                      </td>
                    </tr>
                  ) : (
                    sellers.map((seller) => (
                      <tr key={seller.id} className={`bg-white border-b hover:bg-slate-50 transition-colors ${editingId === seller.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}`}>
                        <td className="px-6 py-4 font-medium text-slate-900">{seller.companyName}</td>
                        <td className="px-6 py-4">{seller.contactName}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span>{seller.phone || '-'}</span>
                            <span className="text-xs text-blue-500">{seller.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(seller)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Seller"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(seller.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Seller"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  {loading && (
                     <tr><td colSpan={4} className="px-6 py-8 text-center">Loading...</td></tr>
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