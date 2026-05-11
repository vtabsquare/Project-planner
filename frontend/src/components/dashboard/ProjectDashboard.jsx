import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Database, BarChart2, CheckSquare, Plus,
  Trash2, Edit2, ChevronRight, ChevronDown, Filter, Layers,
  ArrowRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DataService from '../../DataService';
import ProjectRoadmap from './ProjectRoadmap';
import CoordinatorsModal from './CoordinatorsModal';
import { Users, Mail, UserPlus, X } from 'lucide-react';

import { cn } from '../../utils';

export default function ProjectDashboard({
  projects,
  tasks,
  spreadsheetId,
  onRefresh,
  onShowHistory,
  onCloseProject,
  onShowTaskHistory,
  onConfirm,
  setSelectedProject,
  user,
  onToast
}) {
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', version: '', description: '', estimatedCompletionDate: '' });
  const dateInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [dashboardMode, setDashboardMode] = useState('table');
  const [editingProject, setEditingProject] = useState(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('All');
  const [coordinationProject, setCoordinationProject] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase().includes('sanjaysaravanan');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(projectSearch.toLowerCase());
    const matchesStatus = projectStatusFilter === 'All' || p.status === projectStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleProject = (name) => {
    setExpandedProjects(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const projectGroups = projects.reduce((acc, p) => {
    if (!acc[p.name]) acc[p.name] = [];
    acc[p.name].push(p);
    return acc;
  }, {});

  const getStats = (projectName, version) => {
    const projectTasks = tasks.filter(t => t.project === projectName && (!version || t.version === version));
    const completed = projectTasks.filter(t => t.status === 'Completed').length;
    const total = projectTasks.length;
    return {
      total,
      completed,
      percentage: total === 0 ? 0 : (completed / total) * 100
    };
  };

  const avgProgress = projects.length === 0 ? 0 : projects.reduce((acc, p) => acc + getStats(p.name, p.version).percentage, 0) / projects.length;
  const pendingTotal = tasks.filter(t => t.status === 'Open' && projects.some(p => p.name === t.project && p.version === t.version)).length;

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const service = DataService.getInstance().getService();
      if (editingProject) {
        await service.updateProject(spreadsheetId || '', editingProject, newProject);
        setEditingProject(null);
      } else {
        await service.addProject(spreadsheetId || '', newProject);
      }
      setShowAddProject(false);
      setNewProject({ name: '', version: '', description: '', estimatedCompletionDate: '' });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = (p) => {
    // Prevent deleting the last version in a group
    const group = projectGroups[p.name] || [];
    if (group.length <= 1) {
      if (onToast) {
        onToast('Terminal Version Protected: Cannot delete the last remaining version of a project.', 'error');
      } else {
        alert('Cannot delete the last remaining version of a project. Delete the project cluster instead.');
      }
      return;
    }

    onConfirm({
      title: 'Decommission Branch',
      message: `Are you sure you want to delete ${p.name} v${p.version}? This action will permanently wipe all associated task data and cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        setLoading(true);
        try {
          const service = DataService.getInstance().getService();
          await service.deleteProject(spreadsheetId || '', p.name, p.version);
          if (onToast) onToast(`${p.name} v${p.version} eradicated`);
          onRefresh();
        } catch (e) {
          console.error(e);
          if (onToast) onToast(e.message || 'Deletion failed', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleDeleteProjectGroup = (projectName, versions) => {
    onConfirm({
      title: 'Wipe Project Cluster',
      message: `Confirming total eradication of the ${projectName} project cluster. This includes ${versions.length} versions and all associated objectives.`,
      variant: 'danger',
      onConfirm: async () => {
        setLoading(true);
        try {
          const service = DataService.getInstance().getService();
          await service.deleteProjectCluster(spreadsheetId || '', projectName);
          if (onToast) onToast(`Project Cluster ${projectName} eradicated`);
          onRefresh();
        } catch (e) {
          console.error(e);
          if (onToast) onToast(e.message || 'Deletion failed', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const startEditProject = (p) => {
    setEditingProject(p);
    setNewProject({
      name: p.name,
      version: p.version,
      description: p.description || '',
      estimatedCompletionDate: p.estimatedCompletionDate || ''
    });
    setShowAddProject(true);
  };

  const handleSaveCoordinators = async (version, coords) => {
    try {
      const service = DataService.getInstance().getService();
      await service.updateCoordinators(spreadsheetId || '', coordinationProject.name, version, coords);
      onRefresh();
      alert('Coordinators updated and notifications transmitted.');
    } catch (e) {
      console.error(e);
      alert('Failed to update coordinators: ' + e.message);
    }
  };

  const handleRemoveCoordinator = async (email, version) => {
    const ver = version || coordinationProject?.versions?.[0]?.version;
    console.log(`[COORD] Remove ${email} from version ${ver}`);
    try {
      const service = DataService.getInstance().getService();
      await service.removeCoordinator(spreadsheetId || '', coordinationProject.name, ver, email);
      onRefresh();
    } catch (e) {
      console.error('[COORD] Remove failed:', e);
      alert('Delete failed: ' + e.message);
      throw e;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-12 gap-6"
    >
      {/* Top Stats */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="technical-card p-6 border-l-4 border-gold-500">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <LayoutDashboard className="w-3 h-3" /> Total Projects
          </p>
          <p className="text-3xl font-bold dark:text-white">{projects.length}</p>
          <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">Active Release Cycles</p>
        </div>
        <div className="technical-card p-6 border-l-4 border-emerald-500">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <BarChart2 className="w-3 h-3" /> Average Progress
          </p>
          <p className="text-3xl font-bold dark:text-white">{Math.round(avgProgress)}%</p>
          <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">Lifecycle Completion Rate</p>
        </div>
        <div className="technical-card p-6 border-l-4 border-gold-600">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckSquare className="w-3 h-3" /> Pending Tasks
          </p>
          <p className="text-3xl font-bold text-gold-600">{pendingTotal}</p>
          <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">Open Deliverables</p>
        </div>
      </div>

      <div className="col-span-12 technical-card !rounded-2xl border-gold-200/30 dark:border-gold-900/10">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between luxury-gradient">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-600/20 rounded-lg">
              <Database className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white tracking-tight">Project Pipeline</h2>
              <p className="text-[10px] font-mono text-slate-600 dark:text-gold-200/60 uppercase">Managed Development Cycles</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 dark:bg-gold-950/40 p-1 rounded-xl border border-slate-200 dark:border-gold-900/20 shadow-sm">
              <button
                onClick={() => setDashboardMode('table')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  dashboardMode === 'table' ? "bg-gold-600 text-white shadow-lg" : "text-slate-500 dark:text-gold-200/60 hover:text-white"
                )}
              >
                Table View
              </button>
              <button
                onClick={() => setDashboardMode('pipeline')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  dashboardMode === 'pipeline' ? "bg-gold-600 text-white shadow-lg" : "text-slate-500 dark:text-gold-200/60 hover:text-white"
                )}
              >
                Pipeline View
              </button>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setNewProject({ name: '', version: '', description: '', estimatedCompletionDate: '' });
                  setShowAddProject(true);
                }}
                className="px-6 py-2 bg-gold-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-gold-500 active:scale-95 transition-all shadow-xl shadow-gold-900/40"
              >
                Create New Project
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-4">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              placeholder="SEARCH PROJECT REPOSITORY..."
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-gold-500 dark:text-white shadow-sm"
            />
          </div>
          <select
            value={projectStatusFilter}
            onChange={e => setProjectStatusFilter(e.target.value)}
            className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 focus:outline-none focus:border-gold-500 appearance-none cursor-pointer shadow-sm"
          >
            <option value="All">All Cycles</option>
            <option value="Active">Operational</option>
            <option value="Closed">Finalized</option>
          </select>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {dashboardMode === 'table' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] uppercase font-black tracking-widest text-slate-700 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Project Workspace</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4 min-w-[200px]">Lifecycle Progress</th>
                  <th className="px-6 py-4">Total Load</th>
                  <th className="px-6 py-4">Est. Closure</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {Object.entries(projectGroups)
                  .filter(([projectName, versions]) => {
                    const matchesSearch = projectName.toLowerCase().includes(projectSearch.toLowerCase());
                    const matchesStatus = projectStatusFilter === 'All' || versions.some(v => v.status === projectStatusFilter);
                    return matchesSearch && matchesStatus;
                  })
                  .map(([projectName, groupVersions], pIdx) => {
                    const isExpanded = expandedProjects[projectName];
                    const latestVersion = [...groupVersions].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
                    const projectStats = getStats(projectName);

                    return (
                      <React.Fragment key={`${projectName}-${pIdx}`}>
                        {/* Main Project Row */}
                        <tr className="bg-slate-50/30 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="px-6 py-5">
                            <button
                              onClick={() => toggleProject(projectName)}
                              className="flex items-center gap-3 text-left group"
                            >
                              <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 transition-transform duration-300">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                  {projectStats.percentage === 100 && (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                  )}
                                  {projectName}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">{groupVersions.length} Active Branches</span>
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-mono text-slate-400">VARIES</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${projectStats.percentage}%` }}
                                  className="h-full bg-gold-600 rounded-full"
                                />
                              </div>
                              <span className="text-[10px] font-black text-slate-400 font-mono w-10 text-right">
                                {Math.round(projectStats.percentage)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs font-mono text-slate-400">
                            {projectStats.completed}/{projectStats.total}
                          </td>
                          <td className="px-6 py-5 text-[10px] font-mono text-slate-400">
                            {latestVersion.estimatedCompletionDate || 'UNSET'}
                          </td>
                          <td className="px-6 py-5">
                            <span className="status-badge-progress">HIERARCHICAL</span>
                          </td>
                          <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                            {isAdmin && (
                              <button
                                onClick={() => setCoordinationProject({ name: projectName, versions: groupVersions })}
                                className="p-2 text-slate-400 hover:text-gold-600 hover:scale-110 transition-transform"
                                title="Manage Cluster Personnel"
                              >
                                <Users className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setNewProject({ name: projectName, version: '' });
                                setEditingProject(null);
                                setShowAddProject(true);
                              }}
                              className="p-2 text-gold-600 hover:scale-110 transition-transform"
                              title="Deploy New Branch"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteProjectGroup(projectName, groupVersions)}
                                className="p-2 text-rose-500 hover:scale-110 transition-transform"
                                title="Wipe Entire Project Cluster"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Version Roadmap Row (Visible when expanded) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="p-0 border-none bg-slate-50/10 dark:bg-slate-900/10">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-12 py-10">
                                    <ProjectRoadmap versions={groupVersions} tasks={tasks} />

                                    {/* Individual Version Table */}
                                    <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                                      <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-[9px] uppercase font-black tracking-widest text-slate-500">
                                          <tr>
                                            <th className="px-6 py-3">Version Tag</th>
                                            <th className="px-6 py-3">Closure Rate</th>
                                            <th className="px-6 py-3">Est. Closure</th>
                                            <th className="px-6 py-3">Status Matrix</th>
                                            <th className="px-6 py-3">Personnel</th>
                                            <th className="px-6 py-3 text-right">Logistics</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                          {groupVersions.map((v, vIdx) => {
                                            const vStats = getStats(v.name, v.version);
                                            return (
                                              <tr key={vIdx} className="hover:bg-gold-50/10 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                  RELEASE_{v.version.toUpperCase()}
                                                </td>
                                                <td className="px-6 py-4">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-full max-w-[80px] bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                                      <div className="h-full bg-emerald-500" style={{ width: `${vStats.percentage}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500">{Math.round(vStats.percentage)}%</span>
                                                  </div>
                                                </td>
                                                <td className="px-6 py-4 text-[10px] font-mono text-slate-500">
                                                  {v.estimatedCompletionDate || 'PENDING'}
                                                </td>
                                                <td className="px-6 py-4">
                                                  <div className="flex items-center gap-2">
                                                    {v.status === 'Closed' ? (
                                                      <div className="flex flex-col">
                                                        <span className="status-badge-completed">CLOSED</span>
                                                        {v.finalizedAt && (
                                                          <span className="text-[8px] font-mono text-emerald-500 mt-1 uppercase tracking-tighter">
                                                            Date: {new Date(v.finalizedAt).toLocaleDateString()}
                                                          </span>
                                                        )}
                                                      </div>
                                                    ) : isAdmin ? (
                                                      <button
                                                        onClick={() => onCloseProject(v.name, v.version)}
                                                        className={cn(
                                                          "px-3 py-1 border text-[9px] font-black uppercase rounded transition-all shadow-lg",
                                                          vStats.percentage === 100
                                                            ? "bg-gold-600/10 border-gold-600 text-gold-600 hover:bg-gold-600 hover:text-white shadow-gold-500/10"
                                                            : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-gold-600 hover:text-gold-600"
                                                        )}
                                                        title={vStats.percentage === 100 ? "Finalize & Close" : "Force Close Project"}
                                                      >
                                                        {v.status === 'Closed' ? 'CLOSED' : (vStats.percentage === 100 ? 'FINALIZE' : 'FORCE CLOSE')}
                                                      </button>
                                                    ) : (
                                                      <span className="status-badge-progress">{v.status === 'Closed' ? 'CLOSED' : 'ACTIVE'}</span>
                                                    )}

                                                  </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                  <div className="flex -space-x-2">
                                                    {(v.coordinators || []).slice(0, 3).map((c, i) => (
                                                      <div
                                                        key={i}
                                                        className="w-6 h-6 rounded-full bg-slate-800 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[8px] font-black text-gold-500 uppercase"
                                                        title={`${c.name} (${c.email})`}
                                                      >
                                                        {c.name.substring(0, 1)}
                                                      </div>
                                                    ))}
                                                    {(v.coordinators || []).length > 3 && (
                                                      <div className="w-6 h-6 rounded-full bg-gold-600 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[8px] font-black text-white">
                                                        +{(v.coordinators || []).length - 3}
                                                      </div>
                                                    )}
                                                    {(v.coordinators || []).length === 0 && (
                                                      <span className="text-[8px] font-black text-slate-600 uppercase">Unassigned</span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                                  {isAdmin && (
                                                    <>
                                                      <button
                                                        onClick={() => startEditProject(v)}
                                                        className="p-1.5 text-slate-400 hover:text-gold-600 transition-all"
                                                        title="Modify Logistics"
                                                      >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleDeleteVersion(v)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-all"
                                                        title="Decommission Branch"
                                                      >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                    </>
                                                  )}
                                                  <button
                                                    onClick={() => setSelectedProject(v)}
                                                    className="text-[10px] font-black text-slate-400 hover:text-gold-600 uppercase tracking-widest flex items-center justify-end gap-2"
                                                  >
                                                    Details <ArrowRight className="w-3 h-3" />
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                {Object.keys(projectGroups).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <Database className="w-12 h-12 text-slate-400" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Node Clusters Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-8 space-y-16 max-w-full mx-auto px-4 md:px-8">
              <div className="flex flex-col gap-4 mb-8">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gold-500" />
                  Strategic Project Pipeline
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl">
                  A high-level graphical visualization of all project evolutionary trajectories. Each node represents a version release, showing the progression from initiation to finalization.
                </p>
              </div>

              {Object.entries(projectGroups).map(([projectName, groupVersions], pIdx) => (
                <motion.div
                  key={`${projectName}-${pIdx}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold-600/10 flex items-center justify-center text-gold-600 font-black">
                        {projectName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">{projectName}</h4>
                        <p className="text-[10px] font-mono text-slate-500">Established: {new Date(groupVersions[0].createdAt || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Total Iterations</p>
                        <p className="text-lg font-bold dark:text-white leading-none">{groupVersions.length}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Global Progress</p>
                        <p className="text-lg font-bold text-gold-500 leading-none">{Math.round(getStats(projectName).percentage)}%</p>
                      </div>
                    </div>
                  </div>
                  <ProjectRoadmap versions={groupVersions} tasks={tasks} />
                </motion.div>
              ))}

              {Object.keys(projectGroups).length === 0 && (
                <div className="py-20 text-center opacity-20">
                  <Database className="w-16 h-16 mx-auto" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] mt-4">Database Cluster Empty</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddProject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="max-w-md w-full technical-card !p-0 border-gold-900/20"
          >
            <div className="p-6 bg-slate-900 dark:bg-slate-900 border-b border-slate-800 flex items-center gap-3">
              {editingProject ? <Edit2 className="w-5 h-5 text-gold-500" /> : <Plus className="w-5 h-5 text-gold-500" />}
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                {editingProject ? 'Modify Logistics Cluster' : 'Project Registration'}
              </h2>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Project Name</label>
                  <input
                    autoFocus
                    required
                    value={newProject.name}
                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm transition-all focus:border-gold-500 focus:outline-none dark:text-white"
                    placeholder="Project identifier..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Release Version</label>
                  <input
                    required
                    value={newProject.version}
                    onChange={e => setNewProject({ ...newProject, version: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm transition-all focus:border-gold-500 focus:outline-none dark:text-white"
                    placeholder="e.g. 1.0.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Internal Intelligence (Description)</label>
                <textarea
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm transition-all focus:border-gold-500 focus:outline-none dark:text-white h-24 resize-none"
                  placeholder="Describe mission objectives..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Estimated Completion Date</label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                >
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    ref={dateInputRef}
                    value={newProject.estimatedCompletionDate}
                    onChange={e => setNewProject({ ...newProject, estimatedCompletionDate: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm transition-all focus:border-gold-500 focus:outline-none dark:text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
                >
                  ABORT
                </button>
                <button
                  disabled={loading}
                  className="flex-1 py-3 bg-gold-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gold-500 shadow-xl shadow-gold-500/20 active:scale-95 transition-all"
                >
                  {loading ? 'INITIALIZING...' : 'DEPLOY'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Coordinators Modal */}
      <AnimatePresence>
        {coordinationProject && (
          <CoordinatorsModal
            projectGroup={coordinationProject}
            onClose={() => setCoordinationProject(null)}
            onSave={handleSaveCoordinators}
            onDelete={handleRemoveCoordinator}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
