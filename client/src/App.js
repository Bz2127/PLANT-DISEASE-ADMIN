// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Microscope, ClipboardList, BarChart3, Bell, Users, Settings, LogOut } from 'lucide-react';

// Importing all pages mapped directly to your project's file tree
import AdminDashboard from './pages/AdminDashboard'; 
import AddDisease from './pages/AddDisease';
import ScanLog from './pages/ScanLog';
import Analytics from './pages/Analytics';
import NotificationHub from './pages/NotificationHub';
import UserManagement from './pages/UserManagement';
import SettingsPage from './pages/Settings'; 
import AdminAuth from './pages/AdminAuth'; // Secure Gateway Entry Portal Added!

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Read verification keys on initial mounting cycle
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminEmail');
    setIsAuthenticated(false);
  };

  // 1. GATEKEEPER INTERCEPTION: Render Authentication component if credentials aren't established
  if (!isAuthenticated) {
    return <AdminAuth onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  // 2. PROTECTED SPACE: Renders full dashboard canvas configuration safely
  return (
    <Router>
      <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans antialiased">
        
        {/* SIDEBAR NAVIGATION LAYOUT FRAME */}
        <nav className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between border-r border-slate-800/40 shrink-0">
          <div>
            {/* Header Branding Panel */}
            <div className="mb-10 px-2">
              <h1 className="text-xl font-extrabold text-emerald-400 tracking-tight uppercase">Plant AI</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Admin Management Hub</p>
            </div>
            
            {/* Nav Links Stack Column Container */}
            <div className="space-y-1.5">
              <SidebarLink to="/" icon={<LayoutDashboard size={18}/>} label="Dashboard Overview" />
              <SidebarLink to="/scans" icon={<Microscope size={18}/>} label="Scan History & Audit" />
              <SidebarLink to="/diseases" icon={<ClipboardList size={18}/>} label="Disease Lab Base" />
              <SidebarLink to="/analytics" icon={<BarChart3 size={18}/>} label="Regional Analytics" />
              <SidebarLink to="/notifications" icon={<Bell size={18}/>} label="Alerts Broadcast" />
              <SidebarLink to="/users" icon={<Users size={18}/>} label="User Management" />
            </div>
          </div>

          {/* System Settings & Session Terminate Footers */}
          <div className="pt-4 border-t border-slate-800 space-y-1">
             <SidebarLink to="/settings" icon={<Settings size={18}/>} label="System Settings" />
             
             <button
               onClick={handleLogout}
               className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all group"
             >
               <span className="transition-transform duration-200 group-hover:scale-110">
                 <LogOut size={18} />
               </span>
               <span>Exit Terminal</span>
             </button>
          </div>
        </nav>

        {/* MAIN WORKING DISPLAY CANVAS AREA */}
        <main className="flex-1 h-full overflow-y-auto bg-white relative">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/scans" element={<ScanLog />} />
            <Route path="/diseases" element={<AddDisease />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notifications" element={<NotificationHub />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<SettingsPage />} /> 
          </Routes>
        </main>

      </div>
    </Router>
  );
}

// Sub-component wrapper that reads active paths to display highlighted slate styling states dynamically
const SidebarLink = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 group ${
        isActive 
          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
      }`}
    >
      <span className={`transition-transform duration-200 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className={isActive ? 'font-bold' : ''}>{label}</span>
    </Link>
  );
};

export default App;