import React, { useState } from 'react';
import { Customer } from '../types';
import { Search, Plus, Phone, MapPin, Edit2, Trash2, MessageSquare, IndianRupee } from 'lucide-react';
import { generateBilingualSMS } from '../services/geminiService';
import { SMSModal } from './SMSModal';

interface CustomerListProps {
  customers: Customer[];
  onAddCustomer: (c: Omit<Customer, 'id' | 'balance' | 'active'>) => void;
  onEditCustomer: (id: string, updates: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, onAddCustomer, onEditCustomer, onDeleteCustomer }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', pricePerJar: '40' });
  const [smsPreview, setSmsPreview] = useState<{ text: string, phone: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomer({
      name: newCustomer.name,
      phone: newCustomer.phone,
      address: newCustomer.address,
      pricePerJar: parseInt(newCustomer.pricePerJar) || 0
    });
    setNewCustomer({ name: '', phone: '', address: '', pricePerJar: '40' });
    setIsAdding(false);
  };

  const handleMonthlyBillSMS = async (customer: Customer) => {
    setLoading(true);
    const sms = await generateBilingualSMS({
      type: 'MONTHLY_BILL_SUMMARY',
      customerName: customer.name,
      balance: customer.balance,
      month: new Date().toLocaleString('default', { month: 'long' })
    });
    setSmsPreview({ text: sms, phone: customer.phone });
    setLoading(false);
  };

  const handleReminderSMS = async (customer: Customer) => {
    setLoading(true);
    const sms = await generateBilingualSMS({
      type: 'PAYMENT_REMINDER',
      customerName: customer.name,
      balance: customer.balance
    });
    setSmsPreview({ text: sms, phone: customer.phone });
    setLoading(false);
  };

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Customers</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 bg-white p-4 rounded-xl shadow-lg border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-semibold mb-4 text-blue-900">Add New Customer</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input 
              required
              placeholder="Customer Name" 
              className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={newCustomer.name}
              onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
            />
            <input 
              required
              type="tel"
              placeholder="Phone Number" 
              className="w-full p-3 border border-slate-200 rounded-lg outline-none"
              value={newCustomer.phone}
              onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
            />
            <input 
              required
              placeholder="Address / Area" 
              className="w-full p-3 border border-slate-200 rounded-lg outline-none"
              value={newCustomer.address}
              onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
            />
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-bold">₹</span>
              <input 
                required
                type="number"
                placeholder="40" 
                className="w-24 p-3 border border-slate-200 rounded-lg outline-none"
                value={newCustomer.pricePerJar}
                onChange={e => setNewCustomer({...newCustomer, pricePerJar: e.target.value})}
              />
              <span className="text-xs text-slate-400 font-bold">PER JAR</span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md">Add Customer</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
          placeholder="Search by name or phone..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{customer.name}</h3>
                <div className="flex items-center text-slate-500 text-xs gap-1 mt-1">
                  <MapPin size={12} />
                  <span>{customer.address}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`block font-black text-lg ${customer.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  ₹{customer.balance}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Balance</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-2">
              <div className="flex gap-2">
                <a href={`tel:${customer.phone}`} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                  <Phone size={18} />
                </a>
                <button 
                  onClick={() => handleReminderSMS(customer)}
                  className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 hover:bg-amber-100"
                  disabled={loading}
                >
                  <MessageSquare size={14} /> Reminder
                </button>
                <button 
                  onClick={() => handleMonthlyBillSMS(customer)}
                  className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 hover:bg-blue-100"
                  disabled={loading}
                >
                  <IndianRupee size={14} /> Bill Summary
                </button>
              </div>
              
              <div className="flex gap-1">
                 <button onClick={() => {
                    if(confirm("Delete customer?")) onDeleteCustomer(customer.id);
                 }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {smsPreview && <SMSModal message={smsPreview.text} phone={smsPreview.phone} onClose={() => setSmsPreview(null)} />}
    </div>
  );
};