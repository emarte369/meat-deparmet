import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Sellers } from './components/Sellers';
import { Invoices } from './components/Invoices';
import { Sales } from './components/Sales';
import { Reports } from './components/Reports';
import { InstallPrompt } from './components/InstallPrompt';
import { View } from './types';
import { Menu, X } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard />;
      case View.SELLERS:
        return <Sellers />;
      case View.INVOICES:
        return <Invoices />;
      case View.SALES:
        return <Sales />;
      case View.REPORTS:
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      <InstallPrompt />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="font-bold">Meat Department</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar - Hidden on mobile unless menu is open */}
      <div className={`${isMobileMenuOpen ? 'fixed inset-0 z-40' : 'hidden'} md:block md:relative`}>
        <Sidebar currentView={currentView} onChangeView={handleViewChange} />
      </div>
      
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-7xl mx-auto pb-20 md:pb-0">
          {renderView()}
        </div>
      </main>
    </div>
  );
}