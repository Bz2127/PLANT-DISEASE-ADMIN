// client/src/pages/AddDisease.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DiseaseForm from '../components/DiseaseForm';
import { ClipboardList, Layers, CheckCircle2, AlertTriangle, Image as ImageIcon, Database } from 'lucide-react';

const AddDisease = () => {
  const [diseasesList, setDiseasesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshDatabaseEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/diseases`, config);
      if (res.data.success) {
        setDiseasesList(res.data.data);
      }
    } catch (err) {
      console.error("Could not retrieve secure database list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDatabaseEntries();
  }, []);

  return (
    <div className="p-6 lg:p-10 bg-slate-50/50 min-h-screen font-sans">
      
      {/* Premium Dynamic Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-md shadow-emerald-600/20">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Disease Lab</h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">
              Expand and curate the AI agronomy diagnostic knowledge base.
            </p>
          </div>
        </div>
        
        {/* Quick Stats Banner inside header */}
        <div className="flex items-center gap-6 bg-white border border-slate-200/80 px-6 py-3 rounded-2xl shadow-sm">
          <div className="text-center">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Records</span>
            <span className="text-xl font-bold text-slate-800">{diseasesList.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full mt-1 block">
              Sync Online
            </span>
          </div>
        </div>
      </div>

      {/* Grid Workspace */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - Form Intake Section */}
        <div className="lg:col-span-5 xl:col-span-5 sticky top-6">
          <DiseaseForm onDiseaseAdded={refreshDatabaseEntries} />
        </div>

        {/* Right Column - Premium Knowledge Base List View */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Database className="text-slate-500" size={18} /> 
              Active Knowledge Base Catalog
            </h2>
            <span className="text-xs font-semibold text-slate-500 bg-white border px-2.5 py-1 rounded-lg shadow-sm">
              Sorted by Latest
            </span>
          </div>

          <div className="p-6 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-400 italic">Reading master pathology matrices...</p>
              </div>
            ) : diseasesList.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <Layers className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-sm font-bold text-slate-700">No pathologies mapped yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Use the data ingestion panel to configure dynamic definitions into the app system.
                </p>
              </div>
            ) : (
              diseasesList.map((disease) => (
                <div 
                  key={disease.id} 
                  className="group relative border border-slate-100 rounded-2xl bg-white p-5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/[0.02] transition-all duration-300"
                >
                  <div className="flex gap-4 items-start">
                    {/* Visual Reference Indicator */}
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {disease.image_url ? (
                        <img 
                          src={disease.image_url} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <ImageIcon className="text-slate-400" size={22} />
                      )}
                    </div>

                    {/* Content Block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-slate-800 text-base tracking-tight truncate">
                          {disease.disease_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${
                          disease.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' 
                            : 'bg-slate-100 text-slate-600 ring-slate-500/10'
                        }`}>
                          {disease.status || 'Active'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3">
                        <span>Host Target:</span>
                        <span className="text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-md font-bold">
                          {disease.Crop?.crop_name || `ID Mapping #${disease.crop_id}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {disease.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 border border-slate-100 p-3 rounded-xl mt-3 font-medium">
                      {disease.description}
                    </p>
                  )}

                  {/* Operational Treatment Triggers Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-1">
                    {disease.treatment_organic && (
                      <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/70">
                        <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                          <CheckCircle2 size={13} className="text-emerald-600" /> Organic Protocol
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {disease.treatment_organic}
                        </p>
                      </div>
                    )}

                    {disease.treatment_chemical && (
                      <div className="p-3 bg-amber-50/30 rounded-xl border border-amber-100/70">
                        <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                          <AlertTriangle size={13} className="text-amber-600" /> Chemical Protocol
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {disease.treatment_chemical}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddDisease;