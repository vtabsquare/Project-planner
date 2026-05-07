import React from 'react';
import { motion } from 'motion/react';
import { History, Plus } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function TaskHistoryModal({ task, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-xl w-full technical-card !p-0 border-gold-500/20"
      >
        <div className="p-8 luxury-gradient border-b border-slate-200 dark:border-gold-500/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gold-600 dark:text-gold-500 uppercase tracking-[0.3em] mb-2">Signal History Audit</p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{task.name}</h2>
            <p className="text-[9px] font-mono text-slate-500 uppercase mt-1">Project: {task.project} (v{task.version})</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-white transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-8 h-8 rotate-45" />
          </button>
        </div>
        
        <div className="p-8 space-y-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-12">
            {(task.history || []).map((entry, idx) => (
              <div key={idx} className="relative">
                <div className={cn(
                  "absolute -left-[41px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900",
                  entry.status === 'Completed' ? "bg-emerald-500" : "bg-gold-500"
                )} />
                <div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      entry.status === 'Completed' ? "text-emerald-500" : "text-gold-500"
                    )}>
                      STATUS_{entry.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    System recorded a transition to <span className="font-bold text-slate-700 dark:text-slate-300">[{entry.status}]</span> state.
                  </p>
                </div>
              </div>
            ))}
            
            {(!task.history || task.history.length === 0) && (
              <div className="py-10 text-center opacity-30">
                <History className="w-12 h-12 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Historical Logs Found</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-gold-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-500 transition-all font-sans"
          >
            Close Audit
          </button>
        </div>
      </motion.div>
    </div>
  );
}
