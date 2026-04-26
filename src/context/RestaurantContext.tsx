/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Table, Order, MenuItem, RestaurantState, OrderItemStatus, OrderStatus, Role } from '../types';
import { INITIAL_MENU, INITIAL_TABLES } from '../constants';

interface RestaurantContextType extends RestaurantState {
  currentRole: Role;
  setRole: (role: Role) => void;
  updateTableStatus: (tableId: string, status: Table['status']) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => void;
  completeOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setRole] = useState<Role>('admin');
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [menu] = useState<MenuItem[]>(INITIAL_MENU);
  const [orders, setOrders] = useState<Order[]>([]);

  // Local storage persistence for the demo session
  useEffect(() => {
    const savedOrders = localStorage.getItem('restoflow_orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    
    const savedTables = localStorage.getItem('restoflow_tables');
    if (savedTables) setTables(JSON.parse(savedTables));
  }, []);

  useEffect(() => {
    localStorage.setItem('restoflow_orders', JSON.stringify(orders));
    localStorage.setItem('restoflow_tables', JSON.stringify(tables));
  }, [orders, tables]);

  const updateTableStatus = (tableId: string, status: Table['status']) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `o${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setOrders(prev => [...prev, newOrder]);
    updateTableStatus(orderData.tableId, 'occupied');
  };

  const updateOrderItemStatus = (orderId: string, itemId: string, status: OrderItemStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        updatedAt: Date.now(),
        items: o.items.map(item => item.id === itemId ? { ...item, status } : item)
      };
    }));
  };

  const completeOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed', updatedAt: Date.now() } : o));
      updateTableStatus(order.tableId, 'dirty');
    }
  };

  const cancelOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled', updatedAt: Date.now() } : o));
      updateTableStatus(order.tableId, 'available');
    }
  };

  return (
    <RestaurantContext.Provider value={{
      currentRole,
      setRole,
      tables,
      menu,
      orders,
      updateTableStatus,
      addOrder,
      updateOrderItemStatus,
      completeOrder,
      cancelOrder
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('useRestaurant must be used within a RestaurantProvider');
  return context;
};
