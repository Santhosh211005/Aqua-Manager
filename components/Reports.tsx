import React, { useState, useMemo, useRef } from 'react';
import { AppState, View } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { FileJson, FileSpreadsheet, Download, Users, Upload, AlertTriangle, Calendar, Filter } from 'lucide-react';

interface ReportsProps {
  state: AppState;
  onImport: (newState: AppState) => void;
  onNavigate: (view: View) => void;
}

type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL';

export const Reports: React.FC<ReportsProps> = ({ state, onImport, onNavigate }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('WEEKLY');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analytics = useMemo(() => {
    const today = new Date();
    const dataMap: Record<string, { date: string, sales: number, collection: number }> = {};
    
    // Determine start date based on timeframe
    let daysToLookBack = 7;
    if (timeframe === 'DAILY') daysToLookBack = 1;
    if (timeframe === 'MONTHLY') daysToLookBack = 30;
    if (timeframe === 'ALL') daysToLookBack = 365;

    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      dataMap[ds] = { date: timeframe === 'MONTHLY' ? ds.substring(5) : ds.substring(5), sales: 0, collection: 0 };
    }

    // Populate Sales (Bills)
    state.transactions.filter(t => t.type === 'BILL').forEach(t => {
      if (dataMap[t.date]) dataMap[t.date].sales += t.amount;
    });

    // Populate Collections (Payments)
    state.transactions.filter(t => t.type === 'PAYMENT').forEach(t => {
      if (dataMap[t.date]) dataMap[t.date].collection += t.amount;
    });

    return Object.values(dataMap);
  }, [state.transactions, timeframe]);

  const stats = useMemo(() => {
    const totalSales = state.transactions.filter(t => t.type === 'BILL').reduce((acc, t) => acc + t.amount, 0);
    const totalCollection = state.transactions.filter(t => t.type === 'PAYMENT').reduce((acc, t) => acc + t.amount, 0);
    const outstanding = state.customers.reduce((acc, c) => acc + c.balance, 0);

    return { totalSales, totalCollection, outstanding };
  }, [state]);

  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(state, null, 2);
    downloadFile(jsonContent, `aqua_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  return (
    <div className="pb-24 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Financial Insights</h2>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          {(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeframe === tf ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
          <p className="text-2xl font-black text-slate-800">₹{stats.totalSales.toLocaleString()}</p>
          <div className="mt-2 flex items-center text-xs text-blue-500 font-bold bg-blue-50 w-fit px-2 py-0.5 rounded-full">
            Lifetime Billing
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Collected</p>
          <p className="text-2xl font-black text-emerald-600">₹{stats.totalCollection.toLocaleString()}</p>
          <div className="mt-2 flex items-center text-xs text-emerald-500 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
            Realized Cash
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Outstanding</p>
          <p className="text-2xl font-black text-amber-600">₹{stats.outstanding.toLocaleString()}</p>
          <button 
            onClick={() => onNavigate('PAYMENTS')}
            className="mt-2 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors"
          >
            Collect Now
          </button>
        </div>
      </div>

      {/* Sales vs Collection Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-slate-700 uppercase text-xs tracking-widest">Revenue Comparison</h3>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-slate-500">Sales</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div><span className="text-[10px] font-bold text-slate-500">Collections</span></div>
          </div>
        </div>
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis 
                        tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}} 
                        itemStyle={{fontSize: '11px', fontWeight: 800}}
                        labelStyle={{marginBottom: '4px', fontWeight: 900, color: '#1e293b'}}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name="Total Sales" />
                    <Bar dataKey="collection" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} name="Collected" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Download size={20} /></div>
                <h3 className="font-black text-slate-800">Export & Backup</h3>
            </div>
            <p className="text-slate-500 text-xs font-medium mb-6">Safe-keep your business records in JSON format or export lists for spreadsheet analysis.</p>
            <div className="flex flex-wrap gap-2">
                <button onClick={handleExportJSON} className="flex-1 min-w-[120px] bg-slate-900 text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <FileJson size={16} /> JSON Backup
                </button>
                <button className="flex-1 min-w-[120px] bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                    <FileSpreadsheet size={16} /> Customers CSV
                </button>
            </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 text-white rounded-lg"><Upload size={20} /></div>
                <h3 className="font-black">Restore Data</h3>
            </div>
            <p className="text-white/60 text-xs font-medium mb-6">Import a previous backup to restore all customers, deliveries, and settings instantly.</p>
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const res = JSON.parse(ev.target?.result as string);
                            if(confirm("Confirm: This will overwrite ALL current data. Continue?")) onImport(res);
                        } catch(e) { alert("Invalid backup file."); }
                    };
                    reader.readAsText(file);
                }}
                className="hidden" 
                accept=".json"
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-500 transition-all"
            >
                Upload Backup File
            </button>
        </div>
      </div>

      <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
         <AlertTriangle className="text-red-500 shrink-0" size={20} />
         <div>
            <p className="text-red-800 font-black text-xs uppercase tracking-widest mb-1">Safety Notice</p>
            <p className="text-red-700 text-[10px] font-medium leading-relaxed">
              All data is stored locally in your browser. Clearing browser history or site data will remove all Aqua Manager information. We strongly recommend downloading a <strong>JSON Backup</strong> every week.
            </p>
         </div>
      </div>
    </div>
  );
};