import { AppState, Customer, Delivery, Transaction, BusinessSettings, ScheduledReminder, Booking } from '../types';

const STORAGE_KEY = 'aqua_manager_data_v3';

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Green Valley Gym', phone: '9876543210', address: '12 Main St', pricePerJar: 40, balance: 120, active: true },
  { id: 'c2', name: 'Sunrise Apartments', phone: '9876543211', address: '45 Lake View', pricePerJar: 35, balance: 0, active: true },
  { id: 'c3', name: 'Tech Solutions Office', phone: '9876543212', address: 'Indiranagar, Block 4', pricePerJar: 50, balance: 500, active: true },
];

const DEFAULT_SETTINGS: BusinessSettings = {
  merchantUpiId: 'merchant@upi',
  merchantName: 'Aqua Manager Services',
  currency: 'INR',
  autoSmsPreference: false
};

const DEFAULT_STATE: AppState = {
  customers: MOCK_CUSTOMERS,
  deliveries: [],
  transactions: [],
  reminders: [],
  bookings: [],
  settings: DEFAULT_SETTINGS
};

export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(serializedState);
    if (!parsed.settings) parsed.settings = DEFAULT_SETTINGS;
    if (parsed.settings.autoSmsPreference === undefined) parsed.settings.autoSmsPreference = false;
    if (!parsed.reminders) parsed.reminders = [];
    if (!parsed.bookings) parsed.bookings = [];
    return parsed;
  } catch (err) {
    console.error("Error loading state:", err);
    return DEFAULT_STATE;
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Error saving state:", err);
  }
};