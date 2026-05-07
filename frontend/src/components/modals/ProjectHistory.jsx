import React from 'react';
import { motion } from 'motion/react';
import { History, ArrowLeft, CheckCircle2, Circle } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ProjectHistory({ 
  projectName, 
  projects, 
  tasks, 
  onClose 
}) {
  const versions = projects
    .filter(p => p.name === projectName)
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="technical-card w-full max-w-3xl overflow-hidden bg-white dark:bg-slate-900 border-gold-200 dark:border-gold-900/30"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between luxury-gradient">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gold-500 rounded-lg shadow-lg shadow-gold-500/20">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{projectName}</h2>
              <p className="text-gold-200 text-xs font-mono">Lifecycle Integrity Report</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gold-200 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-auto max-h-[70vh]">
          {versions.map((v, idx) => {
            const versionTasks = tasks.filter(t => t.project === projectName && t.version === v.version);
            const total = versionTasks.length;
            const completed = versionTasks.filter(t => t.status === 'Completed').length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={`${v.version}-${idx}`} className="relative pl-8 pb-8 border-l border-slate-200 dark:border-slate-800 last:pb-0">
                <div className={cn(
                  "absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ring-2 ring-gold-500/30",
                  idx === 0 ? "bg-gold-500" : "bg-slate-300 dark:bg-slate-700"
                )} />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">v{v.version}</span>
                      {idx === 0 && <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded shadow-sm">ACTIVE</span>}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Created: {new Date(v.createdAt || '').toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                      {percent === 100 ? (
                        <span className="status-badge-completed">DELEGATED_DONE</span>
                      ) : (
                        <span className="status-badge-progress">ACTIVE_CORE</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Metrics</p>
                      <p className="text-xs font-mono font-bold">{completed}/{total} Deliverables ({percent}%)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {versionTasks.map((t, tIdx) => (
                    <div key={`${t.name}-${tIdx}`} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        {t.status === 'Completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        )}
                        <span className="text-[11px] font-medium truncate dark:text-slate-300">{t.name}</span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                         <span className="text-[9px] font-mono text-slate-400">
                           {t.status === 'Completed' ? `Done: ${new Date(t.completedAt || '').toLocaleDateString()}` : 'Pending'}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
