// client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Leaf, Users, Camera, BarChart3, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [liveStats, setLiveStats] = useState({
    totalScans: '...',
    activeUsers: '...',
    commonDisease: '...',
    aiAccuracy: '...'
  });
  const [recentScans, setRecentScans] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const statsRes = await axios.get('process.env.REACT_APP_API_URL/api/admin/dashboard-stats', { headers });
        if (statsRes.data.success && statsRes.data.stats) {
          setLiveStats({
            totalScans: statsRes.data.stats.totalScans || statsRes.data.totalScans,
            activeUsers: statsRes.data.stats.totalUsers || statsRes.data.activeUsers,
            commonDisease: statsRes.data.commonDisease || 'Healthy Tissue',
            aiAccuracy: statsRes.data.aiAccuracy || '0.0%'
          });
        } else if (statsRes.data.success) {
          setLiveStats(statsRes.data);
        }

        const scansRes = await axios.get('process.env.REACT_APP_API_URL/api/admin/scans', { headers });
        if (scansRes.data.success) {
          const logs = scansRes.data.scans || scansRes.data.data || [];
          setRecentScans(logs.slice(0, 3));
        }
      } catch (err) {
        console.error("Axios database fetch error:", err);
        setErrorMsg('Failed to update live records from MySQL server.');
      }
    };

    fetchDashboardMetrics();
  }, []);

  const statsConfig = [
    { label: 'Total Scans', value: liveStats.totalScans, icon: <Camera size={24}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Farmers', value: liveStats.activeUsers, icon: <Users size={24}/>, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Common Disease', value: liveStats.commonDisease, icon: <Leaf size={24}/>, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'AI Accuracy', value: liveStats.aiAccuracy, icon: <BarChart3 size={24}/>, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plant AI Dashboard</h1>
          <p className="text-slate-500 text-sm italic">Monitoring crop health and farmer activity across Ethiopia.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border shadow-sm">
           <div className="text-right">
             <p className="text-xs font-bold text-slate-400 uppercase">System Status</p>
             <p className="text-xs text-green-500 font-bold flex items-center gap-1">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
             </p>
           </div>
        </div>
      </header>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 font-medium rounded-xl border border-red-100 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statsConfig.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              {stat.icon}
            </div>
            <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
            <div className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-blue-500"/> Recent Live Detections
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {recentScans.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 italic text-center">No farm scans recorded in MySQL database yet.</p>
          ) : (
            recentScans.map((scan) => (
              <div key={scan.id} className="p-4 hover:bg-slate-50 flex justify-between items-center transition-colors">
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${scan.raw_ai_result === 'Healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                     {scan.disease_name ? scan.disease_name.substring(0, 2).toUpperCase() : (scan.raw_ai_result ? scan.raw_ai_result.substring(0, 2).toUpperCase() : 'AI')}
                   </div>
                   <div>
                     <p className="font-bold text-slate-800">{scan.disease_name || scan.raw_ai_result || 'Unknown Analysis'}</p>
                     <p className="text-xs text-slate-500">Confidence: {scan.confidence_level}% | Crop: {scan.crop_name || 'N/A'}</p>
                   </div>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {scan.scan_date ? new Date(scan.scan_date).toLocaleDateString() : new Date().toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;