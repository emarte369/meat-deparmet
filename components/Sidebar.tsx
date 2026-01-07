import React from 'react';
import { View } from '../types';
import { LayoutDashboard, Users, FileText, TrendingUp, PieChart, Wallet, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  
  const menuItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.SELLERS, label: '1. Sellers', icon: Users },
    { id: View.INVOICES, label: '2. Invoices (Buy)', icon: FileText },
    { id: View.SALES, label: '3. Sales (Sell)', icon: TrendingUp },
    { id: View.REPORTS, label: '4. Reports & AI', icon: PieChart },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <Wallet className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-xl font-bold leading-tight">Meat Department</h1>
          <p className="text-xs text-slate-400">Inventory Management</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase font-bold">Storage: Local Device</p>
        </div>
        <p className="text-[10px] text-slate-500 text-center uppercase tracking-tighter">Secure data architecture</p>
      </div>
    </div>
  );
};