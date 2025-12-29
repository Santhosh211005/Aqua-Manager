import React, { useState, useEffect } from 'react';
import { AppState, Customer, Booking } from '../types';
import { Package, Plus, CheckCircle, XCircle, MessageSquare, Brain, Clock, ChevronRight } from 'lucide-react';
import { predictRefillNeeds, generateBilingualSMS } from '../services/geminiService';
import { SMSModal } from './SMSModal';

interface BookingManagerProps {
  state: AppState;
  onAddBooking: (customerId: string, qty: number, note?: string) => void;
  onFulfillBooking: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
}

export const BookingManager: React.FC<BookingManagerProps> = ({ state, onAddBooking, onFulfillBooking, onCancelBooking }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState(state.customers[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [predictions, setPredictions] = useState<{ customerId: string, reason: string }[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [smsPreview, setSmsPreview] = useState<{ text: string, phone: string } | null>(null);

  useEffect(() => {
    const getPredictions = async () => {
      setLoadingPredictions(true);
      const res = await predictRefillNeeds(state);
      setPredictions(res);
      setLoadingPredictions(false);
    };
    getPredictions();
  }, [state.deliveries]);

  const handleRefillPrompt = async (customer: Customer) => {
    const sms = await generateBilingualSMS({
      type: 'REFILL_PROMPT',
      customerName: customer.name
    });
    setSmsPreview({ text: sms, phone: customer.phone });
  };

  const pendingBookings = state.bookings.filter(b => b.status === 'PENDING');

  return (
    <div className="pb-24 space-y-8">
      {/* Predictions Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 text-violet-600">
          <Brain size={20} className="animate-pulse" />
          <h3 className="font-black uppercase text-xs tracking-widest">AI Refill Predictions</h3>
        </div>
        {loadingPredictions ? (
          <div className="h-24 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-bold">Analysing usage patterns...</div>
        ) : predictions.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {predictions.map(p => {
              const cust = state.customers.find(c => c.id === p.customerId);
              if (!cust) return null;
              return (
                <div key={p.customerId} className="flex-shrink-0 w-72 bg-gradient-to-br from-violet-600 to-indigo-700 p-5 rounded-3xl text-white shadow-xl">
                  <h4 className="font-bold text-lg mb-1">{cust.name}</h4>
                  <p className="text-white/70 text-[10px] font-medium leading-tight mb-4">{p.reason}</p>
                  <button 
                    onClick={() => handleRefillPrompt(cust)}
                    className="w-full bg-white/20 backdrop-blur-md py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
                  >
                    <MessageSquare size={14} /> Prompt Customer
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-bold">
            No urgent refills predicted today.
          </div>
        )}
      </section>

      {/* Bookings Section */}
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dealer Bookings</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus size={16} /> New Booking
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border-2 border-blue-500 shadow-xl animate-in zoom-in-95">
          <h3 className="font-black text-slate-800 mb-4">Record Customer Order</h3>
          <div className="space-y-4">
            <select 
              className="w-full p-4 bg-slate-50 rounded-xl font-bold"
              value={selectedCustId}
              onChange={e => setSelectedCustId(e.target.value)}
            >
              {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-4">
              <input 
                type="number" 
                className="w-1/3 p-4 bg-slate-50 rounded-xl font-bold" 
                value={qty} 
                onChange={e => setQty(parseInt(e.target.value))}
              />
              <input 
                type="text" 
                placeholder="Notes (e.g. Leave at gate)" 
                className="flex-1 p-4 bg-slate-50 rounded-xl font-bold" 
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-400 font-bold">Cancel</button>
              <button 
                onClick={() => { onAddBooking(selectedCustId, qty, note); setIsAdding(false); }}
                className="flex-2 bg-blue-600 text-white py-4 rounded-xl font-black"
              >
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {pendingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 opacity-30">
            <Package size={48} />
            <p className="font-bold mt-2">No pending bookings</p>
          </div>
        ) : (
          pendingBookings.map(b => {
            const cust = state.customers.find(c => c.id === b.customerId);
            return (
              <div key={b.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Package size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">{cust?.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      <Clock size={10} /> {b.date} • {b.quantity} Jars
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onCancelBooking(b.id)}
                    className="p-3 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50"
                  >
                    <XCircle size={20} />
                  </button>
                  <button 
                    onClick={() => onFulfillBooking(b.id)}
                    className="px-6 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Fulfill
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {smsPreview && <SMSModal message={smsPreview.text} phone={smsPreview.phone} onClose={() => setSmsPreview(null)} />}
    </div>
  );
};