import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Check, AlertCircle, X, Sparkles, Languages } from 'lucide-react';

const DiseaseForm = ({ onDiseaseAdded }) => {
  const fileInputRef = useRef(null);
  const [crops, setCrops] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('en');
  
  const [formData, setFormData] = useState({
    disease_name: '',
    crop_id: '',
    status: 'Active',
    image_url: '',
    
    display_name_en: '',
    description_en: '',
    symptoms_en: '',
    causes_en: '',
    treatment_organic_en: '',
    treatment_chemical_en: '',
    prevention_tips_en: '',

    display_name_am: '',
    description_am: '',
    symptoms_am: '',
    causes_am: '',
    treatment_organic_am: '',
    treatment_chemical_am: '',
    prevention_tips_am: ''
  });

  const [notification, setNotification] = useState({ text: '', isError: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDropdownCrops = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/crops`,{
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          setCrops(res.data.data);
        }
      } catch (err) {
        console.error("Error loading selection parameters:", err);
        setCrops([
          { id: 1, crop_name: 'apple' },
          { id: 2, crop_name: 'banana' },
          { id: 5, crop_name: 'coffee' },
          { id: 11, crop_name: 'maize' },
          { id: 20, crop_name: 'rice' }
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
      setFormData(prev => ({ ...prev, image_url: `uploads/${Date.now()}-${file.name}` }));
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
      const submissionData = { ...formData };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const checkExist = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/diseases/verify?name=${encodeURIComponent(formData.disease_name)}`, 
        config
      ).catch(() => null);

      let res;

      if (checkExist && checkExist.data.exists) {
        const existingId = checkExist.data.id;
        res = await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/diseases/${existingId}`, submissionData, config);
      } else {
       res = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/diseases`, submissionData, config);
      }
      
      if (res.data.success) {
        setNotification({ text: 'Disease data profile integrated and verified successfully in MySQL framework!', isError: false });
        
        setFormData({
          disease_name: '', crop_id: '', status: 'Active', image_url: '',
          display_name_en: '', description_en: '', symptoms_en: '', causes_en: '', treatment_organic_en: '', treatment_chemical_en: '', prevention_tips_en: '',
          display_name_am: '', description_am: '', symptoms_am: '', causes_am: '', treatment_organic_am: '', treatment_chemical_am: '', prevention_tips_am: ''
        });
        setSelectedFile(null);
        setFilePreview('');
        setActiveTab('en');

        if (onDiseaseAdded) onDiseaseAdded();
      }
    } catch (err) {
      setNotification({
        text: err.response?.data?.message || 'Verification execution error. Check local server terminal console logs.',
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
          Bilingual Advisory Ingestion Panel
        </h2>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
          MySQL Pipeline
        </span>
      </div>

      <form onSubmit={executeFormSubmit} className="p-6 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
        
        {notification.text && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
            notification.isError ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
          }`}>
            {notification.isError ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <Check size={18} className="shrink-0 mt-0.5" />}
            <span>{notification.text}</span>
          </div>
        )}

        <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-xl space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Machine Learning Identifiers</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Raw ML Disease Key * (Matches predict.py string output)</label>
              <input 
                type="text" 
                name="disease_name"
                value={formData.disease_name}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-mono text-slate-800"
                placeholder="e.g., Downey-Mildew or Anthracnose"
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Host Crop *</label>
              <select 
                name="crop_id"
                value={formData.crop_id}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-700"
                required
              >
                <option value="">Select Trained Target Crop...</option>
                {crops.map(crop => (
                  <option key={crop.id} value={crop.id}>{crop.crop_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">System Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 font-medium text-slate-700"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Image File Context Reference</label>
              <div 
                onClick={() => fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-all duration-200 h-[46px] flex items-center justify-center ${
                  isDragging ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                {filePreview ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                    <Check size={14} /> Attachment Ready ({selectedFile?.name.substring(0, 15)}...) 
                    <X size={14} className="text-slate-400 hover:text-rose-500 ml-2" onClick={clearSelectedFile} />
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <UploadCloud size={14} className="text-slate-400" /> Drag or <span className="text-emerald-600">click to append preview image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100/80 p-1 flex border-b border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'en' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Languages size={14} className="text-blue-500" />
              English Fields
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('am')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'am' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Languages size={14} className="text-amber-500" />
              Amharic Fields (አማርኛ)
            </button>
          </div>

          <div className="p-4 space-y-4">
            {activeTab === 'en' ? (
              <div className="space-y-4 animation-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Friendly Display Name (English)</label>
                  <input 
                    type="text" name="display_name_en" value={formData.display_name_en} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800"
                    placeholder="e.g., Downy Mildew disease"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">General Overview Summary</label>
                  <input 
                    type="text" name="description_en" value={formData.description_en} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800"
                    placeholder="Brief description layout info for advisory cards..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Visual Symptoms</label>
                    <textarea 
                      name="symptoms_en" value={formData.symptoms_en} onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800 h-20 resize-none"
                      placeholder="Yellow spots on upper leaf surfaces, white fuzz below..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Root Biological Causes</label>
                    <textarea 
                      name="causes_en" value={formData.causes_en} onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800 h-20 resize-none"
                      placeholder="Oomycete pathogen spread via high ambient humidity conditions..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Organic Treatment Recommendation (Reads via Voice TTS)</label>
                  <textarea 
                    name="treatment_organic_en" value={formData.treatment_organic_en} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800 h-20 resize-none"
                    placeholder="Apply copper fungicide mixtures, prune infected low branches..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Chemical Treatment Protocol</label>
                  <textarea 
                    name="treatment_chemical_en" value={formData.treatment_chemical_en} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800 h-20 resize-none"
                    placeholder="Spraying systemic commercial protective fungicides immediately..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Long-term Prevention Guidelines</label>
                  <input 
                    type="text" name="prevention_tips_en" value={formData.prevention_tips_en} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800"
                    placeholder="Ensure adequate plant spacing, rotate crops systematically..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animation-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">የበሽታው አማርኛ መጠሪያ (Friendly Display Name)</label>
                  <input 
                    type="text" name="display_name_am" value={formData.display_name_am} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800"
                    placeholder="ምሳሌ፡ ዶውኒ ሚልዲው በሽታ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">አጠቃላይ ማጠቃለያ መግለጫ (Overview Summary)</label>
                  <input 
                    type="text" name="description_am" value={formData.description_am} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800"
                    placeholder="በካርዶች ላይ የሚታይ አጭር የበሽታው ማብራሪያ..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">የሚታዩ ምልክቶች (Visual Symptoms)</label>
                    <textarea 
                      name="symptoms_am" value={formData.symptoms_am} onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800 h-20 resize-none"
                      placeholder="በቅጠሎች ላይ ቢጫ ነጠብጣቦች መታየት፣ ከቅጠሉ ጀርባ ነጭ ፈንገስ..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">የበሽታው መንስኤዎች (Biological Causes)</label>
                    <textarea 
                      name="causes_am" value={formData.causes_am} onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800 h-20 resize-none"
                      placeholder="ከፍተኛ እርጥበት ባለው የአየር ንብረት ምክንያት የሚፈጠር የፈንገስ ስርጭት..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">ኦርጋኒክ ሕክምና - በድምፅ የሚነበብ (Organic Treatment Voice TTS Source)</label>
                  <textarea 
                    name="treatment_organic_am" value={formData.treatment_organic_am} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800 h-20 resize-none"
                    placeholder="የመዳብ ድብልቅ ፈሳሽ ይርጩ፣ የተጠቁ ዝቅተኛ ቅርንጫፎችን ቆርጠው ያስወግዱ..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">ኬሚካላዊ ሕክምና (Chemical Treatment)</label>
                  <textarea 
                    name="treatment_chemical_am" value={formData.treatment_chemical_am} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800 h-20 resize-none"
                    placeholder="የፈንገስ ማጥፊያ የንግድ ኬሚካሎችን በተመጠነ መጠን ወዲያውኑ መርጨት..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">የረጅም ጊዜ መከላከያ መንገዶች (Prevention Guidelines)</label>
                  <input 
                    type="text" name="prevention_tips_am" value={formData.prevention_tips_am} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium text-slate-800"
                    placeholder="በተክሎች መካከል በቂ ርቀት መተው፣ የሰብል ፈራረቃን መተግበር..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all duration-150 active:scale-[0.99]"
          >
            {submitting ? 'Updating MySQL Matrix...' : 'Commit Protocol Entry'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default DiseaseForm;