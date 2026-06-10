// client/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, Lock, CheckCircle2, AlertCircle, Save, KeyRound } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'security'
  const [adminInfo, setAdminInfo] = useState({ email: '', role: 'Admin' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [status, setStatus] = useState({ text: '', isError: false, context: '' });
  const [loading, setLoading] = useState(false);

  // Clear alerts automatically after a few seconds
  useEffect(() => {
    if (status.text) {
      const timer = setTimeout(() => setStatus({ text: '', isError: false, context: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [status.text]);

  // Fetch verified profile parameters on mount
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('process.env.REACT_APP_API_URL/api/admin/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setAdminInfo({
            email: res.data.data.email,
            role: res.data.data.role || 'Admin'
          });
        }
      } catch (err) {
        console.error("Failed to sync profile context:", err);
      }
    };
    fetchAdminProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ text: '', isError: false, context: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('process.env.REACT_APP_API_URL/api/admin/profile/update', 
        { email: adminInfo.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setStatus({ text: res.data.message || 'Profile email updated successfully.', isError: false, context: 'profile' });
      }
    } catch (err) {
      // FIXED: Safely extracting true error strings from backend response streams
      const errorMsg = err.response?.data?.message || err.response?.data?.msg || 'Failed updating profile coordinates.';
      setStatus({ text: errorMsg, isError: true, context: 'profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setStatus({ text: '', isError: false, context: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({ text: 'New password confirmations do not match.', isError: true, context: 'security' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('process.env.REACT_APP_API_URL/api/admin/profile/password', 
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        setStatus({ text: res.data.message || 'Authentication keys updated successfully.', isError: false, context: 'security' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.msg || 'Invalid current credential block.';
      setStatus({ text: errorMsg, isError: true, context: 'security' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 lg:p-12 bg-slate-50 min-h-screen">
      
      {/* Top Standard Dashboard Banner Heading Section */}
      <div className="max-w-5xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage core admin accounts, profile communication logs, and cryptographic safety matrices.</p>
      </div>

      {/* Main Structural Settings Grid Layout */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column Component Layout: Dynamic Sub-Navigation Category Links */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'profile' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
            }`}
          >
            <User size={18} className={activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-450'} />
            Profile Properties
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'security' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
            }`}
          >
            <Shield size={18} className={activeTab === 'security' ? 'text-emerald-600' : 'text-slate-450'} />
            Security & Keys
          </button>
          
          <div className="pt-4 px-4 border-t border-slate-200/80 mt-6">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Access Role</span>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                {adminInfo.role}
              </span>
              <span className="text-xs text-slate-400 font-medium">Root Cluster Node</span>
            </div>
          </div>
        </div>

        {/* Right Column Component Layout: Content View Panel Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 min-h-[400px]">
            
            {/* Context Module View A: Profile Form Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Account Coordinates</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Update the master email identity linked to this administrative node panel.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-5 pt-2">
                  {status.context === 'profile' && status.text && (
                    <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                      status.isError ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {status.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      {status.text}
                    </div>
                  )}

                  <div className="max-w-lg">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Master Superuser Email Address</label>
                    <input 
                      type="email" required
                      value={adminInfo.email}
                      onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })} // Fixed: Added real mutation input binding
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 shadow-inner"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      type="submit" disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                    >
                      <Save size={14} /> {loading ? 'Saving Changes...' : 'Save Profile Email'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Context Module View B: Cryptographic Password Update Panel */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Update Password Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Rotate operational cryptographic authorization keys safely to protect agricultural scan records.</p>
                </div>

                <form onSubmit={handleSecuritySubmit} className="space-y-5 pt-2">
                  {status.context === 'security' && status.text && (
                    <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                      status.isError ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {status.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      {status.text}
                    </div>
                  )}

                  <div className="max-w-lg">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Active Password</label>
                    <input 
                      type="password" required placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Secure Password</label>
                      <input 
                        type="password" required placeholder="Min. 8 characters"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                      <input 
                        type="password" required placeholder="Repeat chosen characters"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      type="submit" disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                    >
                      <KeyRound size={14} /> {loading ? 'Rotating Keys...' : 'Rotate Security Access Key'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;