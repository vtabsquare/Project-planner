import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-3xl flex items-center justify-center mx-auto">
          <LayoutDashboard className="w-10 h-10 text-slate-600" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gold-600 uppercase tracking-[0.4em]">Signal Lost</p>
          <h1 className="text-7xl font-black text-white italic">404</h1>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Node Not Found in Matrix</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gold-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gold-500 transition-all shadow-xl shadow-gold-900/30 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Base
        </button>
        <p className="text-[9px] font-mono text-slate-700 uppercase tracking-[0.3em]">ERR_NODE_UNREACHABLE // PATH_INVALID</p>
      </motion.div>
    </div>
  );
}
