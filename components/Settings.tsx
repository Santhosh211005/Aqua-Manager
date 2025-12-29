import React, { useState } from 'react';
import { BusinessSettings } from '../types';
import { Save, Store, CreditCard, Info, QrCode } from 'lucide-react';

interface SettingsProps {
  settings: BusinessSettings;
  onUpdate: (settings: Partial<BusinessSettings>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const previewUpiLink = `upi://pay?pa=${formData.merchantUpiId}&pn=${encodeURIComponent(formData.merchantName)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(previewUpiLink)}`;

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Business Settings</h2>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3 mb-6 text-blue-600">
           <Store size={24} />
           <h3 className="font-bold text-lg text-slate-800">Payment Configuration</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Business Name (Merchant Name)</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              value={formData.merchantName}
              onChange={e => setFormData({...formData, merchantName: e.target.value})}
              placeholder="e.g. Aqua Fresh Enterprises"
            />
            <p className="text-[10px] text-slate-400 mt-1">This name will appear on the customer's payment app.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">UPI ID (VPA)</label>
            <div className="relative">
               <CreditCard className="absolute left-3 top-3.5 text-slate-400" size={18} />
               <input 
                 className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                 value={formData.merchantUpiId}
                 onChange={e => setFormData({...formData, merchantUpiId: e.target.value})}
                 placeholder="yourname@bank or number@upi"
               />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Use your Google Pay Business, Paytm, or PhonePe merchant UPI ID.</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4 items-center">
             <div className="bg-white p-2 rounded-lg border border-blue-100">
                <img src={qrUrl} alt="QR Preview" className="w-16 h-16" />
             </div>
             <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">QR Preview</span>
                <p className="text-xs text-blue-900 leading-tight mt-1 font-medium">Your customers will scan this to pay you directly.</p>
             </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Save size={20} />
            Save Configuration
          </button>

          {saved && (
            <p className="text-center text-emerald-600 font-bold text-sm animate-pulse">Settings saved successfully!</p>
          )}
        </form>
      </div>

      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex gap-3">
        <Info className="text-amber-500 shrink-0" size={20} />
        <p className="text-xs text-amber-900 leading-relaxed font-medium">
          Make sure your UPI ID is correct. Payments go directly to your linked bank account. Aqua Manager does not process these payments; it only generates the payment request for your customers.
        </p>
      </div>
    </div>
  );
};