import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Map, AlertCircle, RefreshCw } from 'lucide-react';

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('weekly');
  const [analyticsData, setAnalyticsData] = useState({
    regionalOutbreaks: [],
    aiPerformance: { avgConfidence: 0, delta: 0 },
    topDiseases: []
  });
  const [loading, setLoading] = useState(true);

  const fetchLiveAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/analytics?timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAnalytics();
  }, [timeframe]);

  return (
    <div className="p-6 lg:p-10 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Regional Insights & Analytics</h1>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0 self-start sm:self-center">
          <button 
            onClick={() => setTimeframe('weekly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === 'weekly' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Weekly Run
          </button>
          <button 
            onClick={() => setTimeframe('monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Monthly Run
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white rounded-2xl border border-slate-200/70 shadow-xs">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Map size={18} className="text-emerald-600" /> Regional Hotspots Map
              </h3>
            </div>
            
            <div className="space-y-4">
              {analyticsData.regionalOutbreaks.map((row, index) => (
                <RegionProgress 
                  key={row.location || index}
                  region={row.location} 
                  disease={row.dominant_disease} 
                  intensity={row.percentage_share} 
                  count={row.total_scans}
                  color={['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-slate-500'][index % 4]} 
                />
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-slate-800 border border-slate-700 w-fit rounded-xl mb-4 text-emerald-400">
                <TrendingUp size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">AI Performance Matrix</h3>
            </div>
            <div className="my-6">
              <div className="text-5xl font-extrabold text-white">
                {Number(analyticsData.aiPerformance.avgConfidence).toFixed(1)}%
              </div>
              <div className="text-xs font-bold mt-2 text-emerald-400">
                {analyticsData.aiPerformance.delta >= 0 ? '+' : ''}{Number(analyticsData.aiPerformance.delta).toFixed(1)}% vs historical
              </div>
            </div>
            <div className="border-t border-slate-800 pt-4 mt-2">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${Math.min(analyticsData.aiPerformance.avgConfidence, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm lg:col-span-3">
            <h3 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertCircle size={18} className="text-rose-600" /> Disease Frequency Index
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analyticsData.topDiseases.map((disease, i) => (
                <DiseaseCard 
                  key={i}
                  name={disease.name} 
                  count={disease.scan_count} 
                  trend={disease.computed_trend} 
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RegionProgress = ({ region, disease, intensity, count, color }) => (
  <div className="p-4 border border-slate-100 rounded-xl bg-white">
    <div className="flex justify-between mb-2.5">
      <div>
        <span className="font-bold text-slate-800 text-sm">{region}</span>
        <span className="text-xs font-semibold text-slate-400 ml-2">({count} Scans)</span>
      </div>
      <span className="text-xs font-bold text-slate-700">{disease}</span>
    </div>
    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
      <div className={`${color} h-full`} style={{ width: `${Math.max(intensity, 5)}%` }}></div>
    </div>
  </div>
);

const DiseaseCard = ({ name, count, trend }) => {
  const styles = {
    up: 'text-rose-600 bg-rose-50 border-rose-100',
    down: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    stable: 'text-slate-500 bg-slate-50 border-slate-100'
  };
  return (
    <div className="p-4 bg-slate-50 rounded-xl border flex flex-col justify-between min-h-[120px]">
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase">{name}</div>
        <div className="text-3xl font-extrabold text-slate-800 mt-1">{Number(count).toLocaleString()}</div>
      </div>
      <div className={`text-[10px] font-bold px-2 py-1 rounded-md w-fit border mt-3 uppercase ${styles[trend]}`}>
        {trend}
      </div>
    </div>
  );
};

export default Analytics;