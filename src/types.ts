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
}

export type OrderStatus = 'active' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  tableId: string;
  waiterId?: string; // New field to track who took the order
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
}

export type Category = 'entradas' | 'platos_principales' | 'bebidas' | 'postres';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  imageUrl?: string;
  available: boolean;
}

export interface RestaurantState {
  tables: Table[];
  menu: MenuItem[];
  orders: Order[];
}
