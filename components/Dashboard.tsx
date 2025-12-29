import React, { useMemo, useState, useEffect } from 'react';
import { AppState, View } from '../types';
import { Droplets, Users, IndianRupee, Truck, TrendingUp, AlertCircle, Package, Brain, ChevronRight, MessageSquare } from 'lucide-react';
import { predictRefillNeeds, generateBilingualSMS } from '../services/geminiService';
import { SMSModal } from './SMSModal';

interface DashboardProps {
  state: AppState;
  onChangeView: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onChangeView }) => {
  const [predictions, setPredictions] = useState<{ customerId: string, reason: string }[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [smsPreview, setSmsPreview] = useState<{ text: string, phone: string } | null>(null);

  useEffect(() => {
    const getPredictions = async () => {
      if (state.deliveries.length > 0) {
        setLoadingPredictions(true);
        const res = await predictRefillNeeds(state);
        setPredictions(res.slice(0, 2)); // Just show top 2 on dashboard
        setLoadingPredictions(false);
      }
    };
    getPredictions();
  }, [state.deliveries]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysDeliveries = state.deliveries
      .filter(d => d.date === today)
      .reduce((sum, d) => sum + d.quantity, 0);

    const totalOutstanding = state.customers.reduce((sum, c) => sum + c.balance, 0);
    const pendingBookingsCount = state.bookings.filter(b => b.status === 'PENDING').length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = state.transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'PAYMENT' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return { todaysDeliveries, totalOutstanding, monthlyRevenue, pendingBookingsCount };
  }, [state]);

  const handleRefillPrompt = async (customerId: string) => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;
    const sms = await generateBilingualSMS({
      type: 'REFILL_PROMPT',
      customerName: customer.name
    });
    setSmsPreview({ text: sms, phone: customer.phone });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aqua Manager</h1>
          <p className="text-slate-500 font-medium text-sm">Operations Command Center</p>
        </div>
        <button 
          onClick={() => onChangeView('AI_ASSISTANT')}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
        >
          <TrendingUp size={16} className="text-cyan-400" />
          Strategy AI
        </button>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onChangeView('DELIVERIES')}
          className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-200 transition-all group"
        >
          <div className="bg-sky-50 p-3 rounded-2xl text-sky-600 mb-3 group-hover:scale-110 transition-transform">
            <Droplets size={24} />
          </div>
          <span className="text-3xl font-black text-slate-900">{stats.todaysDeliveries}</span>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Jars Delivered</span>
        </div>

        <div 
          onClick={() => onChangeView('BOOKINGS')}
          className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-200 transition-all group"
        >
          <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 mb-3 relative group-hover:scale-110 transition-transform">
            <Package size={24} />
            {stats.pendingBookingsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </div>
          <span className="text-3xl font-black text-slate-900">{stats.pendingBookingsCount}</span>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Pending Orders</span>
        </div>

        <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Total Outstanding</span>
            <h3 className="text-3xl font-black mt-1">₹{stats.totalOutstanding.toLocaleString()}</h3>
            <button 
              onClick={() => onChangeView('PAYMENTS')}
              className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Start Collection
            </button>
          </div>
          <AlertCircle size={80} className="absolute -right-4 -bottom-4 text-white/10" />
        </div>
      </div>

      {/* AI Refill Alerts (Contextual) */}
      {predictions.length > 0 && (
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-violet-600">
              <Brain size={20} className="animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-widest">Proactive Refill Alerts</h2>
            </div>
            <button onClick={() => onChangeView('BOOKINGS')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {predictions.map(p => {
              const cust = state.customers.find(c => c.id === p.customerId);
              if (!cust) return null;
              return (
                <div key={p.customerId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-800 text-sm">{cust.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">{p.reason}</p>
                  </div>
                  <button 
                    onClick={() => handleRefillPrompt(cust.id)}
                    className="p-2.5 bg-white text-violet-600 rounded-xl shadow-sm border border-slate-200 hover:bg-violet-600 hover:text-white transition-all"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onChangeView('BOOKINGS')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-3xl shadow-lg shadow-blue-100 flex flex-col items-center justify-center transition-all active:scale-95"
        >
          <Package size={28} className="mb-2" />
          <span className="text-xs font-black uppercase tracking-widest">Manage Bookings</span>
        </button>
        <button 
          onClick={() => onChangeView('DELIVERIES')}
          className="bg-white border border-slate-200 text-slate-900 p-5 rounded-3xl shadow-sm flex flex-col items-center justify-center hover:bg-slate-50 transition-all active:scale-95"
        >
          <Truck size={28} className="mb-2 text-blue-600" />
          <span className="text-xs font-black uppercase tracking-widest">Route Tracker</span>
        </button>
      </div>

      {/* Financial Health Mini Summary */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Financial Health</h2>
          <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Month: {new Date().toLocaleString('default', { month: 'long' })}</div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Revenue</p>
            <p className="text-3xl font-black text-slate-900">₹{stats.monthlyRevenue.toLocaleString()}</p>
          </div>
          <div className="h-12 w-32 bg-slate-50 rounded-xl relative overflow-hidden flex items-end gap-1 px-2 pb-1">
              {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-500 rounded-t-sm opacity-20" style={{ height: `${h}%` }}></div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp size={16} className="text-blue-600 opacity-40" />
              </div>
          </div>
        </div>
      </div>

      {smsPreview && <SMSModal message={smsPreview.text} phone={smsPreview.phone} onClose={() => setSmsPreview(null)} />}
    </div>
  );
};