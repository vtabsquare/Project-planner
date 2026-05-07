import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Filter, CheckCircle2, Circle, Trash2, BarChart2, Calendar, Settings, RefreshCw } from 'lucide-react';
import DataService from '../../DataService';

import { cn } from '../../utils';

export default function DailyDesk({ 
  tasks = [], 
  projects = [], 
  dailyTasks = [], 
  refreshing = false, 
  spreadsheetId = '', 
  onRefresh = () => {},
  onConfirm = () => {},
  user
}) {
  const [newTaskName, setNewTaskName] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    setLoading(true);
    try {
      const service = DataService.getInstance().getService();
      await service.addDailyTask(spreadsheetId || '', newTaskName.trim(), newPriority);
      setNewTaskName('');
      onRefresh();
    } catch (e) {
      console.error('Failed to add daily task:', e);
      alert('SYNCHRONIZATION ERROR: Please check connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task) => {
    const newStatus = task.status === 'Open' ? 'Completed' : 'Open';
    try {
      const service = DataService.getInstance().getService();
      await service.updateDailyStatus(spreadsheetId || '', task.name, newStatus);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteDailyTask = (taskName) => {
    onConfirm({
      title: 'Wipe Daily Signal',
      message: `Permanently remove "${taskName}" from your daily operational performance log?`,
      variant: 'danger',
      onConfirm: async () => {
        setLoading(true);
        try {
          const service = DataService.getInstance().getService();
          await service.deleteDailyTask(spreadsheetId || '', taskName);
          onRefresh();
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const progressPercent = tasks.length === 0 ? 0 : (completedCount / tasks.length) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8"
    >
      {/* Left Column: List */}
      <div className="md:col-span-8 flex flex-col gap-6">
        <div className="technical-card !rounded-2xl border-gold-900/10">
          <div className="p-8 luxury-gradient border-b border-slate-200 dark:border-gold-950/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Daily Tasks</h1>
                <p className="text-slate-500 dark:text-gold-200/60 text-[10px] font-black font-mono mt-1 uppercase tracking-[0.2em]">Operational Performance Tracker</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gold-600 dark:text-gold-300 uppercase tracking-widest mb-1 italic">Completion Delta</p>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {completedCount}/{tasks.length}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
            <form onSubmit={addTask} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input 
                  autoFocus
                  value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  placeholder="Declare new task..."
                  className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black tracking-widest focus:ring-2 focus:ring-gold-500/20 transition-all dark:text-white uppercase"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value)}
                  className="px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:outline-none focus:border-gold-500 appearance-none cursor-pointer flex-1 md:flex-none"
                >
                  <option value="Urgent">URGENT</option>
                  <option value="High">HIGH</option>
                  <option value="Medium">MEDIUM</option>
                  <option value="Low">LOW</option>
                </select>
                <button 
                  type="submit"
                  disabled={loading || !newTaskName.trim()}
                  className="bg-gold-600 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-500 transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 flex-1 md:flex-none whitespace-nowrap"
                >
                  {loading ? 'SYNCING...' : 'ADD OBJECTIVE'}
                </button>
              </div>
            </form>
          </div>

          <div className="p-8 space-y-4 min-h-[400px] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="FILTER BY OBJECTIVE..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-gold-500 dark:text-white"
                />
              </div>
              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:outline-none focus:border-gold-500 appearance-none cursor-pointer"
              >
                <option value="All">All Operations</option>
                <option value="Open">Active</option>
                <option value="Completed">Neutralized</option>
              </select>
            </div>
            
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-200 dark:text-slate-800 space-y-4 italic">
                <Terminal className="w-16 h-16" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Signal Detected</p>
              </div>
            ) : (
              filteredTasks.map((task, idx) => (
                <motion.div 
                  layout
                  key={`${task.name}-${idx}`}
                  className={cn(
                    "group flex items-center gap-5 p-5 rounded-2xl border transition-all",
                    task.status === 'Completed' 
                      ? "bg-slate-50 dark:bg-slate-800/30 border-transparent opacity-60" 
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-gold-500 shadow-sm"
                  )}
                >
                  <button 
                    onClick={() => toggleTask(task)}
                    className={cn(
                      "transition-all transform active:scale-75",
                      task.status === 'Completed' ? "text-emerald-500" : "text-slate-300 dark:text-slate-600 hover:text-gold-500"
                    )}
                  >
                    {task.status === 'Completed' ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className={cn(
                        "font-bold text-sm tracking-tight transition-all uppercase",
                        task.status === 'Completed' ? "text-slate-400 dark:text-slate-600 line-through" : "text-slate-800 dark:text-slate-100"
                      )}>
                        {task.name}
                      </p>
                      {task.priority && (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                          task.priority === 'Urgent' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                          task.priority === 'High' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                          task.priority === 'Medium' ? "bg-gold-500/10 text-gold-500 border border-gold-500/20" :
                          "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                        )}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    {task.status === 'Completed' && (
                      <span className="text-[9px] font-mono text-emerald-500 dark:text-emerald-600 font-bold mt-1 block">
                        RESOLVED @ {new Date(task.completedAt || '').toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDailyTask(task.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-all"
                    title="Wipe Daily Signal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Progress Desk Style */}
      <div className="md:col-span-4 flex flex-col gap-6">
        <div className="bg-slate-900 dark:bg-black rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden border border-gold-900/20">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gold-900/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold-600 rounded-lg">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-[0.1em]">Performance Overview</h2>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Analyze operational throughput to optimize personal efficiency metrics.
              </p>
            </div>

            <div className="py-8 border-y border-white/5 space-y-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-400">Total Completion</span>
                <span className="text-3xl font-black font-mono leading-none italic">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gold-600 rounded-full shadow-[0_0_12px_rgba(245,132,11,0.4)]"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                <div>
                  <p className="text-lg font-black leading-none">{completedCount}</p>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Tasks Done</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_8px_rgba(245,132,11,0.4)]"></div>
                <div>
                  <p className="text-lg font-black leading-none">{tasks.length - completedCount}</p>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Remaining Tasks</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
               <Calendar className="w-4 h-4 text-gold-500" />
               <p className="text-[9px] font-black text-slate-500 font-mono uppercase tracking-[0.2em]">
                 SYSLOG // {new Date().toLocaleDateString()}
               </p>
            </div>
          </div>
        </div>

        <div className="technical-card p-6 flex flex-col gap-5 border-gold-900/10">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gold-500" />
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">System Status</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Data Node ID</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-300 tracking-tighter">
                {spreadsheetId?.substring(0, 12)}...
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Storage Load</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-300 tracking-tighter uppercase underline decoration-gold-500/30">
                {(projects.length + (dailyTasks?.length || 0)) * 0.4} MB
              </span>
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>
            <button 
              onClick={onRefresh}
              className="w-full py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-400 hover:bg-gold-600 hover:text-white hover:border-gold-600 transition-all flex items-center justify-center gap-3 group"
            >
              <RefreshCw className={cn("w-3 h-3 transition-colors", refreshing && "animate-spin")} />
              REFRESH DATA
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
