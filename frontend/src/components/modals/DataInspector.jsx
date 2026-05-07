import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, Download, LogOut } from 'lucide-react';

export default function DataInspector({ onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const raw = {
      projects: JSON.parse(localStorage.getItem('aether_projects') || '[]'),
      tasks: JSON.parse(localStorage.getItem('aether_tasks') || '[]'),
      daily: JSON.parse(localStorage.getItem('aether_daily') || '[]'),
      config: {
        source: localStorage.getItem('aether_source'),
        spreadsheet: localStorage.getItem('aether_spreadsheet_id')
      }
    };
    setData(raw);
  }, []);

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aethertracker_backup_${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="technical-card w-full max-w-4xl h-[80vh] flex flex-col bg-slate-950 border-gold-900/30"
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-gold-500" />
            <h2 className="text-sm font-mono font-bold text-slate-200">INTERNAL_STORAGE_INSPECTOR v1.0</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={downloadBackup}
              className="px-3 py-1 bg-gold-600 text-white text-[10px] font-bold rounded flex items-center gap-1.5 hover:bg-gold-500 transition-colors"
            >
              <Download className="w-3 h-3" /> EXPORT_JSON
            </button>
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400">
              <LogOut className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-500/80 bg-black/50 scrollbar-hide">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
          <span>SOURCE: LOCAL_NODE_CACHE</span>
          <span>ENCRYPTION: NONE_STANDARD</span>
        </div>
      </motion.div>
    </div>
  );
}
