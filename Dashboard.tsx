import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../services/storageService';
import { 
  Users, FileText, TrendingUp, DollarSign, Database, 
  Loader2, Smartphone, ShieldCheck, Globe, 
  ExternalLink, Cloud, Key, Server, AlertTriangle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [storageStatus, setStorageStatus] = useState({ persistent: false, usage: 0, isStandalone: false });
  const [activeTab, setActiveTab] = useState<'stats' | 'sync' | 'deploy'>('stats');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cloudSettings, setCloudSettings] = useState({
    url: localStorage.getItem('supabase_url') || '',
    key: localStorage.getItem('supabase_key') || '',
  });

  const [stats, setStats] = useState({
    sellers: 0,
    invoices: 0,
    sales: 0,
    totalRevenue: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sellers, invoices, sales, status] = await Promise.all([
        dbService.getSellers(),
        dbService.getInvoices(),
        dbService.getSales(),
        dbService.getStorageStatus()
      ]);
      
      const totalRevenue = sales.reduce((acc, curr) => acc + curr.amount, 0);

      setStats({
        sellers: sellers.length,
        invoices: invoices.length,
        sales: sales.length,
        totalRevenue,
      });
      setStorageStatus(status);
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveCloudSettings = () => {
    localStorage.setItem('supabase_url', cloudSettings.url);
    localStorage.setItem('supabase_key', cloudSettings.key);
    alert("Cloud credentials saved locally!");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await dbService.importDatabase(e.target?.result as string);
        await fetchData();
        alert("Import Success!");
      } catch (err) {
        alert("Import failed.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleWipeDatabase = async () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete local records.")) {
        setLoading(true);
        await dbService.clearAllData();
        await fetchData();
    }
  };

  if (loading && !importing) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500">Accessing Department Records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Meat Dept Hub</h2>
          <p className="text-sm text-slate-500">Inventory Monitoring &amp; Cloud Control</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveTab('stats')} className={`px-4 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>METRICS</button>
          <button onClick={() => setActiveTab('sync')} className={`px-4 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'sync' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>CLOUD SYNC</button>
          <button onClick={() => setActiveTab('deploy')} className={`px-4 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'deploy' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>HOSTING</button>
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Sellers', value: stats.sellers, icon: Users, color: 'bg-indigo-500' },
              { label: 'Invoices', value: stats.invoices, icon: FileText, color: 'bg-orange-500' },
              { label: 'Sales', value: stats.sales, icon: TrendingUp, color: 'bg-emerald-500' },
              { label: 'Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-500' }
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className={`${card.color} w-8 h-8 rounded-lg text-white flex items-center justify-center mb-2 shadow-sm`}><card.icon className="w-4 h-4" /></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</p>
                <p className="text-xl font-black text-slate-800">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><ShieldCheck className="w-5 h-5 text-emerald-500" />Device Status</h3>
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${storageStatus.isStandalone ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <Smartphone className={`w-5 h-5 mt-0.5 ${storageStatus.isStandalone ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div>
                  <p className={`text-sm font-bold ${storageStatus.isStandalone ? 'text-emerald-800' : 'text-amber-800'}`}>{storageStatus.isStandalone ? "Full App Mode" : "Safari Mode (Unsafe)"}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">{storageStatus.isStandalone ? "Storage is persistent. Data is safe." : "Warning: iPhone may delete data. Add to Home Screen now."}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Database className="w-5 h-5 text-blue-400" />Local Backup</h3>
                <p className="text-slate-400 text-xs mb-6 leading-relaxed">Save a manual file to your iPhone "Files" or iCloud Drive.</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => dbService.exportDatabase()} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-xs font-bold border border-slate-700">Download .JSON</button>
                    <button onClick={handleImportClick} disabled={importing} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-xs font-bold transition-all shadow-lg">{importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload File"}</button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm animate-in fade-in duration-300">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-emerald-100 p-4 rounded-2xl"><Server className="w-8 h-8 text-emerald-600" /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Supabase Connection</h3>
                <p className="text-slate-500 text-sm">Connect your cloud database to prevent data loss.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Supabase Project URL</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="text" value={cloudSettings.url} onChange={(e) => setCloudSettings({...cloudSettings, url: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="https://your-id.supabase.co" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anon Public Key</label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="password" value={cloudSettings.key} onChange={(e) => setCloudSettings({...cloudSettings, key: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="eyJhhbG..." />
                </div>
              </div>
              <button onClick={saveCloudSettings} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"><Cloud className="w-4 h-4" /> Link Cloud Database</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deploy' && (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm animate-in fade-in duration-300">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Globe className="w-6 h-6 text-blue-600" />Deployment Status</h3>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-lg">1</div>
                <div>
                  <p className="font-bold text-slate-800">Source Connected</p>
                  <p className="text-sm text-slate-500 mt-1">Files are correctly uploaded to GitHub. Vercel is monitoring changes.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-lg">2</div>
                <div>
                  <p className="font-bold text-slate-800">Live Hosting</p>
                  <p className="text-sm text-slate-500 mt-1">If you see this screen on the web, your app is officially live on Vercel.</p>
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">Manage Vercel Dashboard <ExternalLink className="w-3 h-3" /></a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-lg">3</div>
                <div>
                  <p className="font-bold text-slate-800">Installation</p>
                  <p className="text-sm text-slate-500 mt-1">Open your private link in Safari and use "Add to Home Screen" for the best experience.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-red-100 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-red-600 text-xs uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Danger Zone</h3>
          <p className="text-slate-500 text-xs mt-1">Permanently wipe local device storage.</p>
        </div>
        <button onClick={handleWipeDatabase} className="border border-red-200 text-red-600 hover:bg-red-50 px-6 py-2 rounded-xl text-xs font-bold transition-all">Wipe Local Database</button>
      </div>
    </div>
  );
};