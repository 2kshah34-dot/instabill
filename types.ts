
export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  barcode?: string;
  isLoading?: boolean;
  isOfflineAdded?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface StoreProfile {
  name: string;
  addressLine1: string;
  addressLine2: string;
  gstin: string;
  phone: string;
  email: string;
}

export interface ScannedData {
  type: 'barcode' | 'image';
  value: string; // Barcode string or Base64 image
}

export type PaymentMethod = 'UPI' | 'CASH' | 'CARD';

export interface Transaction {
  id: string;
  date: string;
  timestamp: number;
  items: Product[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
}

export enum AppView {
  HOME = 'HOME',
  SCANNER = 'SCANNER',
  BILL = 'BILL',
  CUSTOMERS = 'CUSTOMERS',
  ADMIN = 'ADMIN',
  RECEIPT = 'RECEIPT',
  HISTORY = 'HISTORY',
}
