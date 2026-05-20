// client/src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Map, AlertCircle, RefreshCw, Layers } from 'lucide-react';

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' or 'monthly'
  const [analyticsData, setAnalyticsData] = useState({
    regionalOutbreaks: [],
    aiPerformance: { avgConfidence: 0, delta: 0 },
    topDiseases: []
  });
  const [loading, setLoading] = useState(true);

  // 1. Fetch aggregated calculation data matrices directly from the Express API
  const fetchLiveAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await axios.get(`http://localhost:5000/api/admin/analytics?timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error("Could not read dynamic analytics payload streams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAnalytics();
  }, [timeframe]); // Automatically refetches whenever the timeframe switch updates!

  return (
    <div className="p-6 lg:p-10 bg-slate-50/50 min-h-screen">
      
      {/* Top Header Controls Block Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Regional Insights & Analytics</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Real-time analytical computations aggregated directly from MySQL logs.</p>
        </div>
        
        {/* Real Dynamic Timeframe Filter Toggle Switch */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0 self-start sm:self-center">
          <button 
            onClick={() => setTimeframe('weekly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeframe === 'weekly' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Run
          </button>
          <button 
            onClick={() => setTimeframe('monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeframe === 'monthly' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Run
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white rounded-2xl border border-slate-200/70 shadow-xs">
          <RefreshCw className="w-6 h-6 border-emerald-600 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-slate-400 italic">Aggregating transactional scanning metrics over regional indexes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column A & B (Span 2): Live Regional Incursions / Outbreak Feed */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Map size={18} className="text-emerald-600" /> Regional Hotspots Map
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                Live DB Sync
              </span>
            </div>
            
            <div className="space-y-4">
              {analyticsData.regionalOutbreaks.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-6 text-center">No scanning telemetry registered within this tracking timeframe.</p>
              ) : (
                analyticsData.regionalOutbreaks.map((row, index) => {
                  // Dynamically pick layout color bars depending on structural scanning row indices
                  const colorMap = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-slate-500'];
                  const barColor = colorMap[index % colorMap.length];

                  return (
                    <RegionProgress 
                      key={row.location || index}
                      region={row.location || 'Unknown Region'} 
                      disease={row.dominant_disease || 'Healthy Crop Tissues'} 
                      intensity={row.percentage_share} 
                      count={row.total_scans}
                      color={barColor} 
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Column C (Span 1): Real AI Performance Confidence Matrix */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-slate-800 border border-slate-700 w-fit rounded-xl mb-4 text-emerald-400">
                <TrendingUp size={22} />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white mb-1">AI Performance Matrix</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Calculated average classification confidence value across all target model outputs executed inside this sector window.
              </p>
            </div>

            <div className="my-6">
              <div className="text-5xl font-extrabold tracking-tight text-white">
                {Number(analyticsData.aiPerformance.avgConfidence).toFixed(1)}%
              </div>
              <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${
                analyticsData.aiPerformance.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {analyticsData.aiPerformance.delta >= 0 ? '+' : ''}
                {Number(analyticsData.aiPerformance.delta).toFixed(1)}% compared to historical baselines
              </div>
            </div>
            
            <div className="border-t border-slate-800 pt-4 mt-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Production Margin SLA Target</span>
                <span className="text-white">95.0%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(analyticsData.aiPerformance.avgConfidence, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Full Width Row: Top Identified Pathologies Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm lg:col-span-3">
            <h3 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertCircle size={18} className="text-rose-600" /> Dynamic Disease Vectors Frequency Index
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analyticsData.topDiseases.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-400 italic font-medium">
                  No active infection records mapped to active pathology keys.
                </div>
              ) : (
                analyticsData.topDiseases.map((disease) => (
                  <DiseaseCard 
                    key={disease.id || disease.name}
                    name={disease.name || 'Healthy Diagnostics'} 
                    count={disease.scan_count} 
                    trend={disease.computed_trend || 'stable'} 
                  />
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

// Sub-components: Refactored with data parameters for accuracy
const RegionProgress = ({ region, disease, intensity, count, color }) => (
  <div className="p-4 border border-slate-100 rounded-xl bg-white hover:border-slate-200 transition-all">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
      <div>
        <span className="font-bold text-slate-800 text-sm tracking-tight">{region}</span>
        <span className="text-xs font-semibold text-slate-400 ml-2">({count} Total Scans)</span>
      </div>
      <span className="text-xs font-bold text-slate-500 bg-slate-50 border px-2 py-0.5 rounded-md">
        Dominant: <span className="text-slate-700 font-extrabold">{disease}</span>
      </span>
    </div>
    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/20">
      <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${intensity}%` }}></div>
    </div>
  </div>
);

const DiseaseCard = ({ name, count, trend }) => {
  const trendConfig = {
    up: { label: 'Incursion Risk Rising', style: 'text-rose-600 bg-rose-50 border-rose-100' },
    down: { label: 'Suppression Noted', style: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    stable: { label: 'Baseline Stagnant', style: 'text-slate-500 bg-slate-50 border-slate-100' }
  };

  const activeTrend = trendConfig[trend] || trendConfig.stable;

  return (
    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between min-h-[120px]">
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide truncate">{name}</div>
        <div className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
          {Number(count).toLocaleString()}
        </div>
      </div>
      <div className={`text-[10px] font-bold px-2 py-1 rounded-md w-fit border mt-3 uppercase tracking-wider ${activeTrend.style}`}>
        {activeTrend.label}
      </div>
    </div>
  );
};

export default Analytics;