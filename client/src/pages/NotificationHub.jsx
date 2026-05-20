// client/src/pages/NotificationHub.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { BellRing, Send, AlertCircle, CloudLightning, ShieldAlert, Cpu } from 'lucide-react';

const NotificationHub = () => {
  const [formData, setFormData] = useState({
    type: 'Outbreak',
    title_en: '', title_am: '',
    message_en: '', message_am: ''
  });
  const [status, setStatus] = useState({ text: '', isError: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ text: '', isError: false });

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/admin/notifications', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStatus({ text: 'Localized system notification broadcast deployed successfully!', isError: false });
        setFormData({ type: 'Outbreak', title_en: '', title_am: '', message_en: '', message_am: '' });
      }
    } catch (err) {
      setStatus({ text: 'Failed to deploy system broadcast data configurations.', isError: true });
    }
  };

  return (
    <div className="p-6 lg:p-10 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto flex items-center gap-4 mb-8 border-b pb-6">
        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-md">
          <BellRing size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alerts Hub</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Broadcast localization updates, outbreak alerts, and weather anomalies.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden p-6 lg:p-8">
        {status.text && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-semibold flex items-center gap-2 ${status.isError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <AlertCircle size={18} /> {status.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Broadcaster Segment Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Broadcast Category Vectors</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'Outbreak', label: 'Disease Outbreak', icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-200' },
                { value: 'Weather', label: 'Weather Alerts', icon: CloudLightning, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                { value: 'System', label: 'System Notice', icon: Cpu, color: 'text-blue-600 bg-blue-50 border-blue-200' }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = formData.type === item.value;
                return (
                  <button
                    key={item.value} type="button"
                    onClick={() => setFormData({ ...formData, type: item.value })}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold text-xs transition-all ${
                      isSelected ? item.color : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <Icon size={20} /> {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bilingual Title Setup Box Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Broadcast Title (English)</label>
              <input 
                type="text" required value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800"
                placeholder="e.g. Wheat Rust Warning"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">የማሳወቂያ ርዕስ (አማርኛ)</label>
              <input 
                type="text" required value={formData.title_am}
                onChange={(e) => setFormData({ ...formData, title_am: e.target.value })}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800"
                placeholder="ምሳሌ፦ የዕፅዋት ዝገት በሽታ ጥንቃቄ"
              />
            </div>
          </div>

          {/* Bilingual Detailed Text Messaging Box Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Broadcast Message Content (English)</label>
              <textarea 
                required rows={4} value={formData.message_en}
                onChange={(e) => setFormData({ ...formData, message_en: e.target.value })}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800 resize-none"
                placeholder="Detail localized response parameters or instructions..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">የመልእክት ዝርዝር (አማርኛ)</label>
              <textarea 
                required rows={4} value={formData.message_am}
                onChange={(e) => setFormData({ ...formData, message_am: e.target.value })}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800 resize-none"
                placeholder="ለገበሬዎች የሚተላለፈውን መልእክት በዝርዝር እዚህ ያስገቡ..."
              />
            </div>
          </div>

          {/* Push Broadcast Action Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              type="submit"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-md active:scale-[0.99] transition-all"
            >
              <Send size={16} /> Deploy System Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationHub;