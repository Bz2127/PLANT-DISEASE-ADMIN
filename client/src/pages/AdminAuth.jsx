// client/src/pages/AdminAuth.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Mail, AlertCircle, ShieldAlert, Terminal } from 'lucide-react';

const AdminAuth = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', {
        email,
        password
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('adminEmail', res.data.admin.email);
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 antialiased font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* LEFT PANEL: Project Brand Context (Matches Sidebar Styles) */}
        <div className="w-full md:w-5/12 bg-slate-950 p-8 flex flex-col justify-between text-white border-r border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] tracking-widest font-bold text-slate-400 uppercase">System Core</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-emerald-400 uppercase">Plant AI</h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">Agricultural Pathology Database</p>
          </div>

          <div className="my-8 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs text-slate-400 leading-relaxed font-mono">
              <div className="flex items-center gap-2 text-amber-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                <ShieldAlert size={14} /> Security Protocol
              </div>
              This terminal controls localized crop disease indices, dynamic regional breakout tracking tables, and real-time farmer alerts. Unauthorized access attempts are logged natively.
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono border-t border-slate-900 pt-4">
            <Terminal size={12} />
            <span>Node Cluster: Active</span>
          </div>
        </div>

        {/* RIGHT PANEL: Pure Credentials Login Form */}
        <div className="w-full md:w-7/12 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Sign In</h2>
            <p className="text-slate-500 text-sm mt-1">Provide master administrative access credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-start gap-2.5 text-xs font-semibold">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Mail size={16} />
                </span>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all duration-150 font-medium text-slate-800"
                  placeholder="admin@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Lock size={16} />
                </span>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all duration-150 font-medium text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-xs transition-all duration-150 uppercase tracking-wider shadow-md active:scale-[0.99] mt-2"
            >
              {loading ? 'Decrypting Access Token...' : 'Authorize Session'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminAuth;