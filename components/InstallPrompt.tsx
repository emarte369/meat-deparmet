import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Info } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Check if it's already in standalone mode (installed)
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
      // Show prompt after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-blue-500/30">
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-inner">
            <Share className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              Install Meat Dept App
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-widest">iPhone Tip</span>
            </h3>
            <p className="text-slate-400 text-sm leading-snug mb-4">
              Add the Meat Department tool to your Home Screen for a faster, full-screen experience.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400">1</div>
                <p>Tap the <span className="inline-flex bg-slate-800 p-1 rounded mx-1"><Share className="w-3 h-3" /></span> button in Safari</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400">2</div>
                <p>Scroll down and tap <span className="font-semibold text-white">"Add to Home Screen"</span></p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400">3</div>
                <p>Tap <span className="font-semibold text-blue-400 underline decoration-2 underline-offset-4">Add</span> at the top right</p>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowPrompt(false)}
          className="w-full mt-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium rounded-xl text-sm transition-colors"
        >
          Got it!
        </button>
      </div>
      <div className="flex justify-center mt-2 animate-bounce">
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-slate-900"></div>
      </div>
    </div>
  );
};