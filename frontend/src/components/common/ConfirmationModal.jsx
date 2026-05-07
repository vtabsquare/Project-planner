import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils';

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  variant = 'danger', 
  onConfirm, 
  onClose 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              "p-3 rounded-2xl",
              variant === 'danger' ? "bg-rose-500/10 text-rose-500" : "bg-gold-500/10 text-gold-500"
            )}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {title}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                Security Protocol Required
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8 font-medium">
            {message}
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Abort Mission
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn(
                "flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-opacity-20",
                variant === 'danger' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-gold-600 hover:bg-gold-500 shadow-gold-500/20"
              )}
            >
              Confirm Execution
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
