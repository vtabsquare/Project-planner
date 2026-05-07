import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, Mail, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function CoordinatorsModal({ project, onSave, onDelete, onClose }) {
  const [coordinators, setCoordinators] = useState(project.coordinators || []);
  const [newCoord, setNewCoord] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    setCoordinators(project.coordinators || []);
  }, [project.coordinators]);

  const addCoord = () => {
    if (!newCoord.name || !newCoord.email) return;
    setCoordinators([...coordinators, { ...newCoord }]);
    setNewCoord({ name: '', email: '' });
  };

  const removeCoord = async (email, index) => {
    try {
      setLoading(true);
      console.log(`[FINAL_DEBUG] Proceeding with deletion for: ${email}`);
      if (onDelete) {
        await onDelete(email);
      }
      setCoordinators(prev => prev.filter((_, i) => i !== index));
      setConfirmDelete(null);
    } catch (e) {
      console.error('[FINAL_DEBUG] Delete error:', e);
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    let finalCoords = [...coordinators];
    // Automatically add pending input if not empty
    if (newCoord.name && newCoord.email) {
      finalCoords.push({ ...newCoord });
    }
    
    if (finalCoords.length === 0) {
      alert('Please add at least one coordinator to the batch.');
      return;
    }

    setLoading(true);
    try {
      await onSave(finalCoords);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full technical-card !p-0 border-gold-900/20 shadow-2xl"
      >
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-600/20 rounded-lg">
              <Users className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Project Coordination</h2>
              <p className="text-[9px] font-mono text-gold-200/40 uppercase">Assign Operational Staff</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* List of Coordinators */}
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {coordinators.length === 0 ? (
              <div className="py-8 text-center opacity-30 border-2 border-dashed border-slate-800 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest">No Coordinators Assigned</p>
              </div>
            ) : (
              coordinators.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold-600/10 flex items-center justify-center text-gold-600 font-bold text-xs uppercase">
                      {c.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">{c.name}</p>
                      <p className="text-[9px] font-mono text-slate-500">{c.email}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Form */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Register New Associate</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />
                <input
                  value={newCoord.name}
                  onChange={e => setNewCoord({ ...newCoord, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-gold-500 outline-none transition-all dark:text-white uppercase"
                  placeholder="FULL NAME"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />
                <input
                  type="email"
                  value={newCoord.email}
                  onChange={e => setNewCoord({ ...newCoord, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-gold-500 outline-none transition-all dark:text-white lowercase"
                  placeholder="EMAIL_ADDRESS@DOMAIN.COM"
                />
              </div>
              <button
                onClick={addCoord}
                disabled={!newCoord.name || !newCoord.email}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add to Batch
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-4 bg-gold-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-500 shadow-xl shadow-gold-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> CONFIRM_DEPLOYMENT
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
