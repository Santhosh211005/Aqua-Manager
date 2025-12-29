import React from 'react';
import { X, Copy, MessageSquare, Check, ExternalLink } from 'lucide-react';

interface SMSModalProps {
  message: string;
  phone: string;
  onClose: () => void;
}

export const SMSModal: React.FC<SMSModalProps> = ({ message, phone, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    // Clean phone number: remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Ensure it has a country code, default to 91 (India) if 10 digits
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white animate-in zoom-in-95 duration-200">
        <div className="p-4 flex justify-between items-center border-b bg-slate-50">
          <div className="flex items-center gap-2 text-emerald-600">
            <MessageSquare size={18} />
            <span className="font-black text-sm uppercase tracking-widest">Message Preview</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[180px] whitespace-pre-wrap font-medium text-slate-800 text-sm leading-relaxed mb-6">
            {message}
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleWhatsApp}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
            >
              <ExternalLink size={20} />
              Send via WhatsApp
            </button>
            
            <button 
              onClick={handleCopy}
              className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>
          
          <p className="mt-4 text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">
            WhatsApp will open in a new tab
          </p>
        </div>
      </div>
    </div>
  );
};