import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Bell, ShieldCheck, Database, FileSpreadsheet, RefreshCw, 
  Settings, LogOut, CheckCircle2, Circle, History, Monitor, Globe, Download,
  CheckSquare, Rocket, Zap, AlertTriangle
} from 'lucide-react';
import { cn } from './utils';

import SheetsService from './SheetsService';
import DataService from './DataService';

// Common Components
import { ThemeToggle } from './components/common/ThemeToggle';
import { SidebarLink } from './components/common/SidebarLink';
import MainLayout from './components/common/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import TaskModal from './components/dashboard/TaskModal';
import ConfirmationModal from './components/common/ConfirmationModal';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DailyDeskPage from './pages/DailyDeskPage';
import LaunchpadPage from './pages/LaunchpadPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';


export default function App() {
  const [source, setSource] = useState(() => localStorage.getItem('aether_source') || 'database');
  const [user, setUser] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('aether_spreadsheet_id'));
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('aether_theme') === 'dark');
  const [showInspector, setShowInspector] = useState(false);
  const [historyView, setHistoryView] = useState(null);
  const [historyTask, setHistoryTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [authMode, setAuthMode] = useState('email');
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [launchItems, setLaunchItems] = useState([]);

  useEffect(() => {
    DataService.getInstance().setSource(source);
    
    // Auto-switch to database if logged in and not already on database
    if (user && source !== 'database') {
      setSource('database');
      localStorage.setItem('aether_source', 'database');
    }

    if (source === 'sheets' || source === 'database') {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    if (source === 'local') {
      loadData();
    } else if ((source === 'sheets' || source === 'database') && user) {
      loadData();
    }
  }, [user, spreadsheetId, source]);

  const checkAuth = async () => {
    try {
      const profile = await SheetsService.getProfile();
      setUser(profile);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const data = await DataService.getInstance().getData();
      setProjects(data.projects || []);
      setTasks(data.tasks || []);
      setDailyTasks(data.dailyTasks || []);
      setLaunchItems(data.launchItems || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await SheetsService.logout();
    setUser(null);
    window.location.href = '/';
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCloseProject = async (name, version) => {
    try {
      const service = DataService.getInstance().getService();
      await service.closeProject(spreadsheetId || '', name, version);
      showToast(`${name} v${version} finalized`);
      loadData();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const connectSpreadsheet = async () => {
    setLoading(true);
    try {
      let sheet = await SheetsService.findSpreadsheet();
      if (!sheet) {
        sheet = await SheetsService.createSpreadsheet();
      }
      setSpreadsheetId(sheet.id);
      localStorage.setItem('aether_spreadsheet_id', sheet.id);
      showToast('Cloud Database Synchronized');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-gold-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-gold-500/20"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className={cn(darkMode && "dark")}>
        <Routes>
          {/* Entry Point: Login or Dashboard */}
          <Route
            path="/"
            element={
              user ? <Navigate to="/dashboard" replace /> : (
                <LoginPage
                  onLoginSuccess={(u) => setUser(u)}
                  onSwitchToGoogle={() => setAuthMode('google')}
                />
              )
            }
          />

          {/* Legacy Login Redirect */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Protected: ProtectedRoute guards, MainLayout provides shell */}
          <Route element={<ProtectedRoute user={user} loading={loading} />}>
            <Route element={
              <MainLayout
                user={user}
                refreshing={refreshing}
                loadData={loadData}
                onLogout={handleLogout}
                darkMode={darkMode}
                onToggleDark={() => {
                  const next = !darkMode;
                  setDarkMode(next);
                  localStorage.setItem('aether_theme', next ? 'dark' : 'light');
                }}
              />
            }>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <DashboardPage
                    user={user}
                    projects={projects}
                    tasks={tasks}
                    spreadsheetId={spreadsheetId}
                    onRefresh={loadData}
                    onShowHistory={setHistoryView}
                    onShowTaskHistory={setHistoryTask}
                    setSelectedProject={setSelectedProject}
                    onCloseProject={handleCloseProject}
                    onConfirm={setConfirmConfig}
                    onToast={showToast}
                  />
                }
              />
              <Route 
                path="/daily" 
                element={
                  <DailyDeskPage 
                    tasks={dailyTasks} 
                    projects={projects}
                    refreshing={refreshing}
                    spreadsheetId={spreadsheetId}
                    onRefresh={loadData} 
                    onConfirm={setConfirmConfig}
                  />
                } 
              />
              <Route 
                path="/launchpad" 
                element={
                  <LaunchpadPage 
                    items={launchItems}
                    spreadsheetId={spreadsheetId}
                    onRefresh={loadData}
                    onToast={showToast}
                  />
                } 
              />
              <Route path="/settings" element={
                <SettingsPage 
                  user={user} 
                  onLogout={handleLogout} 
                  source={source}
                  spreadsheetId={spreadsheetId}
                  onShowInspector={() => setShowInspector(true)}
                />
              } />
            </Route>
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Global UI Elements (Modals, Toasts) */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className="fixed bottom-10 left-1/2 z-[300] min-w-[300px]"
            >
              <div className={cn(
                "px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 backdrop-blur-md",
                toast.type === 'error' ? "bg-rose-500/90 border-rose-400" : "bg-slate-900/90 border-slate-700"
              )}>
                <div className={cn("p-2 rounded-lg", toast.type === 'error' ? "bg-white/20" : "bg-gold-600/20 text-gold-500")}>
                  {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-white" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">System Signal</p>
                  <p className="text-xs font-bold text-white">{toast.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Modals */}
        <AnimatePresence>
          {selectedProject && (
            <TaskModal
              project={selectedProject}
              tasks={tasks}
              spreadsheetId={spreadsheetId}
              onRefresh={loadData}
              onClose={() => setSelectedProject(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmConfig && (
            <ConfirmationModal
              isOpen={!!confirmConfig}
              title={confirmConfig.title}
              message={confirmConfig.message}
              variant={confirmConfig.variant}
              onConfirm={confirmConfig.onConfirm}
              onClose={() => setConfirmConfig(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}
