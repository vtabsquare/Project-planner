import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Plus, ArrowLeft, Zap, Monitor, Trash2, ExternalLink, Edit3 } from 'lucide-react';
import DataService from '../../DataService';

export default function LaunchpadView({ 
  items, 
  spreadsheetId, 
  onRefresh,
  onToast
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', version: '', build: '', url: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.url) {
      onToast?.('Name and URL are required for launch', 'error');
      return;
    }
    
    try {
      const service = DataService.getInstance().getService();
      if (editingItem) {
        await service.updateLaunchItem(spreadsheetId || '', editingItem._id, {
          name: formData.name,
          version: formData.version || '1.0.0',
          build: formData.build || 'B1',
          url: formData.url
        });
        onToast?.('Launch parameters updated successfully');
      } else {
        await service.addLaunchItem(spreadsheetId || '', {
          name: formData.name,
          version: formData.version || '1.0.0',
          build: formData.build || 'B1',
          url: formData.url
        });
        onToast?.('New item committed to launchpad');
      }
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Launch operation failed', error);
      onToast?.(error.message || 'Launch operation failed', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', version: '', build: '', url: '' });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ 
      name: item.name, 
      version: item.version, 
      build: item.build, 
      url: item.url 
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Terminate this launch sequence?')) return;
    try {
      const service = DataService.getInstance().getService();
      await service.deleteLaunchItem(spreadsheetId || '', id);
      onToast?.('Launch sequence terminated');
      onRefresh();
    } catch (error) {
      console.error('Termination failed', error);
      onToast?.('Termination failed', 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-full mx-auto space-y-10 py-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gold-600 rounded-2xl shadow-xl shadow-gold-500/20">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Launchpad</h1>
            <p className="text-slate-500 dark:text-gold-200/60 text-xs font-black font-mono mt-1 uppercase tracking-[0.3em]">Deployment Manifest & Gateway</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (isAdding) resetForm();
            else setIsAdding(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 dark:bg-gold-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold-500/10"
        >
          {isAdding ? <ArrowLeft className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'ABORT_OPERATION' : 'INITIATE_NEW_LAUNCH'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdd} className="technical-card p-10 bg-slate-900 border-gold-500/20 mb-12">
              <h3 className="text-sm font-black text-gold-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Zap className="w-4 h-4" /> {editingItem ? 'UPDATE_LAUNCH_PARAMETERS' : 'CONFIG_LAUNCH_PARAMETERS'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Application Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-gold-500 outline-none transition-colors"
                    placeholder="E.g. AetherCore"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Version</label>
                  <input
                    value={formData.version}
                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-gold-500 outline-none transition-colors"
                    placeholder="1.0.0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Build Identifier</label>
                  <input
                    value={formData.build}
                    onChange={e => setFormData({ ...formData, build: e.target.value })}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-gold-500 outline-none transition-colors"
                    placeholder="B2023_01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gateway URL</label>
                  <input
                    required
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-gold-500 outline-none transition-colors"
                    placeholder="https://app.example.com"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-4">
                {editingItem && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-8 py-3 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    CANCEL
                  </button>
                )}
                <button
                  type="submit"
                  className="px-8 py-3 bg-gold-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-500 transition-colors shadow-lg shadow-gold-500/20"
                >
                  {editingItem ? 'UPDATE_LAUNCH_ITEM' : 'COMMIT_LAUNCH_ITEM'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(items || []).map((item, idx) => (
          <motion.div
            key={item._id || idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative"
          >
            <div className="technical-card p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-gold-500/10 hover:border-gold-500/40 transition-all duration-300 shadow-xl dark:shadow-none">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-gold-50 dark:bg-gold-500/5 rounded-2xl">
                  <Monitor className="w-6 h-6 text-gold-600" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-slate-400 hover:text-gold-500 transition-colors"
                    title="Edit Launch Parameters"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Terminate Launch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      v{item.version}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gold-500/10 rounded text-[9px] font-mono font-bold text-gold-600">
                      {item.build}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-4 bg-slate-900 hover:bg-black rounded-xl text-white transition-all group/btn"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">Connect Gateway</span>
                    <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              <div className="absolute bottom-2 right-4">
                <p className="text-[8px] font-mono text-slate-400 font-bold uppercase opacity-30">
                  REF: {item._id?.substring(0, 8) || 'SYSTEM_NODE'}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {(items || []).length === 0 && !isAdding && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30">
            <Rocket className="w-16 h-16 text-slate-400 mb-4" />
            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Launchpad Silo Empty</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
