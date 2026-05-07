import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, UserPlus, Users, Mail, Lock, User as UserIcon, 
  ShieldCheck, Trash2, Edit2, X, CheckCircle2, AlertCircle,
  Eye, EyeOff, MoreVertical, Search
} from 'lucide-react';
import SheetsService from '../../SheetsService';

export default function SettingsView({ user }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await SheetsService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Decommission entity: ${u.name}?`)) return;
    try {
      await SheetsService.deleteUser(u._id || u.id);
      fetchUsers();
    } catch (error) {
      alert(error.message || 'Decommissioning failure');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 py-8 px-4"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gold-600 rounded-2xl shadow-xl shadow-gold-500/20">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">User Management</h1>
            <p className="text-slate-500 dark:text-gold-200/60 text-xs font-black font-mono mt-1 uppercase tracking-[0.3em]">Manage login credentials and roles</p>
          </div>
        </div>

        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
          >
            <UserPlus className="w-4 h-4" /> Create User
          </button>
        )}
      </div>

      {user?.role === 'admin' ? (
        <div className="technical-card !p-0 overflow-hidden border-gold-900/10 dark:bg-slate-900/50 backdrop-blur-xl">
          {/* Table Search/Filters */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="SEARCH ENTITIES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-gold-500/50 rounded-xl pl-12 pr-4 py-3 text-[10px] font-black uppercase outline-none transition-all dark:text-white"
                />
             </div>
             <div className="text-[10px] font-black text-slate-400 dark:text-gold-200/40 uppercase tracking-widest">
               Total Entities: {users.length}
             </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Login</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingUsers ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="w-8 h-8 border-2 border-gold-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                      No entities found in system matrix
                    </td>
                  </tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={u.picture} alt="" className="w-10 h-10 rounded-xl shadow-md" />
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{u.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        u.role === 'admin' 
                          ? 'bg-gold-500/10 text-gold-600 border border-gold-500/20' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingUser(u)}
                          className="p-2 text-slate-400 hover:text-gold-600 hover:bg-gold-600/10 rounded-lg transition-all"
                          title="Edit Entity"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.email !== user.email && (
                          <button 
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Decommission Entity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center technical-card border-rose-500/20">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Access Denied</h2>
          <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mt-2">Administrative clearance required for system config</p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <UserModal 
            onClose={() => setShowCreateModal(false)} 
            onSuccess={() => { setShowCreateModal(false); fetchUsers(); }}
          />
        )}
        {editingUser && (
          <UserModal 
            userToEdit={editingUser}
            onClose={() => setEditingUser(null)} 
            onSuccess={() => { setEditingUser(null); fetchUsers(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function UserModal({ userToEdit, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: userToEdit?.name || '',
    email: userToEdit?.email || '',
    password: '',
    role: userToEdit?.role || 'user'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!userToEdit && !formData.password)) return;
    
    setLoading(true);
    try {
      if (userToEdit) {
        await SheetsService.updateUser(userToEdit._id, formData);
      } else {
        await SheetsService.createUser(formData);
      }
      onSuccess();
    } catch (error) {
      alert(error.message || 'Operation failure');
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
              <UserPlus className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                {userToEdit ? 'Edit Entity' : 'Initialize Entity'}
              </h2>
              <p className="text-[9px] font-mono text-gold-200/40 uppercase">Provision Credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="space-y-4">
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />
              <input 
                type="text"
                placeholder="FULL NAME"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 focus:border-gold-500 rounded-xl pl-12 pr-4 py-4 text-xs font-bold dark:text-white outline-none transition-all uppercase"
                required
              />
            </div>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />
              <input 
                type="email"
                placeholder="EMAIL ADDRESS"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 focus:border-gold-500 rounded-xl pl-12 pr-4 py-4 text-xs font-bold dark:text-white outline-none transition-all uppercase"
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />
              <input 
                type="password"
                placeholder={userToEdit ? "NEW PASSWORD (LEAVE BLANK TO KEEP)" : "SECURITY KEY (PASSWORD)"}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 focus:border-gold-500 rounded-xl pl-12 pr-4 py-4 text-xs font-bold dark:text-white outline-none transition-all"
                required={!userToEdit}
              />
            </div>
            <div className="relative group">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />
              <select 
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 focus:border-gold-500 rounded-xl pl-12 pr-4 py-4 text-xs font-bold dark:text-white outline-none transition-all appearance-none uppercase"
              >
                <option value="user">STANDARD OPERATOR</option>
                <option value="admin">SYSTEM ADMINISTRATOR</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-2 py-4 bg-gold-600 hover:bg-gold-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-gold-500/20"
            >
              {loading ? 'Processing...' : userToEdit ? 'Save Changes' : 'Provision Access'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
