import React from 'react';
import { motion } from 'motion/react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ProjectRoadmap({ versions, tasks }) {
  const sortedVersions = [...versions].sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));

  return (
    <div className="relative pt-12 pb-8 px-4">
      {/* Connector Line */}
      <div className="absolute top-[68px] left-8 right-8 h-0.5 bg-gradient-to-r from-gold-500/20 via-gold-500/40 to-gold-500/20 hidden md:block" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-4 relative">
        {sortedVersions.map((v, idx) => {
          const versionTasks = tasks.filter(t => t.project === v.name && t.version === v.version);
          const completed = versionTasks.filter(t => t.status === 'Completed').length;
          const total = versionTasks.length;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          const isClosed = v.status === 'Closed';

          return (
            <div key={v.version} className="flex-1 w-full md:w-auto relative group">
              {/* Node */}
              <div className="flex md:flex-col items-center gap-6 md:gap-4">
                <div className="relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-4 z-10 relative transition-all duration-500",
                      isClosed ? "bg-emerald-500 border-emerald-100 dark:border-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                      percent === 100 ? "bg-gold-500 border-gold-100 dark:border-gold-950 shadow-[0_0_15px_rgba(245,132,11,0.3)]" :
                      "bg-slate-200 dark:bg-slate-800 border-white dark:border-slate-900"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-black font-mono",
                      isClosed || percent === 100 ? "text-white" : "text-slate-500"
                    )}>
                      {idx + 1}
                    </span>
                  </motion.div>
                  {percent > 0 && !isClosed && (
                    <svg className="absolute -inset-2 w-14 h-14 -rotate-90">
                       <circle
                         cx="28"
                         cy="28"
                         r="24"
                         fill="transparent"
                         stroke="currentColor"
                         strokeWidth="2"
                         strokeDasharray={2 * Math.PI * 24}
                         strokeDashoffset={2 * Math.PI * 24 * (1 - percent / 100)}
                         className="text-gold-500/40"
                       />
                    </svg>
                  )}
                </div>

                <div className="flex flex-col md:items-center text-left md:text-center space-y-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    v{v.version}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate max-w-[120px]">
                    {isClosed ? 'RELEASE_DEPLOYED' : percent === 100 ? 'READY_FOR_SHIP' : 'IN_DEVELOPMENT'}
                  </h5>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-gold-500">{percent}%</span>
                    <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-gold-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
