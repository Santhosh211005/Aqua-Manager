import React, { useState, useMemo } from 'react';
import { Customer, PaymentMethod, Transaction, BusinessSettings } from '../types';
import { IndianRupee, History, Receipt, Wallet, ArrowUpRight, ArrowDownLeft, QrCode, X, Download, MessageSquare } from 'lucide-react';
import { generateBilingualSMS } from '../services/geminiService';
import { SMSModal } from './SMSModal';

interface BillingProps {
  customers: Customer[];
  transactions: Transaction[];
  settings: BusinessSettings;
  onCollectPayment: (customerId: string, amount: number, method: PaymentMethod) => void;
}

export const Billing: React.FC<BillingProps> = ({ customers, transactions, settings, onCollectPayment }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [successMsg, setSuccessMsg] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [smsPreview, setSmsPreview] = useState<{ text: string, phone: string } | null>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const val = parseFloat(amount);
    if (val > 0) {
      onCollectPayment(selectedCustomer.id, val, method);
      setAmount('');
      setSuccessMsg(`Received ₹${val} from ${selectedCustomer.name}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setShowQR(false);
    }
  };

  const handleGenerateSMS = async (transaction: Transaction) => {
    const cust = customers.find(c => c.id === transaction.customerId);
    if (!cust) return;

    const sms = await generateBilingualSMS({
      type: 'PAYMENT_CONFIRMATION',
      customerName: cust.name,
      amount: transaction.amount,
      balance: cust.balance,
      paymentMethod: transaction.method,
      date: transaction.date
    });
    setSmsPreview({ text: sms, phone: cust.phone });
  };

  return (
    <div className="pb-24">
       <h2 className="text-2xl font-bold text-slate-800 mb-6">Collect Payment</h2>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
           <form onSubmit={handleSubmit} className="space-y-6">
             <div>
               <label className="block text-sm font-medium text-slate-600 mb-2">Select Customer</label>
               <select 
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium"
                 value={selectedCustomerId}
                 onChange={e => setSelectedCustomerId(e.target.value)}
               >
                 {customers.map(c => (
                   <option key={c.id} value={c.id}>
                     {c.name} (Due: ₹{c.balance})
                   </option>
                 ))}
               </select>
             </div>

             {selectedCustomer && (
               <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center text-blue-900 border border-blue-100">
                 <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Current Due</span>
                    <span className="text-2xl font-bold">₹{selectedCustomer.balance}</span>
                 </div>
                 <Wallet className="text-blue-300" size={40} />
               </div>
             )}

             <div>
               <label className="block text-sm font-medium text-slate-600 mb-2">Amount Received (₹)</label>
               <div className="relative">
                  <IndianRupee className="absolute left-4 top-4 text-slate-400" size={20} />
                  <input 
                      type="number"
                      required
                      min="1"
                      className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                  />
                  {parseFloat(amount) > 0 && (
                    <button 
                      type="button"
                      onClick={() => { setMethod(PaymentMethod.UPI); setShowQR(true); }}
                      className="absolute right-3 top-2 bottom-2 px-3 bg-violet-100 text-violet-700 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-violet-200 transition-colors"
                    >
                      <QrCode size={16} />
                      QR
                    </button>
                  )}
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-600 mb-2">Payment Method</label>
               <div className="grid grid-cols-2 gap-3">
                 <button 
                   type="button"
                   onClick={() => setMethod(PaymentMethod.CASH)}
                   className={`p-4 rounded-xl border font-bold transition-all flex flex-col items-center gap-2 ${method === PaymentMethod.CASH ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-inner' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                 >
                   <Receipt size={24} />
                   <span className="text-xs uppercase tracking-widest">Cash</span>
                 </button>
                 <button 
                   type="button"
                   onClick={() => setMethod(PaymentMethod.UPI)}
                   className={`p-4 rounded-xl border font-bold transition-all flex flex-col items-center gap-2 ${method === PaymentMethod.UPI ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-inner' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                 >
                   <IndianRupee size={24} />
                   <span className="text-xs uppercase tracking-widest">UPI / Online</span>
                 </button>
               </div>
             </div>

             <button 
               type="submit"
               disabled={!selectedCustomer || !amount}
               className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
             >
               Confirm Collection
             </button>
           </form>
         </div>

         <div className="flex flex-col h-[600px]">
            <div className="flex items-center gap-2 mb-4 text-slate-800">
               <History size={20} />
               <h3 className="text-lg font-bold">Ledger History</h3>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</span>
                </div>
                
                <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                    {transactions.filter(t => t.customerId === selectedCustomerId).sort((a,b) => b.timestamp - a.timestamp).map(t => (
                        <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${t.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {t.type === 'PAYMENT' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{t.type === 'PAYMENT' ? 'Payment' : 'Bill'}</p>
                                    <p className="text-[10px] text-slate-500">{t.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className={`font-black ${t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                    ₹{t.amount}
                                </p>
                                {t.type === 'PAYMENT' && (
                                  <button 
                                    onClick={() => handleGenerateSMS(t)}
                                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <MessageSquare size={16} />
                                  </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         </div>
       </div>

       {showQR && (
         <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
               <div className="p-4 flex justify-between items-center border-b">
                  <span className="font-bold text-slate-800">Scan to Pay</span>
                  <button onClick={() => setShowQR(false)} className="p-1 rounded-full hover:bg-slate-100"><X size={20} /></button>
               </div>
               <div className="p-8 flex flex-col items-center text-center">
                  <p className="text-lg font-black text-slate-900 mb-1">{settings.merchantName}</p>
                  <p className="text-xs text-slate-400 mb-6">{settings.merchantUpiId}</p>
                  <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 mb-6">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${settings.merchantUpiId}&pn=${encodeURIComponent(settings.merchantName)}&am=${parseFloat(amount).toFixed(2)}&cu=INR`)}`} alt="QR" className="w-56 h-56" />
                  </div>
                  <div className="bg-blue-600 text-white w-full py-4 rounded-2xl">
                     <p className="text-3xl font-black">₹{parseFloat(amount).toFixed(2)}</p>
                  </div>
               </div>
            </div>
         </div>
       )}

       {smsPreview && <SMSModal message={smsPreview.text} phone={smsPreview.phone} onClose={() => setSmsPreview(null)} />}
    </div>
  );
};