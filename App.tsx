import React, { useState, useEffect } from 'react';
import { View, Customer, PaymentMethod, AppState, BusinessSettings, ScheduledReminder, Booking } from './types';
import { loadState, saveState } from './services/storageService';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/CustomerList';
import { DeliveryLog } from './components/DeliveryLog';
import { Billing } from './components/Billing';
import { Reports } from './components/Reports';
import { AIAssistant } from './components/AIAssistant';
import { Settings } from './components/Settings';
import { BookingManager } from './components/BookingManager';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('DASHBOARD');
  const [state, setState] = useState(loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const addCustomer = (data: Omit<Customer, 'id' | 'balance' | 'active'>) => {
    const newCustomer: Customer = {
      ...data,
      id: Date.now().toString(),
      balance: 0,
      active: true
    };
    setState(prev => ({ ...prev, customers: [newCustomer, ...prev.customers] }));
  };

  const editCustomer = (id: string, updates: Partial<Customer>) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const deleteCustomer = (id: string) => {
      setState(prev => ({
          ...prev,
          customers: prev.customers.filter(c => c.id !== id)
      }));
  }

  const logDelivery = (customerId: string, quantity: number, date: string, note?: string) => {
    setState(prev => {
      const customer = prev.customers.find(c => c.id === customerId);
      if (!customer) return prev;
      const cost = customer.pricePerJar * quantity;
      return {
        ...prev,
        customers: prev.customers.map(c => c.id === customerId ? { ...c, balance: c.balance + cost } : c),
        deliveries: [
          { id: Date.now().toString(), customerId, date, quantity, timestamp: Date.now(), note },
          ...prev.deliveries
        ],
        transactions: [
          { id: `bill_${Date.now()}`, customerId, date, amount: cost, type: 'BILL', timestamp: Date.now(), notes: note ? `Delivery: ${quantity} jars (${note})` : `Delivery: ${quantity} jars` },
          ...prev.transactions
        ]
      };
    });
  };

  const addBooking = (customerId: string, quantity: number, note?: string) => {
    const newBooking: Booking = {
      id: Date.now().toString(),
      customerId,
      quantity,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      note
    };
    setState(prev => ({ ...prev, bookings: [newBooking, ...prev.bookings] }));
  };

  const fulfillBooking = (bookingId: string) => {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    logDelivery(booking.customerId, booking.quantity, new Date().toISOString().split('T')[0], `Booking #${bookingId}: ${booking.note || ''}`);
    
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => b.id === bookingId ? { ...b, status: 'FULFILLED' } : b)
    }));
  };

  const cancelBooking = (bookingId: string) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b)
    }));
  };

  const collectPayment = (customerId: string, amount: number, method: PaymentMethod) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === customerId ? { ...c, balance: c.balance - amount } : c),
      transactions: [
        { id: `pay_${Date.now()}`, customerId, date: new Date().toISOString().split('T')[0], amount, type: 'PAYMENT', method, timestamp: Date.now() },
        ...prev.transactions
      ]
    }));
  };

  const scheduleReminder = (customerId: string, date: string, type: 'UPCOMING_DELIVERY' | 'PAYMENT_DUE', note?: string) => {
    const newReminder: ScheduledReminder = {
      id: Date.now().toString(),
      customerId,
      scheduledDate: date,
      type,
      status: 'PENDING',
      note
    };
    setState(prev => ({
      ...prev,
      reminders: [...prev.reminders, newReminder]
    }));
  };

  const markReminderSent = (reminderId: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === reminderId ? { ...r, status: 'SENT' } : r)
    }));
  };

  const deleteReminder = (reminderId: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== reminderId)
    }));
  };

  const renderView = () => {
    switch (activeView) {
      case 'DASHBOARD':
        return <Dashboard state={state} onChangeView={setActiveView} />;
      case 'BOOKINGS':
        return (
          <BookingManager 
            state={state} 
            onAddBooking={addBooking} 
            onFulfillBooking={fulfillBooking} 
            onCancelBooking={cancelBooking} 
          />
        );
      case 'CUSTOMERS':
        return <CustomerList customers={state.customers} onAddCustomer={addCustomer} onEditCustomer={editCustomer} onDeleteCustomer={deleteCustomer} />;
      case 'DELIVERIES':
        return (
          <DeliveryLog 
            customers={state.customers} 
            reminders={state.reminders}
            settings={state.settings}
            onLogDelivery={logDelivery} 
            onScheduleReminder={scheduleReminder}
            onMarkReminderSent={markReminderSent}
            onDeleteReminder={deleteReminder}
            onUpdateSettings={updateSettings}
          />
        );
      case 'PAYMENTS':
        return <Billing customers={state.customers} transactions={state.transactions} settings={state.settings} onCollectPayment={collectPayment} />;
      case 'REPORTS':
        return <Reports state={state} onImport={(s) => setState(s)} onNavigate={setActiveView} />;
      case 'AI_ASSISTANT':
        return <AIAssistant state={state} />;
      case 'SETTINGS':
        return <Settings settings={state.settings} onUpdate={updateSettings} />;
      default:
        return <Dashboard state={state} onChangeView={setActiveView} />;
    }
  };

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {renderView()}
    </Layout>
  );
};

export default App;