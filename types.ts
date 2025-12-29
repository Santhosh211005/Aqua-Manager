export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  PENDING = 'PENDING'
}

export type BookingStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  pricePerJar: number;
  balance: number;
  active: boolean;
  averageConsumptionDays?: number; // Calculated by AI
}

export interface Booking {
  id: string;
  customerId: string;
  date: string;
  quantity: number;
  status: BookingStatus;
  note?: string;
}

export interface Delivery {
  id: string;
  customerId: string;
  date: string; 
  quantity: number;
  timestamp: number;
  note?: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  type: 'PAYMENT' | 'BILL';
  method?: PaymentMethod;
  notes?: string;
  timestamp: number;
}

export interface ScheduledReminder {
  id: string;
  customerId: string;
  scheduledDate: string;
  type: 'UPCOMING_DELIVERY' | 'PAYMENT_DUE';
  status: 'PENDING' | 'SENT';
  note?: string;
}

export interface BusinessSettings {
  merchantUpiId: string;
  merchantName: string;
  currency: string;
  autoSmsPreference: boolean;
}

export interface AppState {
  customers: Customer[];
  deliveries: Delivery[];
  transactions: Transaction[];
  reminders: ScheduledReminder[];
  bookings: Booking[];
  settings: BusinessSettings;
}

export type View = 'DASHBOARD' | 'CUSTOMERS' | 'DELIVERIES' | 'PAYMENTS' | 'REPORTS' | 'AI_ASSISTANT' | 'SETTINGS' | 'BOOKINGS';