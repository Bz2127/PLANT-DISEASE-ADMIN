// client/src/pages/ScanLog.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, CheckCircle, AlertCircle, ExternalLink, HelpCircle, FileSpreadsheet } from 'lucide-react';

const ScanLog = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Searching State States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('');
  const [uniqueCrops, setUniqueCrops] = useState([]);

  // 1. Fetch live scanning records from your Node/Express API backend
  const fetchLiveScanLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await axios.get('http://localhost:5000/api/admin/scans', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setScans(res.data.data);
        
        // Extract unique crop names dynamically from live entries to populate our filter button dropdown
        const cropsInLogs = res.data.data
          .map(scan => scan.Crop?.crop_name)
          .filter((cropName, index, self) => cropName && self.indexOf(cropName) === index);
        setUniqueCrops(cropsInLogs);
      }
    } catch (err) {
      console.error("Failed parsing live relational scan database matrices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveScanLogs();
  }, []);

  // 2. Client-side Search and Filter Engine Logic
  const filteredScans = scans.filter(scan => {
    const farmerName = scan.User?.full_name?.toLowerCase() || '';
    const cropName = scan.Crop?.crop_name?.toLowerCase() || '';
    const diseaseName = scan.Disease?.disease_name?.toLowerCase() || 'healthy tissue';
    const matchesSearch = 
      farmerName.includes(searchQuery.toLowerCase()) || 
      diseaseName.includes(searchQuery.toLowerCase());
    
    const matchesCropFilter = selectedCropFilter === '' || scan.Crop?.crop_name === selectedCropFilter;

    return matchesSearch && matchesCropFilter;
  });

  // 3. Simple Real CSV Exporter Function
  const exportLogsToCSV = () => {
    if (filteredScans.length === 0) return;
    
    const headers = ['Scan ID', 'Farmer Name', 'Targeted Crop', 'AI Diagnostic Prediction', 'Confidence Level', 'Scan Timestamp'];
    const rows = filteredScans.map(scan => [
      `SCN-${scan.id}`,
      scan.User?.full_name || 'Unknown Farmer',
      scan.Crop?.crop_name || 'N/A',
      scan.Disease?.disease_name || 'Healthy Tissue',
      `${scan.confidence_level}%`,
      new Date(scan.scan_date).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AI_Scan_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      {/* Top Controls Action Row Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Scan History & AI Audit</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Monitor real-time AI computer vision detections across rural farms.</p>
        </div>
        
        {/* Real-time filtering system tools */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Search Field Bar */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search farmer or disease..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Filter Dropdown Selection Menu */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium gap-2">
            <Filter size={15} className="text-slate-400" />
            <select 
              value={selectedCropFilter} 
              onChange={(e) => setSelectedCropFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold outline-none text-xs cursor-pointer"
            >
              <option value="">All Crops</option>
              {uniqueCrops.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>

          {/* Export Handler Utilities */}
          <button 
            onClick={exportLogsToCSV}
            disabled={filteredScans.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Grid Stack List Component Container */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white p-12 text-center border rounded-xl text-slate-400 italic font-medium animate-pulse">
            Establishing communication link with server logs table cluster entries...
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="bg-white p-16 text-center border-2 border-dashed rounded-xl text-slate-400 italic font-medium">
            No live scanning records match your current filter parameters inside MySQL database matrix.
          </div>
        ) : (
          filteredScans.map((scan) => {
            const confidence = Number(scan.confidence_level);
            const isConfident = confidence > 80;

            return (
              <div 
                key={scan.id} 
                className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-emerald-200 shadow-xs hover:shadow-md hover:shadow-emerald-500/[0.01] transition-all duration-200 flex flex-col md:flex-row md:items-center gap-6"
              >
                {/* Visual Image Render Element Block */}
                <div className="w-24 h-24 rounded-lg bg-slate-100 border overflow-hidden relative group shrink-0 flex items-center justify-center">
                  {scan.image_url ? (
                    <>
                      <img src={scan.image_url} alt="Field sample" className="object-cover w-full h-full" />
                      <a 
                        href={scan.image_url} target="_blank" rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        <ExternalLink size={18} className="text-white" />
                      </a>
                    </>
                  ) : (
                    <HelpCircle className="text-slate-300" size={24} />
                  )}
                </div>

                {/* Farmer & Cross-Table Relational Schema Data Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                    {scan.Crop?.crop_name || 'Unknown Crop Class'}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {scan.ai_predicted_disease_id ? scan.Disease?.disease_name : 'Healthy Tissue (No Pathology Flagged)'}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">
                    Farmer: <span className="text-slate-700 font-bold">{scan.User?.full_name || `Account ID #${scan.user_id}`}</span>
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1.5 bg-slate-100 w-fit px-2 py-0.5 rounded-md">
                    {new Date(scan.scan_date).toLocaleDateString()} • System ID Reference: SCN-{scan.id}
                  </p>
                </div>

                {/* AI Confidence Meter Gauge Row Element */}
                <div className="w-full md:w-48 shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Model Confidence</span>
                    <span className={`text-xs font-bold ${isConfident ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isConfident ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                </div>

                {/* Audit Operational Status Action Tags */}
                <div className="shrink-0 md:pl-4">
                  {isConfident ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                      <CheckCircle size={14}/> Verified Data
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-100">
                      <AlertCircle size={14}/> Review Needed
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ScanLog;