import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, CheckCircle, AlertCircle, ExternalLink, HelpCircle, FileSpreadsheet } from 'lucide-react';

const ScanLog = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('');
  const [uniqueCrops, setUniqueCrops] = useState([]);

  const fetchLiveScanLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await axios.get('http://localhost:5000/api/admin/scans', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setScans(res.data.data);
        
        // Extract unique crop names from the flattened controller data
        const cropsInLogs = res.data.data
          .map(scan => scan.crop_name)
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

  // Updated Filter Logic to use flattened backend data
  const filteredScans = scans.filter(scan => {
    const farmerName = scan.user_name?.toLowerCase() || '';
    const cropName = scan.crop_name?.toLowerCase() || '';
    const diseaseName = scan.disease_name?.toLowerCase() || 'healthy tissue';
    
    const matchesSearch = 
      farmerName.includes(searchQuery.toLowerCase()) || 
      diseaseName.includes(searchQuery.toLowerCase());
    
    const matchesCropFilter = selectedCropFilter === '' || scan.crop_name === selectedCropFilter;

    return matchesSearch && matchesCropFilter;
  });

  const exportLogsToCSV = () => {
    if (filteredScans.length === 0) return;
    
    const headers = ['Scan ID', 'Farmer Name', 'Targeted Crop', 'AI Diagnostic Prediction', 'Confidence Level', 'Scan Timestamp'];
    const rows = filteredScans.map(scan => [
      `SCN-${scan.id}`,
      scan.user_name || 'Unknown Farmer',
      scan.crop_name || 'N/A',
      scan.disease_name || 'Healthy Tissue',
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Scan History & AI Audit</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Monitor real-time AI computer vision detections across rural farms.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search farmer or disease..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

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

          <button 
            onClick={exportLogsToCSV}
            disabled={filteredScans.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white p-12 text-center border rounded-xl text-slate-400 italic font-medium animate-pulse">
            Establishing communication link...
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="bg-white p-16 text-center border-2 border-dashed rounded-xl text-slate-400 italic font-medium">
            No live scanning records found.
          </div>
        ) : (
          filteredScans.map((scan) => {
            const confidence = Number(scan.confidence_level);
            const isConfident = confidence > 80;

            return (
              <div key={scan.id} className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-emerald-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
                {/* Visual Image Render Element Block */}
                <div className="w-24 h-24 rounded-lg bg-slate-100 border overflow-hidden relative shrink-0 flex items-center justify-center">
                  <HelpCircle className="text-slate-300" size={24} />
                </div>

                {/* Updated mapping to use flattened fields */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                    {scan.crop_name || 'Unknown Crop Class'}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {scan.disease_name || 'Healthy Tissue'}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">
                    Farmer: <span className="text-slate-700 font-bold">{scan.user_name || 'Unknown Farmer'}</span>
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1.5 bg-slate-100 w-fit px-2 py-0.5 rounded-md">
                    {new Date(scan.scan_date).toLocaleDateString()} • SCN-{scan.id}
                  </p>
                </div>

                {/* AI Confidence Meter */}
                <div className="w-full md:w-48 shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Confidence</span>
                    <span className={`text-xs font-bold ${isConfident ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                    <div className={`h-full rounded-full transition-all duration-500 ${isConfident ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${confidence}%` }} />
                  </div>
                </div>

                <div className="shrink-0 md:pl-4">
                  {isConfident ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                      <CheckCircle size={14}/> Verified
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