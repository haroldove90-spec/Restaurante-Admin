/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Table, Order, MenuItem, RestaurantState, OrderItemStatus, OrderStatus, Role, Employee } from '../types';
import { INITIAL_MENU, INITIAL_TABLES } from '../constants';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}

interface RestaurantContextType extends RestaurantState {
  currentRole: Role;
  notifications: Notification[];
  loading: boolean;
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
  const [tables, setTables] = useState<Table[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize and Subscribe
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { data: menuData },
          { data: tablesData },
          { data: employeesData },
          { data: ordersData }
        ] = await Promise.all([
          supabase.from('menu_items').select('*'),
          supabase.from('tables').select('*').order('number'),
          supabase.from('employees').select('*'),
          supabase.from('orders').select('*')
        ]);

        if (menuData) {
          setMenu(menuData.map(m => ({
            ...m,
            imageUrl: m.image_url // map image_url to imageUrl
          })));
        }
        if (tablesData) setTables(tablesData);
        if (employeesData) {
          setEmployees(employeesData.map(e => ({
            id: e.id,
            name: e.name,
            role: e.role,
            itemsCompleted: e.items_completed || 0,
            totalRating: parseFloat(e.total_rating) || 5.0
          })));
        }
        if (ordersData) {
          setOrders(ordersData.map(o => ({
            id: o.id,
            tableId: o.table_id,
            waiterId: o.waiter_id,
            items: o.items,
            totalPrice: parseFloat(o.total_price),
            status: o.status,
            createdAt: Number(o.created_at),
            updatedAt: Number(o.updated_at)
          })));
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up Realtime Subscriptions
    const channels = [
      supabase.channel('menu_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchData).subscribe(),
      supabase.channel('table_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchData).subscribe(),
      supabase.channel('employee_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchData).subscribe(),
      supabase.channel('order_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

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

  const updateTableStatus = async (tableId: string, status: Table['status']) => {
    await supabase.from('tables').update({ status }).eq('id', tableId);
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `o${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const { error } = await supabase.from('orders').insert({
      id,
      table_id: orderData.tableId,
      waiter_id: orderData.waiterId,
      total_price: orderData.totalPrice,
      status: orderData.status,
      items: orderData.items,
      created_at: now,
      updated_at: now
    });

    if (!error) {
      updateTableStatus(orderData.tableId, 'occupied');
      const tableNum = tables.find(t => t.id === orderData.tableId)?.number;
      addNotification(`Nueva orden: Mesa ${tableNum}`, 'info');
    }
  };

  const updateOrderItemStatus = async (orderId: string, itemId: string, status: OrderItemStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newItems = order.items.map(item => {
      if (item.id === itemId) {
        if (status === 'ready') {
          const tableNum = tables.find(t => t.id === order.tableId)?.number;
          addNotification(`${item.name} de Mesa ${tableNum} está LISTO`, 'success');
        }
        return { ...item, status };
      }
      return item;
    });

    await supabase.from('orders').update({ 
      items: newItems,
      updated_at: Date.now()
    }).eq('id', orderId);
  };

  const completeOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      await supabase.from('orders').update({ status: 'completed', updated_at: Date.now() }).eq('id', orderId);
      updateTableStatus(order.tableId, 'dirty');
    }
  };

  const cancelOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      await supabase.from('orders').update({ status: 'cancelled', updated_at: Date.now() }).eq('id', orderId);
      updateTableStatus(order.tableId, 'available');
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const id = `m${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { imageUrl, ...rest } = item;
    const { error } = await supabase.from('menu_items').insert({ 
      ...rest, 
      id,
      image_url: imageUrl 
    });
    if (error) {
      console.error("Error adding menu item:", error);
      addNotification("Error al guardar el platillo", "warning");
    } else {
      addNotification("Platillo guardado con éxito", "success");
    }
  };

  const updateMenuItem = async (id: string, item: Partial<MenuItem>) => {
    const { imageUrl, ...rest } = item;
    const updateData: any = { ...rest };
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    
    const { error } = await supabase.from('menu_items').update(updateData).eq('id', id);
    if (error) {
      console.error("Error updating menu item:", error);
      addNotification("Error al actualizar platillo", "warning");
    } else {
      addNotification("Platillo actualizado", "success");
    }
  };

  const deleteMenuItem = async (id: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) addNotification("Error al eliminar", "warning");
    else addNotification("Platillo eliminado", "success");
  };

  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    const id = `e${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { itemsCompleted, totalRating, ...rest } = emp;
    const { error } = await supabase.from('employees').insert({ 
      ...rest, 
      id,
      items_completed: itemsCompleted,
      total_rating: totalRating
    });
    if (error) {
      console.error("Error adding employee:", error);
      addNotification("Error al guardar empleado", "warning");
    } else {
      addNotification("Empleado registrado", "success");
    }
  };

  const updateEmployee = async (id: string, emp: Partial<Employee>) => {
    const { itemsCompleted, totalRating, ...rest } = emp;
    const updateData: any = { ...rest };
    if (itemsCompleted !== undefined) updateData.items_completed = itemsCompleted;
    if (totalRating !== undefined) updateData.total_rating = totalRating;

    const { error } = await supabase.from('employees').update(updateData).eq('id', id);
    if (error) {
      console.error("Error updating employee:", error);
      addNotification("Error al actualizar empleado", "warning");
    } else {
      addNotification("Empleado actualizado", "success");
    }
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) addNotification("Error al eliminar empleado", "warning");
    else addNotification("Empleado eliminado", "success");
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
      loading,
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
