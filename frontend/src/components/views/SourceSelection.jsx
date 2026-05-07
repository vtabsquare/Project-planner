import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Monitor, ChevronRight, FileSpreadsheet } from 'lucide-react';

export default function SourceSelection({ onSelect }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 overflow-hidden relative">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-slate-800/50 rounded-full blur-3xl"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gold-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-gold-900/40 border border-gold-400/30 -rotate-6">
            <LayoutDashboard className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-1 pt-2">
            <h1 className="text-4xl font-black tracking-tight text-white italic underline decoration-gold-500/50">
              AETHER<span className="text-gold-600 font-normal">TRACKER</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-[0.2em] opacity-60">Professional Project Tracking</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => onSelect('local')}
            className="group p-6 bg-slate-800 border border-slate-700 rounded-2xl hover:border-gold-600 hover:shadow-2xl hover:shadow-gold-900/20 transition-all text-left space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-slate-900 rounded-xl group-hover:bg-gold-600/20 transition-all border border-slate-700 group-hover:border-gold-500/30">
                <Monitor className="w-6 h-6 text-slate-400 group-hover:text-gold-500" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight">Local Mode <span className="text-[10px] font-mono font-black text-gold-500 ml-2 uppercase">OFFLINE</span></h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Standard efficiency workspace. Data is stored locally in your browser. No internet required.</p>
            </div>
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="bg-gold-600 text-[8px] font-mono font-black text-white px-2 py-0.5 rounded-bl">BROWSER CACHE</div>
            </div>
          </button>

          <button 
            onClick={() => onSelect('sheets')}
            className="group p-6 bg-slate-800 border border-slate-700 rounded-2xl hover:border-emerald-600 hover:shadow-2xl hover:shadow-emerald-900/20 transition-all text-left space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-slate-900 rounded-xl group-hover:bg-emerald-600/20 transition-all border border-slate-700 group-hover:border-emerald-500/30">
                <FileSpreadsheet className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight">Google Sheets Mode <span className="text-[10px] font-mono font-black text-emerald-500 ml-2 uppercase">CLOUD_SYNC</span></h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Cloud-based tracking. Synchronize your progress across all devices using Google Sheets.</p>
            </div>
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="bg-emerald-600 text-[8px] font-mono font-black text-white px-2 py-0.5 rounded-bl">GOOGLE DRIVE</div>
            </div>
          </button>
        </div>

        <div className="space-y-4 pt-4">
           <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
           <p className="text-center text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono">
             System Init Sequence v2.1.0 // Security Clearances Active
           </p>
        </div>
      </motion.div>
    </div>
  );
}
