import React, { useState, useMemo } from 'react';
import { Customer, ScheduledReminder, BusinessSettings } from '../types';
import { Check, Plus, Minus, StickyNote, MessageSquare, Calendar, Bell, Trash2, Clock, X, Sparkles } from 'lucide-react';
import { generateBilingualSMS } from '../services/geminiService';
import { SMSModal } from './SMSModal';

interface DeliveryLogProps {
  customers: Customer[];
  reminders: ScheduledReminder[];
  settings: BusinessSettings;
  onLogDelivery: (customerId: string, quantity: number, date: string, note?: string) => void;
  onScheduleReminder: (customerId: string, date: string, type: 'UPCOMING_DELIVERY' | 'PAYMENT_DUE', note?: string) => void;
  onMarkReminderSent: (reminderId: string) => void;
  onDeleteReminder: (reminderId: string) => void;
  onUpdateSettings: (settings: Partial<BusinessSettings>) => void;
}

const QUICK_NOTES = ['Office', 'Dairy', 'Home', 'Shop'];

export const DeliveryLog: React.FC<DeliveryLogProps> = ({ 
  customers, 
  reminders, 
  settings,
  onLogDelivery, 
  onScheduleReminder,
  onMarkReminderSent,
  onDeleteReminder,
  onUpdateSettings
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [delivered, setDelivered] = useState<Record<string, boolean>>({});
  const [smsPreview, setSmsPreview] = useState<{ text: string, phone: string } | null>(null);
  const [loadingSms, setLoadingSms] = useState<string | null>(null);
  
  // Scheduling state
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  const activeReminders = useMemo(() => {
    return reminders
      .filter(r => r.status === 'PENDING')
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }, [reminders]);

  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  const handleGenerateSMS = async (customer: Customer, isReminder: boolean = false, reminder?: ScheduledReminder) => {
    setLoadingSms(reminder?.id || customer.id);
    const qty = quantities[customer.id] || 1;
    const total = qty * customer.pricePerJar;
    const note = reminder?.note || notes[customer.id];
    
    const payload = isReminder ? {
        type: 'UPCOMING_DELIVERY_REMINDER',
        customerName: customer.name,
        scheduledDate: reminder?.scheduledDate,
        note: note
    } : {
        type: 'DAILY_DELIVERY_BILL',
        customerName: customer.name,
        quantity: qty,
        rate: customer.pricePerJar,
        total: total,
        balance: customer.balance + total, 
        date: date,
        note: note
    };

    const smsText = await generateBilingualSMS(payload);
    setSmsPreview({ text: smsText, phone: customer.phone });
    setLoadingSms(null);
    if (reminder) onMarkReminderSent(reminder.id);
  };

  const handleDeliver = (id: string) => {
    const qty = quantities[id] || 1;
    const note = notes[id];
    const customer = customers.find(c => c.id === id);
    
    onLogDelivery(id, qty, date, note);
    setDelivered(prev => ({ ...prev, [id]: true }));
    
    // Auto-SMS logic: trigger the AI generation if the toggle is on
    if (settings.autoSmsPreference && customer) {
      handleGenerateSMS(customer);
    }
    
    setTimeout(() => {
        setDelivered(prev => ({ ...prev, [id]: false }));
        setQuantities(prev => { const next = {...prev}; delete next[id]; return next; });
        setNotes(prev => { const next = {...prev}; delete next[id]; return next; });
    }, 3000);
  };

  const setQuickNote = (id: string, note: string) => {
    setNotes(prev => ({ ...prev, [id]: note }));
  };

  const handleSchedule = () => {
    if (schedulingFor) {
      onScheduleReminder(schedulingFor, reminderDate, 'UPCOMING_DELIVERY', notes[schedulingFor]);
      setSchedulingFor(null);
    }
  };

  return (
    <div className="pb-24">
      {/* Reminders Section */}
      {activeReminders.length > 0 && (
        <section className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-amber-600">
                <Bell size={20} className="animate-bounce" />
                <h3 className="font-bold uppercase text-xs tracking-widest">Pending Reminders</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {activeReminders.map(r => {
                    const cust = customers.find(c => c.id === r.customerId);
                    if (!cust) return null;
                    const isToday = r.scheduledDate === new Date().toISOString().split('T')[0];
                    
                    return (
                        <div key={r.id} className={`flex-shrink-0 w-64 p-4 rounded-2xl border ${isToday ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isToday ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {isToday ? 'TODAY' : r.scheduledDate}
                                </span>
                                <button onClick={() => onDeleteReminder(r.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <h4 className="font-bold text-slate-800 truncate">{cust.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium mb-3 truncate">{r.note || 'Regular Delivery'}</p>
                            
                            <button 
                                onClick={() => handleGenerateSMS(cust, true, r)}
                                disabled={!!loadingSms}
                                className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50"
                            >
                                {loadingSms === r.id ? <Clock size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                                Send Reminder
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
      )}

      <header className="mb-6 sticky top-0 bg-slate-50 pt-2 pb-4 z-10 border-b border-slate-200 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Log Deliveries</h2>
          <div 
            onClick={() => onUpdateSettings({ autoSmsPreference: !settings.autoSmsPreference })}
            className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-200 transition-colors"
          >
            <Sparkles size={14} className={settings.autoSmsPreference ? 'text-blue-500' : 'text-slate-300'} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto SMS</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.autoSmsPreference ? 'bg-blue-600' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.autoSmsPreference ? 'left-4.5' : 'left-0.5'}`}></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Select Date</span>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="flex-1 bg-transparent font-bold text-slate-800 outline-none"
          />
        </div>
      </header>

      <div className="space-y-4">
        {customers.map(customer => {
          const isDone = delivered[customer.id];
          const qty = quantities[customer.id] || 1;
          const currentNote = notes[customer.id] || '';

          return (
            <div key={customer.id} className={`p-4 rounded-2xl shadow-sm border transition-all duration-300 ${isDone ? 'bg-emerald-50 border-emerald-200 scale-[0.98]' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className={`font-bold text-lg ${isDone ? 'text-emerald-800' : 'text-slate-800'}`}>{customer.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{customer.address}</p>
                </div>
                <div className="flex items-center gap-2">
                    {!isDone && (
                        <button 
                            onClick={() => setSchedulingFor(customer.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Schedule reminder"
                        >
                            <Calendar size={18} />
                        </button>
                    )}
                    {isDone && (
                      <span className="flex items-center text-emerald-600 font-black text-[10px] uppercase bg-emerald-100 px-3 py-1 rounded-full animate-in fade-in">
                        <Check size={12} className="mr-1" /> Logged
                      </span>
                    )}
                </div>
              </div>

              {!isDone && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <StickyNote className="absolute left-3 top-3.5 text-slate-300" size={16} />
                      <input 
                        type="text" 
                        placeholder="Add a note (e.g. Office, Dairy)..." 
                        className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        value={currentNote}
                        onChange={e => setNotes(prev => ({...prev, [customer.id]: e.target.value}))}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 px-1">
                      {QUICK_NOTES.map(note => (
                        <button
                          key={note}
                          onClick={() => setQuickNote(customer.id, note)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors ${currentNote === note ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {note}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
                      <button 
                        onClick={() => handleQuantityChange(customer.id, -1)}
                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-800 active:scale-90 transition-transform"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-12 text-center font-black text-xl text-slate-800">{qty}</span>
                      <button 
                        onClick={() => handleQuantityChange(customer.id, 1)}
                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-800 active:scale-90 transition-transform"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="flex gap-2">
                        <button 
                          onClick={() => handleGenerateSMS(customer)}
                          disabled={!!loadingSms}
                          className={`p-3 rounded-xl shadow-md active:scale-95 transition-all ${loadingSms === customer.id ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                          {loadingSms === customer.id ? (
                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MessageSquare size={20} />
                          )}
                        </button>
                        <button 
                          onClick={() => handleDeliver(customer.id)}
                          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-100 active:bg-blue-700 transition-all"
                        >
                          Log Delivery
                        </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scheduling Modal */}
      {schedulingFor && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-800 text-lg">Schedule Reminder</h3>
                      <button onClick={() => setSchedulingFor(null)} className="p-1.5 rounded-full hover:bg-slate-100">
                          <X size={20} className="text-slate-400" />
                      </button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reminder Date</label>
                          <input 
                              type="date"
                              value={reminderDate}
                              onChange={e => setReminderDate(e.target.value)}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <p className="text-xs text-blue-800 font-medium">
                              We'll notify you on {reminderDate} to send the reminder to <strong>{customers.find(c => c.id === schedulingFor)?.name}</strong>.
                          </p>
                      </div>
                      <button 
                        onClick={handleSchedule}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all"
                      >
                          Save Reminder
                      </button>
                  </div>
              </div>
          </div>
      )}

      {smsPreview && <SMSModal message={smsPreview.text} phone={smsPreview.phone} onClose={() => setSmsPreview(null)} />}
    </div>
  );
};