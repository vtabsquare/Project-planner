import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, Trash2, CheckCircle2, Circle, Terminal,
  AlertTriangle, Filter, Hash, Calendar, Layers,
  Edit3, History, Search, ChevronRight, Clock, Zap,
  ArrowUp
} from 'lucide-react';
import { cn } from '../../utils';
import DataService from '../../DataService';

export default function TaskModal({ project, tasks, onClose, onRefresh, spreadsheetId, user }) {
  const scrollContainerRef = useRef(null);
  const dateInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Task Form State
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM PRIORITY');
  const [prereqInput, setPrereqInput] = useState('');
  const [prerequisites, setPrerequisites] = useState([]);
  const [dependsOn, setDependsOn] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  const projectTasks = tasks.filter(t => t.project === project.name && t.version === project.version);

  const filteredTasks = projectTasks.filter(t => {
    const matchesFilter = filter === 'All' || t.status === filter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddPrereq = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      if (e.key === ' ' && prereqInput.trim() === '') return;
      e.preventDefault();
      const val = prereqInput.trim().replace(',', '');
      if (val && !prerequisites.includes(val)) {
        setPrerequisites([...prerequisites, val]);
      }
      setPrereqInput('');
    }
  };

  const handlePrereqBlur = () => {
    const val = prereqInput.trim().replace(',', '');
    if (val && !prerequisites.includes(val)) {
      setPrerequisites([...prerequisites, val]);
    }
    setPrereqInput('');
  };

  const removePrereq = (tag) => {
    setPrerequisites(prerequisites.filter(p => p !== tag));
  };

  const resetForm = () => {
    setTaskName('');
    setDueDate('');
    setPriority('MEDIUM PRIORITY');
    setPrerequisites([]);
    setDependsOn([]);
    setEditingTask(null);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    setLoading(true);
    try {
      const service = DataService.getInstance().getService();
      const taskData = {
        project: project.name,
        version: project.version,
        name: taskName.trim(),
        status: editingTask ? editingTask.status : 'Open',
        priority: priority.replace(' PRIORITY', ''),
        dueDate: dueDate || null,
        prerequisites: prerequisites,
        dependsOn: dependsOn
      };

      if (editingTask) {
        await service.updateTask(spreadsheetId || '', editingTask, taskData);
      } else {
        await service.addTask(spreadsheetId || '', taskData);
      }

      resetForm();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task) => {
    const newStatus = task.status === 'Open' ? 'Completed' : 'Open';

    // Proactive frontend check for prerequisites & dependencies
    if (newStatus === 'Completed') {
      const unfinishedNames = (task.prerequisites || []).filter(name => {
        const normalizedPrereq = name.toLowerCase().trim();
        const t = projectTasks.find(pt => {
          const normalizedTaskName = pt.name.toLowerCase().trim();
          return normalizedTaskName === normalizedPrereq || normalizedTaskName.startsWith(normalizedPrereq);
        });
        return !t || t.status !== 'Completed';
      });

      const unfinishedIds = (task.dependsOn || []).filter(id => {
        const t = projectTasks.find(pt => pt._id === id);
        return !t || t.status !== 'Completed';
      });

      if (unfinishedNames.length > 0 || unfinishedIds.length > 0) {
        const blockers = [...new Set([
          ...unfinishedNames,
          ...unfinishedIds.map(id => projectTasks.find(t => t._id === id)?.name || 'Unknown Task')
        ])];

        alert(`Access Denied: Prerequisites required [${blockers.join(', ')}] must be finalized before this signal can be marked as COMPLETED.`);
        return;
      }
    }

    try {
      const service = DataService.getInstance().getService();
      await service.updateTaskStatus(spreadsheetId || '', task, newStatus);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || e.message || 'Update failed');
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm('Wipe this task signal permanently?')) return;
    try {
      const service = DataService.getInstance().getService();
      await service.deleteTask(spreadsheetId || '', task);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setTaskName(task.name);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setPriority(`${task.priority.toUpperCase()} PRIORITY`);
    setPrerequisites(task.prerequisites || []);
    setDependsOn(task.dependsOn || []);
    // Scroll form into view if needed
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-[500] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl bg-[#0f172a] shadow-2xl flex flex-col h-full border-l border-slate-800 overflow-y-auto custom-scrollbar"
        ref={scrollContainerRef}
      >
        {/* Header Section */}
        <div className="p-8 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-b border-slate-800 shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gold-500 uppercase tracking-[0.3em]">Project Name</p>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">{project.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-0.5 bg-gold-600 text-white text-[10px] font-black rounded uppercase">v{project.version}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gold-500" /> Start: {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Task Form */}
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="relative group">
              <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 group-focus-within:scale-110 transition-transform" />
              <input
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                placeholder="Enter new task name..."
                className="w-full bg-[#020617]/50 border border-slate-800 focus:border-gold-500 rounded-xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all uppercase font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div 
                 className="relative cursor-pointer"
                 onClick={() => dateInputRef.current?.showPicker?.()}
               >
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="date"
                   ref={dateInputRef}
                   value={dueDate}
                   onChange={e => setDueDate(e.target.value)}
                   className="w-full bg-[#020617]/50 border border-slate-800 focus:border-gold-500 rounded-xl pl-12 pr-4 py-4 text-[10px] text-white outline-none transition-all uppercase font-black tracking-widest cursor-pointer"
                 />
              </div>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-[#020617]/50 border border-slate-800 focus:border-gold-500 rounded-xl px-6 py-4 text-[10px] text-white outline-none transition-all uppercase font-black tracking-widest appearance-none cursor-pointer"
              >
                <option value="URGENT PRIORITY">URGENT PRIORITY</option>
                <option value="HIGH PRIORITY">HIGH PRIORITY</option>
                <option value="MEDIUM PRIORITY">MEDIUM PRIORITY</option>
                <option value="LOW PRIORITY">LOW PRIORITY</option>
              </select>
            </div>

            <div className="space-y-3 relative">
              <div className="flex items-center gap-2 px-1">
                <Hash className="w-3 h-3 text-gold-500" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prerequisites</p>
              </div>
              <div className="bg-[#020617]/50 border border-slate-800 rounded-xl p-3 min-h-[60px] focus-within:border-gold-500 transition-all">
                <div className="flex flex-wrap gap-2 mb-2">
                  {prerequisites.map(p => (
                    <span key={p} className="px-2 py-1 bg-gold-600/10 text-gold-500 text-[9px] font-black uppercase rounded flex items-center gap-2 border border-gold-500/20">
                      {p} <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => removePrereq(p)} />
                    </span>
                  ))}
                </div>
                <input
                  value={prereqInput}
                  onChange={e => {
                    const val = e.target.value;
                    setPrereqInput(val);
                    // Instant auto-tagging if it matches an existing task name exactly
                    const match = projectTasks.find(t => t.name.toLowerCase() === val.trim().toLowerCase());
                    if (match) {
                      if (!dependsOn.includes(match._id)) {
                        setDependsOn([...dependsOn, match._id]);
                        setPrerequisites([...prerequisites, match.name]);
                      }
                      setPrereqInput('');
                    }
                  }}
                  onKeyDown={handleAddPrereq}
                  onBlur={handlePrereqBlur}
                  placeholder="Type to find signals..."
                  className="bg-transparent border-none outline-none text-xs text-white w-full uppercase font-bold"
                />
              </div>

              {/* Suggestions Dropdown */}
              {prereqInput && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-40 overflow-y-auto">
                  {projectTasks
                    .filter(t => t.name.toLowerCase().includes(prereqInput.toLowerCase()) && !prerequisites.includes(t.name))
                    .map(t => (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => {
                          if (!dependsOn.includes(t._id)) {
                            setDependsOn([...dependsOn, t._id]);
                            setPrerequisites([...prerequisites, t.name]);
                          }
                          setPrereqInput('');
                        }}
                        className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-300 uppercase hover:bg-gold-600 hover:text-white transition-colors border-b border-slate-800 last:border-none"
                      >
                        {t.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !taskName.trim()}
              className="w-full py-4 bg-gradient-to-r from-gold-700 to-gold-600 hover:from-gold-600 hover:to-gold-500 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-gold-900/40 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing...' : editingTask ? 'Update Task Signal' : 'Initiate Task Signal'}
            </button>
            {editingTask && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Backlog Section */}
        <div className="p-8 space-y-6 bg-[#0f172a]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Tasks Backlog</h3>
            <span className="text-[10px] font-mono text-slate-500">STS: {projectTasks.length}</span>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by signal..."
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-[10px] text-white uppercase font-bold outline-none focus:border-gold-500/50"
              />
            </div>
            <button className="px-4 py-2 bg-slate-800 text-slate-400 text-[10px] font-black uppercase rounded-lg hover:text-white transition-colors">
              All Signals
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, idx) => {
                const isBlocked = task.status !== 'Completed' && (
                  (task.dependsOn || []).some(id => projectTasks.find(t => t._id === id)?.status !== 'Completed') ||
                  (task.prerequisites || []).some(name => {
                    const normalizedPrereq = name.toLowerCase().trim();
                    const pt = projectTasks.find(t => {
                      const normalizedTaskName = t.name.toLowerCase().trim();
                      return normalizedTaskName === normalizedPrereq || normalizedTaskName.startsWith(normalizedPrereq);
                    });
                    return !pt || pt.status !== 'Completed';
                  })
                );

                return (
                  <motion.div
                    layout
                    key={task._id || idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => toggleTask(task)}
                    className={cn(
                      "relative group bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 hover:border-gold-500/30 transition-all cursor-pointer",
                      task.status === 'Completed' && "opacity-60",
                      isBlocked && "border-rose-500/10 grayscale-[0.5]"
                    )}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={cn(
                          "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                          task.status === 'Completed'
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            : isBlocked
                              ? "border-slate-800 bg-slate-900/50 text-slate-700"
                              : "border-slate-700 hover:border-gold-500"
                        )}
                      >
                        {task.status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : isBlocked ? <X className="w-2 h-2" /> : <div className="w-1 h-1 rounded-full bg-slate-700" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={cn(
                            "text-sm font-black tracking-tight truncate",
                            task.status === 'Completed' ? "line-through text-slate-500" : "text-white"
                          )}>
                            {task.name}
                          </h4>
                          <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-[8px] font-black rounded-lg uppercase tracking-widest border border-cyan-500/20">
                            Signal_{idx + 1}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">
                          <span className={cn(
                            "flex items-center gap-1.5",
                            task.priority === 'URGENT' ? "text-rose-500" :
                              task.priority === 'HIGH' ? "text-orange-500" :
                                task.priority === 'LOW' ? "text-emerald-500" : "text-gold-500"
                          )}>
                            <AlertTriangle className="w-3 h-3" /> INC: {task.priority || 'MEDIUM'}
                          </span>
                          <span className={cn(
                            "flex items-center gap-1.5",
                            task.dueDate ? "text-rose-500/90 font-black" : "text-slate-600/50"
                          )}>
                            <Clock className="w-3 h-3" /> DUE: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'NOT SET'}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(task)}
                              className="flex items-center gap-1 hover:text-gold-500 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => deleteTask(task)}
                              className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Wipe
                            </button>
                            <button className="flex items-center gap-1 hover:text-white transition-colors">
                              <History className="w-3 h-3" /> History
                            </button>
                          </div>
                        </div>

                        {task.prerequisites && task.prerequisites.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {task.prerequisites.map(p => (
                              <span key={p} className="text-[8px] text-slate-600 border border-slate-800 px-1.5 py-0.5 rounded uppercase font-mono">
                                #{p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredTasks.length === 0 && (
              <div className="py-20 text-center space-y-4 opacity-10">
                <Terminal className="w-16 h-16 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Signal Detected</p>
              </div>
            )}

            {projectTasks.length > 3 && (
              <div className="pt-10 pb-20 flex justify-center">
                <button
                  onClick={scrollToTop}
                  className="group flex flex-col items-center gap-3 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-gold-500/50 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all">
                    <ArrowUp className="w-5 h-5 text-slate-500 group-hover:text-gold-500 transition-colors" />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-gold-500 transition-colors">Return to Summit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
