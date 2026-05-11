import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Users, X, CheckCircle2, ChevronDown, Trash2, Search, Check
} from 'lucide-react';
import api from '../../api';

export default function CoordinatorsModal({ projectGroup, onSave, onDelete, onClose }) {
  const versions = projectGroup?.versions || [];

  // Sort versions: newest first
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const [selectedVersionObj, setSelectedVersionObj] = useState(sortedVersions[0] || null);
  const [coordinators, setCoordinators] = useState(selectedVersionObj?.coordinators || []);
  const [loading, setLoading] = useState(false);
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);

  // All registered users from DB
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Selected users to be added (pending)
  const [pendingSelections, setPendingSelections] = useState([]);

  const pickerRef = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const data = await api.get('/auth/users');
        setAllUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load users:', err);
        setAllUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Update coordinators when selected version changes
  useEffect(() => {
    setCoordinators(selectedVersionObj?.coordinators || []);
    setPendingSelections([]);
  }, [selectedVersionObj]);

  // Users not already assigned as coordinators
  const existingEmails = new Set(coordinators.map(c => (c.email || '').toLowerCase()));
  const availableUsers = allUsers.filter(u =>
    !existingEmails.has((u.email || '').toLowerCase())
  );

  const filteredUsers = availableUsers.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const isPending = (email) => pendingSelections.some(u => u.email === email);

  const togglePending = (user) => {
    if (isPending(user.email)) {
      setPendingSelections(prev => prev.filter(u => u.email !== user.email));
    } else {
      setPendingSelections(prev => [...prev, { name: user.name, email: user.email }]);
    }
  };

  const addPendingToCoordinators = () => {
    if (pendingSelections.length === 0) return;
    setCoordinators(prev => [...prev, ...pendingSelections]);
    setPendingSelections([]);
    setPickerOpen(false);
    setUserSearch('');
  };

  const removeCoord = async (email, index) => {
    try {
      setLoading(true);
      if (onDelete) await onDelete(email, selectedVersionObj?.version);
      setCoordinators(prev => prev.filter((_, i) => i !== index));
    } catch (e) {
      alert('Remove failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedVersionObj) { alert('Select a version first.'); return; }

    // Include any still-pending (not yet added to list)
    const finalCoords = [...coordinators, ...pendingSelections];
    if (finalCoords.length === 0) { alert('Add at least one coordinator.'); return; }

    setLoading(true);
    try {
      await onSave(selectedVersionObj.version, finalCoords);
      onClose();
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const initials = (name = '') => name.substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full technical-card !p-0 border-gold-900/20 shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-600/20 rounded-lg">
              <Users className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Project Coordination</h2>
              <p className="text-[9px] font-mono text-gold-200/40 uppercase">{projectGroup?.name} — Assign Operational Staff</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Version Selector */}
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Select Version</p>
            <div className="relative">
              <button
                onClick={() => setVersionDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-700 hover:border-gold-500 rounded-xl text-xs font-bold text-white transition-all"
              >
                <span>
                  {selectedVersionObj
                    ? `RELEASE_${String(selectedVersionObj.version).toUpperCase()} — ${selectedVersionObj.status || 'Active'}`
                    : 'Select a version...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gold-500 transition-transform ${versionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {versionDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                  {sortedVersions.map((v, i) => (
                    <button key={i}
                      onClick={() => { setSelectedVersionObj(v); setVersionDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold uppercase transition-colors
                        ${selectedVersionObj?.version === v.version ? 'bg-gold-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      RELEASE_{String(v.version).toUpperCase()}
                      <span className={`ml-2 text-[9px] px-2 py-0.5 rounded-full ${v.status === 'Closed' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {v.status || 'Active'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedVersionObj && (
            <>
              {/* Assigned Coordinators */}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Assigned Coordinators <span className="text-gold-500">({coordinators.length})</span>
                </p>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                  {coordinators.length === 0 ? (
                    <div className="py-5 text-center border-2 border-dashed border-slate-800 rounded-xl opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-widest">No Coordinators Assigned</p>
                    </div>
                  ) : coordinators.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50 group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gold-600/20 flex items-center justify-center text-gold-400 font-bold text-[9px]">
                          {initials(c.name)}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-white uppercase">{c.name}</p>
                          <p className="text-[9px] font-mono text-slate-500">{c.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCoord(c.email, i)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Picker */}
              <div ref={pickerRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Add from System Users</p>
                  {pendingSelections.length > 0 && (
                    <button
                      onClick={addPendingToCoordinators}
                      className="text-[9px] font-black text-gold-500 hover:text-gold-400 uppercase tracking-widest flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Add {pendingSelections.length} Selected
                    </button>
                  )}
                </div>

                {/* Search box always visible */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onFocus={() => setPickerOpen(true)}
                    onChange={e => { setUserSearch(e.target.value); setPickerOpen(true); }}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 focus:border-gold-500 rounded-xl text-xs font-bold outline-none transition-all text-white placeholder-slate-600"
                  />
                </div>

                {/* Dropdown user list */}
                {pickerOpen && (
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {usersLoading ? (
                      <div className="p-6 text-center">
                        <div className="w-5 h-5 border-2 border-gold-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {availableUsers.length === 0 ? 'All users already assigned' : 'No matching users'}
                      </div>
                    ) : filteredUsers.map((u, i) => {
                      const selected = isPending(u.email);
                      return (
                        <button
                          key={i}
                          onClick={() => togglePending(u)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-800/50 last:border-0
                            ${selected ? 'bg-gold-600/10' : 'hover:bg-slate-800/50'}`}
                        >
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0
                            ${selected ? 'bg-gold-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {initials(u.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white uppercase truncate">{u.name}</p>
                            <p className="text-[9px] font-mono text-slate-500 truncate">{u.email}</p>
                          </div>
                          {selected && (
                            <Check className="w-4 h-4 text-gold-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Pending badges */}
                {pendingSelections.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pendingSelections.map((u, i) => (
                      <span key={i}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gold-600/20 border border-gold-500/30 text-gold-400 rounded-full text-[9px] font-bold uppercase"
                      >
                        {u.name}
                        <button onClick={() => setPendingSelections(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors">
              CANCEL
            </button>
            <button onClick={handleSave}
              disabled={loading || !selectedVersionObj}
              className="flex-1 py-3.5 bg-gold-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-500 shadow-xl shadow-gold-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CheckCircle2 className="w-4 h-4" /> CONFIRM_DEPLOYMENT</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
