import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  createdAt: Timestamp;
  fullName?: string;
  age?: number;
  address?: string;
  birthdate?: string;
  profilePic?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: 'kg' | 'pcs';
  price: number;
  stock: number;
  lowStockThreshold: number;
  updatedAt: Timestamp;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  priceAtSale: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  cashierId: string;
  cashierName: string;
  timestamp: Timestamp;
}
