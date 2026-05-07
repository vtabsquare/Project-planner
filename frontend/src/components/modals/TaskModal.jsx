import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Calendar, Link2, Filter, BarChart2, CheckCircle2, Circle, Clock, Check, Edit2, Trash2, History } from 'lucide-react';
import DataService from '../../DataService';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function TaskModal({ 
  project, 
  tasks, 
  spreadsheetId, 
  onClose, 
  onRefresh, 
  onShowTaskHistory,
  onConfirm
}) {
  const [newTaskName, setNewTaskName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [selectedDeps, setSelectedDeps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (editingTask) {
      setNewTaskName(editingTask.name);
      setDueDate(editingTask.dueDate || '');
      setPriority(editingTask.priority || 'Medium');
      setSelectedDeps(editingTask.dependencies || []);
    } else {
      setNewTaskName('');
      setDueDate('');
      setPriority('Medium');
      setSelectedDeps([]);
    }
  }, [editingTask]);

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskName) return;
    setLoading(true);
    try {
      const service = DataService.getInstance().getService();
      if (editingTask) {
        await service.updateTask(spreadsheetId || '', editingTask, {
          ...editingTask,
          name: newTaskName,
          dueDate: dueDate || undefined,
          priority: priority,
          dependencies: selectedDeps.length > 0 ? selectedDeps : undefined
        });
        setEditingTask(null);
      } else {
        await service.addTask(spreadsheetId || '', {
          name: newTaskName,
          project: project.name,
          version: project.version,
          status: 'Open',
          dueDate: dueDate || undefined,
          priority: priority,
          dependencies: selectedDeps.length > 0 ? selectedDeps : undefined
        });
      }
      setNewTaskName('');
      setDueDate('');
      setPriority('Medium');
      setSelectedDeps([]);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(true); // Wait for refresh
      setTimeout(() => setLoading(false), 500);
    }
  };

  const deleteTask = (task) => {
    onConfirm({
      title: 'Decommission Objective',
      message: `Are you sure you want to delete "${task.name}"? This will permanently erase its history and progress data.`,
      variant: 'danger',
      onConfirm: async () => {
        setLoading(true);
        try {
          const service = DataService.getInstance().getService();
          await service.deleteTask(spreadsheetId || '', task);
          onRefresh();
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const toggleTask = async (task) => {
    const newStatus = task.status === 'Open' ? 'Completed' : 'Open';
    
    // dependency check
    if (newStatus === 'Completed' && task.dependencies && task.dependencies.length > 0) {
      const unfinishedDeps = task.dependencies.filter(depName => {
        const depTask = tasks.find(t => t.name === depName);
        return depTask && depTask.status !== 'Completed';
      });

      if (unfinishedDeps.length > 0) {
        alert(`ACCESS DENIED: Dependencies [${unfinishedDeps.join(', ')}] must be neutralized first.`);
        return;
      }
    }

    try {
      const service = DataService.getInstance().getService();
      await service.updateTaskStatus(spreadsheetId || '', task, newStatus);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-end">
      <motion.div 
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-gold-900/10 flex flex-col shadow-2xl"
      >
        <div className="p-8 luxury-gradient border-b border-slate-200 dark:border-gold-900/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gold-600 dark:text-gold-300 uppercase tracking-[0.2em] mb-1">Project Name</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{project.name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="px-2 py-0.5 bg-gold-600/10 dark:bg-gold-600/30 text-gold-600 dark:text-gold-200 text-[10px] font-black uppercase rounded border border-gold-400/20">
                v{project.version}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-gold-300/60 uppercase">
                Started: {new Date(project.createdAt || '').toLocaleDateString()}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl text-slate-600 dark:text-white transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-8 h-8 rotate-45" />
          </button>
        </div>

        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <form onSubmit={addTask} className="space-y-4">
            <div className="relative">
              <input 
                autoFocus
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                placeholder="Enter new task name..."
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold tracking-wide focus:ring-2 focus:ring-gold-500/20 transition-all dark:text-white"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Plus className="w-5 h-5 text-gold-500" />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="flex-1">
                <select 
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:outline-none focus:border-gold-500 appearance-none cursor-pointer"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Link2 className="w-3 h-3 text-gold-500" /> Prerequisites
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto p-2 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                {tasks.filter(t => t.status !== 'Completed').map((t, tIdx) => (
                  <button
                    key={`${t.name}-${tIdx}`}
                    type="button"
                    onClick={() => {
                      if (selectedDeps.includes(t.name)) {
                        setSelectedDeps(selectedDeps.filter(d => d !== t.name));
                      } else {
                        setSelectedDeps([...selectedDeps, t.name]);
                      }
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all border",
                      selectedDeps.includes(t.name) 
                        ? "bg-gold-500 text-white border-gold-400" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-300"
                    )}
                  >
                    {t.name}
                  </button>
                ))}
                {tasks.filter(t => t.status !== 'Completed').length === 0 && (
                  <p className="text-[8px] italic text-slate-400 px-2">No active prerequisites available</p>
                )}
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-4 bg-gold-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-500 transition-all shadow-xl shadow-gold-500/20 disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : (editingTask ? 'UPDATE TASK SIGNAL' : 'INITIATE TASK SIGNAL')}
            </button>
            {editingTask && (
              <button 
                type="button"
                onClick={() => setEditingTask(null)}
                className="w-full py-2 text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-4 bg-white dark:bg-slate-900">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Tasks Backlog</h3>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                  Total: {tasks.length}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="FILTER BY SIGNAL..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-gold-500"
                />
              </div>
              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:outline-none focus:border-gold-500 appearance-none cursor-pointer"
              >
                <option value="All">All Signals</option>
                <option value="Open">Active</option>
                <option value="Completed">Neutralized</option>
              </select>
            </div>
          </div>
          
          {filteredTasks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center opacity-10">
              <BarChart2 className="w-16 h-16" />
              <p className="text-xs font-black uppercase tracking-widest mt-4">Buffer Empty</p>
            </div>
          ) : (
            filteredTasks.map((task, idx) => (
              <motion.div 
                key={`${task.name}-${task.project}-${task.version}-${idx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "border p-5 flex items-start gap-5 rounded-2xl transition-all group",
                  task.status === 'Completed' 
                    ? "bg-emerald-50/20 border-emerald-200/20" 
                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-gold-500/30"
                )}
              >
                <button 
                  onClick={() => toggleTask(task)}
                  className={cn(
                    "mt-1.5 transition-all transform active:scale-75",
                    task.status === 'Completed' ? "text-emerald-500" : "text-slate-300 dark:text-slate-600 hover:text-gold-500"
                  )}
                >
                  {task.status === 'Completed' ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn(
                      "text-sm font-bold tracking-tight transition-all truncate",
                      task.status === 'Completed' ? "text-slate-400 dark:text-slate-600 line-through" : "text-slate-900 dark:text-slate-100"
                    )}>
                      {task.name}
                    </p>
                    {task.priority && (
                      <span className={cn(
                        "text-[7px] font-black uppercase px-2 py-0.5 rounded shadow-sm",
                        task.priority === 'Urgent' ? "bg-rose-500 text-white" :
                        task.priority === 'High' ? "bg-amber-500 text-white" :
                        task.priority === 'Medium' ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-600"
                      )}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="text-[9px] font-black font-mono text-slate-400 dark:text-slate-600 uppercase">
                         SIGNAL_{idx + 1}
                       </span>
                       {task.dependencies && task.dependencies.length > 0 && (
                         <div className="flex items-center gap-1">
                           <Link2 className="w-3 h-3 text-gold-500" />
                           <span className="text-[8px] font-bold text-slate-400 truncate max-w-[100px]">
                             Req: {task.dependencies.join(', ')}
                           </span>
                         </div>
                       )}
                       {task.dueDate && (
                         <span className={cn(
                           "text-[9px] font-mono font-bold flex items-center gap-1.5 uppercase",
                           new Date(task.dueDate) < new Date() ? "text-rose-500" : "text-gold-500"
                         )}>
                           <Clock className="w-3 h-3" /> Due: {new Date(task.dueDate).toLocaleDateString()}
                         </span>
                       )}
                       {task.status === 'Completed' && (
                         <span className="text-[9px] font-mono font-bold text-emerald-500 flex items-center gap-1.5">
                           <Check className="w-3 h-3" /> {new Date(task.completedAt || '').toLocaleDateString()}
                         </span>
                       )}
                       <div className="flex items-center gap-3">
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setEditingTask(task);
                           }}
                           className="text-[9px] font-black text-slate-400 hover:text-gold-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                         >
                           <Edit2 className="w-3 h-3" /> Edit
                         </button>
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             deleteTask(task);
                           }}
                           className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                         >
                           <Trash2 className="w-3 h-3" /> Wipe
                         </button>
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             onShowTaskHistory(task);
                           }}
                           className="text-[9px] font-black text-slate-400 hover:text-gold-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                         >
                           <History className="w-3 h-3" /> History
                         </button>
                       </div>
                     </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
