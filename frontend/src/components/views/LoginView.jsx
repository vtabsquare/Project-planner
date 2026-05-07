import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Mail, Lock, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import SheetsService from '../../SheetsService';

export default function LoginView({ onLoginSuccess, onSwitchToGoogle }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await SheetsService.login(email, password);
      if (data.success) {
        localStorage.setItem('aether_source', 'database');
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold-900/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full z-10"
      >
        <div className="technical-card overflow-hidden !rounded-3xl border-gold-900/20 shadow-2xl">
          <div className="p-8 bg-slate-900 border-b border-slate-800 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gold-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-gold-900/40 border border-gold-400/30">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                AETHER<span className="text-gold-600 font-normal">TRACKER</span>
              </h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Personnel Access Terminal</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-slate-900/50 backdrop-blur-xl">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3"
              >
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{error}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Identifier</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-gold-600 transition-all font-mono"
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-gold-600 transition-all font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gold-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gold-500 transition-all shadow-xl shadow-gold-900/40 active:scale-95 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Establish Connection <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="p-4 bg-slate-950/50 text-center border-t border-slate-800">
             <p className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.3em]">
               SECURE_LINK // RSA_4096_ENCRYPTED
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
