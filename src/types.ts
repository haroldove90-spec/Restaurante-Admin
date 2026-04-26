/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'waiter' | 'kitchen' | 'customer';

export type EmployeeRole = 'waiter' | 'chef';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  phone?: string;
  active: boolean;
  itemsCompleted?: number;
  totalRating?: number;
}

export type TableStatus = 'available' | 'occupied' | 'dirty' | 'reserved';

export interface Table {
  id: string;
  number: number;
  status: TableStatus;
  capacity: number;
  currentDiners?: number; // Number of diners currently at the table
}

export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  status: OrderItemStatus;
  notes?: string;
  dinerNumber?: number; // Which diner ordered this item
}

export type OrderStatus = 'active' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  tableId: string;
  waiterId?: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // Changed from enum to string for dynamic categories
  imageUrl?: string;
  available: boolean;
}

export interface RestaurantState {
  tables: Table[];
  menu: MenuItem[];
  orders: Order[];
}
