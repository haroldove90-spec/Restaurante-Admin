/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Table, Order, MenuItem, RestaurantState, OrderItemStatus, OrderStatus, Role, Employee } from '../types';
import { INITIAL_MENU, INITIAL_TABLES } from '../constants';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}

interface RestaurantContextType extends RestaurantState {
  currentRole: Role;
  notifications: Notification[];
  setRole: (role: Role) => void;
  updateTableStatus: (tableId: string, status: Table['status']) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => void;
  completeOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setRole] = useState<Role>('admin');
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Local storage persistence for the demo session
  useEffect(() => {
    const savedOrders = localStorage.getItem('restoflow_orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    
    const savedTables = localStorage.getItem('restoflow_tables');
    if (savedTables) setTables(JSON.parse(savedTables));

    const savedMenu = localStorage.getItem('restoflow_menu');
    if (savedMenu) setMenu(JSON.parse(savedMenu));

    const savedEmployees = localStorage.getItem('restoflow_employees');
    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
  }, []);

  useEffect(() => {
    localStorage.setItem('restoflow_orders', JSON.stringify(orders));
    localStorage.setItem('restoflow_tables', JSON.stringify(tables));
    localStorage.setItem('restoflow_menu', JSON.stringify(menu));
    localStorage.setItem('restoflow_employees', JSON.stringify(employees));
  }, [orders, tables, menu, employees]);

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const newNotif: Notification = {
      id: `n${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: Date.now()
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateTableStatus = (tableId: string, status: Table['status']) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `o${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setOrders(prev => [...prev, newOrder]);
    updateTableStatus(orderData.tableId, 'occupied');
    
    const tableNum = tables.find(t => t.id === orderData.tableId)?.number;
    addNotification(`Nueva orden: Mesa ${tableNum}`, 'info');
  };

  const updateOrderItemStatus = (orderId: string, itemId: string, status: OrderItemStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      
      const newItems = o.items.map(item => {
        if (item.id === itemId) {
          // Trigger notification if status is ready
          if (status === 'ready') {
            const tableNum = tables.find(t => t.id === o.tableId)?.number;
            addNotification(`${item.name} de Mesa ${tableNum} está LISTO`, 'success');
          }
          return { ...item, status };
        }
        return item;
      });

      return {
        ...o,
        updatedAt: Date.now(),
        items: newItems
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

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...item, id: `m${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    setMenu(prev => [...prev, newItem]);
  };

  const updateMenuItem = (id: string, item: Partial<MenuItem>) => {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, ...item } : m));
  };

  const deleteMenuItem = (id: string) => {
    setMenu(prev => prev.filter(m => m.id !== id));
  };

  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = { ...emp, id: `e${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    setEmployees(prev => [...prev, newEmp]);
  };

  const updateEmployee = (id: string, emp: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...emp } : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  return (
    <RestaurantContext.Provider value={{
      currentRole,
      setRole,
      tables,
      menu,
      orders,
      notifications,
      employees,
      updateTableStatus,
      addOrder,
      updateOrderItemStatus,
      completeOrder,
      cancelOrder,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addNotification,
      removeNotification
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
