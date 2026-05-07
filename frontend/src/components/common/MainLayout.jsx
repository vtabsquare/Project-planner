import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Bell, ShieldCheck, CheckSquare, Rocket, Settings, 
  RefreshCw, LogOut 
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { SidebarLink } from './SidebarLink';
import { cn } from '../../utils';

export default function MainLayout({ user, refreshing, loadData, onLogout, darkMode, onToggleDark }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(true);

  const activeTab = location.pathname.split('/')[1] || 'dashboard';

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gold-600 rounded flex items-center justify-center text-white font-bold shadow-lg shadow-gold-500/20">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight italic">
            AETHER<span className="text-gold-600 font-normal">TRACKER</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setNotificationsRead(true);
              }}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all relative"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
          
          <ThemeToggle darkMode={darkMode} onToggle={onToggleDark} />
          
          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Node Operator</p>
                <p className="text-xs font-bold tracking-tight">{user.name}</p>
              </div>
              <img src={user.picture} alt="" className="w-8 h-8 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800" />
              <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2 shrink-0 z-30">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2">Workspace Navigation</p>
          <SidebarLink 
            icon={<LayoutDashboard className="w-4 h-4" />} 
            label="Project Matrix" 
            active={activeTab === 'dashboard'} 
            onClick={() => navigate('/dashboard')} 
          />
          <SidebarLink 
            icon={<CheckSquare className="w-4 h-4" />} 
            label="Daily Desk" 
            active={activeTab === 'daily'} 
            onClick={() => navigate('/daily')} 
          />
          <SidebarLink 
            icon={<Rocket className="w-4 h-4" />} 
            label="Launchpad" 
            active={activeTab === 'launchpad'} 
            onClick={() => navigate('/launchpad')} 
          />
          <SidebarLink 
            icon={<Settings className="w-4 h-4" />} 
            label="System Config" 
            active={activeTab === 'settings'} 
            onClick={() => navigate('/settings')} 
          />
          
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
             <div className="px-3">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Sync Status</p>
                <div className="flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full", refreshing ? "bg-gold-500 animate-pulse" : "bg-emerald-500")}></div>
                   <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">{refreshing ? 'Synchronizing...' : 'Live Protocol'}</span>
                </div>
             </div>
             <button 
               onClick={loadData}
               className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[9px] font-black text-slate-500 hover:text-gold-600 transition-all uppercase tracking-widest flex items-center gap-2"
             >
               <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} /> Force Refresh
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
