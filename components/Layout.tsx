import React from 'react';
import { View } from '../types';
import { LayoutDashboard, Users, Truck, Wallet, BarChart2, Settings as SettingsIcon, Package } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  onNavigate: (view: View) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const navItems = [
    { id: 'DASHBOARD' as View, icon: LayoutDashboard, label: 'Home' },
    { id: 'BOOKINGS' as View, icon: Package, label: 'Bookings' },
    { id: 'CUSTOMERS' as View, icon: Users, label: 'People' },
    { id: 'DELIVERIES' as View, icon: Truck, label: 'Log' },
    { id: 'PAYMENTS' as View, icon: Wallet, label: 'Billing' },
    { id: 'REPORTS' as View, icon: BarChart2, label: 'Stats' },
    { id: 'SETTINGS' as View, icon: SettingsIcon, label: 'Store' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white p-6 fixed h-full z-20">
        <h1 className="text-2xl font-bold mb-10 flex items-center gap-2">
            <span className="text-cyan-400">Aqua</span>Manager
        </h1>
        <nav className="space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === item.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeView === item.id ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <item.icon size={24} strokeWidth={activeView === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};