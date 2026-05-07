import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AetherTracker Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-6">
            <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">System Malfunction</h1>
              <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-widest opacity-60">
                A critical exception occurred in the UI render cycle. The platform has been halted to prevent data corruption.
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-left">
              <p className="text-[10px] font-mono text-rose-400 uppercase mb-2">Error Log:</p>
              <p className="text-[10px] font-mono text-slate-500 break-all leading-tight">
                {this.state.error?.message || "Unknown Runtime Error"}
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-gold-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gold-500 transition-all shadow-xl shadow-gold-900/40 active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reboot System
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex-1 py-4 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Exit to Root
              </button>
            </div>
            <p className="text-[9px] text-slate-600 uppercase font-mono font-black tracking-[0.3em]">
              ERR_CODE: UI_RENDER_CRASH // CORE_DUMP_SAVED
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
