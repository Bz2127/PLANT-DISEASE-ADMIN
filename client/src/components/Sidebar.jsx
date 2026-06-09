// client/src/components/Sidebar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldAlert, Sprout, Users, Camera, Bell, FileText, BarChart3, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  return (
    <div className="w-64 bg-slate-950 text-slate-200 h-screen flex flex-col justify-between border-r border-slate-900 shadow-xl font-medium">
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-slate-900">
          <div className="p-2 bg-emerald-500 rounded-xl text-slate-950 shadow-md shadow-emerald-500/20">
            <Sprout size={20} className="font-bold" />
          </div>
          <h2 className="text-lg font-bold tracking-wider text-white">PLANT AI</h2>
        </div>
        
        <nav className="flex flex-col gap-1.5 p-4 mt-4">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-sm group">
            <LayoutDashboard size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            Dashboard Overview
          </Link>
          <Link to="/diseases" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-sm group">
            <ShieldAlert size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            Disease Library
          </Link>
          <Link to="/crops" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-sm group">
            <Sprout size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            Crop Management
          </Link>
          <Link to="/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-sm group">
            <Users size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            User Monitoring
          </Link>
          <Link to="/scans" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-sm group">
            <Camera size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            Scan History (AI Audit)
          </Link>
          <Link to="/notifications" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-sm group">
            <Bell size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            Notification Hub
          </Link>
          <Link to="/cms" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-sm group">
            <FileText size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            Content (CMS)
          </Link>
          <Link to="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-sm group">
            <BarChart3 size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            Analytics & Reports
          </Link>
        </nav>
      </div>

      <div className="p-4 border-t border-slate-900">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all text-sm font-semibold group"
        >
          <LogOut size={18} className="text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          Secure Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;