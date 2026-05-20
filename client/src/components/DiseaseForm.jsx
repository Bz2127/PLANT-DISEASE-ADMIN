// client/src/components/DiseaseForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Check, AlertCircle, X, Sparkles } from 'lucide-react';

const DiseaseForm = ({ onDiseaseAdded }) => {
  const fileInputRef = useRef(null);
  const [crops, setCrops] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const [formData, setFormData] = useState({
    disease_name: '',
    crop_id: '',
    description: '',
    symptoms: '',
    causes: '',
    treatment_organic: '',
    treatment_chemical: '',
    prevention_tips: '',
    image_url: '',
    status: 'Active'
  });

  const [notification, setNotification] = useState({ text: '', isError: false });
  const [submitting, setSubmitting] = useState(false);

  // Fetch option elements directly from your database layout
  useEffect(() => {
    const fetchDropdownCrops = async () => {
      try {
        const token = localStorage.getItem('token');
        // Unifying route path to standard endpoints
        const res = await axios.get('http://localhost:5000/api/admin/crops', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          setCrops(res.data.data);
        }
      } catch (err) {
        console.error("Error loading selection parameters:", err);
        // Clean development placeholder fallback values if data engine falls out offline
        setCrops([
          { id: 1, crop_name: 'Wheat' },
          { id: 2, crop_name: 'Maize' },
          { id: 3, crop_name: 'Coffee' },
          { id: 4, crop_name: 'Potato' }
        ]);
      }
    };
    fetchDropdownCrops();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      
      // For standalone deployments: use fallback image strings
      // Replace with your remote storage provider string if multi-part files are not used
      setFormData(prev => ({ ...prev, image_url: `https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=600&q=80` }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const clearSelectedFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFilePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeFormSubmit = async (e) => {
    e.preventDefault();
    setNotification({ text: '', isError: false });
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      // If handling simple JSON payload properties:
      const submissionData = { ...formData };

      // NOTE FOR BINARY STORAGE: If your backend handles Multer multi-parts directly, swap to:
      // const submissionData = new FormData();
      // Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));
      // if (selectedFile) submissionData.append('image', selectedFile);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const res = await axios.post('http://localhost:5000/api/admin/diseases', submissionData, config);
      
      if (res.data.success) {
        setNotification({ text: res.data.message || 'Reference file locked securely into database schema!', isError: false });
        
        // Return values cleanly to defaults
        setFormData({
          disease_name: '', crop_id: '', description: '', symptoms: '',
          causes: '', treatment_organic: '', treatment_chemical: '',
          prevention_tips: '', image_url: '', status: 'Active'
        });
        setSelectedFile(null);
        setFilePreview('');

        if (onDiseaseAdded) onDiseaseAdded();
      }
    } catch (err) {
      setNotification({
        text: err.response?.data?.message || err.response?.data?.msg || 'Access authorization rejected or backend parameters mismatched.',
        isError: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={18} />
          Ingestion Form Wizard
        </h2>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
          Secure API
        </span>
      </div>

      <form onSubmit={executeFormSubmit} className="p-6 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
        
        {notification.text && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
            notification.isError 
              ? 'bg-rose-50 text-rose-700 border-rose-100' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-100'
          }`}>
            {notification.isError ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <Check size={18} className="shrink-0 mt-0.5" />}
            <span>{notification.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Disease Name *</label>
            <input 
              type="text" 
              name="disease_name"
              value={formData.disease_name}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-800"
              placeholder="e.g., Late Blight"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Affected Host Crop *</label>
            <select 
              name="crop_id"
              value={formData.crop_id}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-700"
              required
            >
              <option value="">Choose matching row...</option>
              {crops.map(crop => (
                <option key={crop.id} value={crop.id}>{crop.crop_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">System Status</label>
            <select 
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-700"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">General Overview Summary</label>
            <input 
              type="text" 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-800"
              placeholder="Brief summary overview description..." 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reference Attachment Graphic</label>
          <div 
            onClick={() => fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 relative group flex flex-col items-center justify-center ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-50/40' 
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden" 
            />

            {filePreview ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                <img src={filePreview} alt="Preview" className="h-full object-contain" />
                <button 
                  type="button"
                  onClick={clearSelectedFile}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors backdrop-blur-xs"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-100 shadow-xs transition-colors mb-2">
                  <UploadCloud size={20} />
                </div>
                <p className="text-xs font-bold text-slate-700">Drag your image file here or <span className="text-emerald-600">browse</span></p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Supports PNG, JPG, or WEBP files up to 5MB</p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Visual Symptoms</label>
            <textarea 
              name="symptoms"
              value={formData.symptoms}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-800 h-20 resize-none"
              placeholder="What structural visual markers should farmers notice..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Root Biological Causes</label>
            <textarea 
              name="causes"
              value={formData.causes}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-800 h-20 resize-none"
              placeholder="Fungal distribution paths, environmental stressors..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Organic Treatment Recommendation</label>
            <textarea 
              name="treatment_organic"
              value={formData.treatment_organic}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-800 h-24 resize-none"
              placeholder="Natural mitigations, cultural field actions, native treatments..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Chemical Treatment Protocol</label>
            <textarea 
              name="treatment_chemical"
              value={formData.treatment_chemical}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-800 h-24 resize-none"
              placeholder="Approved molecular fungicides, precise dosage guidelines..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Long-term Prevention Guidelines</label>
            <input 
              type="text" 
              name="prevention_tips"
              value={formData.prevention_tips}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-800"
              placeholder="Crop spacing configurations, robust seed variants..." 
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all duration-150 active:scale-[0.99]"
          >
            {submitting ? 'Writing to MySQL...' : 'Commit Protocol Entry'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default DiseaseForm;