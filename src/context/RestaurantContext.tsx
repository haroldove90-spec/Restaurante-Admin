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
  categories: Category[];
  notifications: Notification[];
  loading: boolean;
  setRole: (role: Role) => void;
  updateTableStatus: (tableId: string, status: Table['status'], currentDiners?: number) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => void;
  completeOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  uploadImage: (file: File) => Promise<string | null>;
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setRoleState] = useState<Role>(() => {
    const saved = localStorage.getItem('restoflow_role');
    return (saved as Role) || 'admin';
  });
  const [tables, setTables] = useState<Table[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const setRole = (role: Role) => {
    setRoleState(role);
    localStorage.setItem('restoflow_role', role);
  };

  // Initialize and Subscribe
  useEffect(() => {
    let isMounted = true;

    const fetchData = async (isInitial = false) => {
      if (isInitial && isMounted) setLoading(true);
      try {
        const [
          { data: menuData },
          { data: tablesData },
          { data: employeesData },
          { data: ordersData },
          { data: categoriesData }
        ] = await Promise.all([
          supabase.from('menu_items').select('*'),
          supabase.from('tables').select('*').order('number'),
          supabase.from('employees').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('categories').select('*').order('name')
        ]);

        if (!isMounted) return;

        if (menuData) {
          setMenu(menuData.map(m => ({
            ...m,
            imageUrl: m.image || m.image_url // handle both common column names
          })));
        }
        if (tablesData) {
          setTables(tablesData.map(t => ({
            ...t,
            currentDiners: t.current_diners || 0
          })));
        }
        if (categoriesData) {
          setCategories(categoriesData);
        }
        if (employeesData) {
          setEmployees(employeesData.map(e => ({
            id: e.id,
            name: e.name,
            role: e.role,
            email: e.email,
            phone: e.phone,
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
            createdAt: new Date(o.created_at).getTime(),
            updatedAt: new Date(o.updated_at).getTime()
          })));
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
      } finally {
        if (isInitial && isMounted) setLoading(false);
      }
    };

    fetchData(true);

    // Set up Realtime Subscriptions
    const subFetch = () => fetchData(false);
    const channels = [
      supabase.channel('menu_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, subFetch).subscribe(),
      supabase.channel('table_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, subFetch).subscribe(),
      supabase.channel('employee_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, subFetch).subscribe(),
      supabase.channel('order_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, subFetch).subscribe(),
      supabase.channel('category_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, subFetch).subscribe(),
    ];

    return () => {
      isMounted = false;
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

  const updateTableStatus = async (tableId: string, status: Table['status'], currentDiners?: number) => {
    const updateData: any = { status };
    if (currentDiners !== undefined) updateData.current_diners = currentDiners;

    const { error } = await supabase.from('tables').update(updateData).eq('id', tableId);
    if (error && (error.message.includes("column \"current_diners\"") || error.code === '42703')) {
      // Fallback if column missing
      await supabase.from('tables').update({ status }).eq('id', tableId);
    }
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
      // Get diners count from order items
      const diners = new Set(orderData.items.map(i => i.dinerNumber || 1));
      updateTableStatus(orderData.tableId, 'occupied', diners.size);
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
          const dinerInfo = item.dinerNumber ? ` (C${item.dinerNumber})` : '';
          addNotification(`${item.name}${dinerInfo} de Mesa ${tableNum} está LISTO`, 'success');
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
      updateTableStatus(order.tableId, 'dirty', 0);
    }
  };

  const cancelOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      await supabase.from('orders').update({ status: 'cancelled', updated_at: Date.now() }).eq('id', orderId);
      updateTableStatus(order.tableId, 'available', 0);
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const id = `m${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { imageUrl, ...rest } = item;
    
    // Success flag to avoid double notifications
    let success = false;

    // Try with 'image' column first
    const { error } = await supabase.from('menu_items').insert({ 
      ...rest, 
      id,
      image: imageUrl
    });

    if (error) {
      // If 'image' doesn't exist, try 'image_url'
      if (error.message.includes("column \"image\"") || error.code === '42703') {
        const { error: error2 } = await supabase.from('menu_items').insert({ 
          ...rest, 
          id,
          image_url: imageUrl 
        });
        if (!error2) success = true;
        else addNotification(`Error: ${error2.message}`, "warning");
      } else {
        addNotification(`Error: ${error.message}`, "warning");
      }
    } else {
      success = true;
    }

    if (success) addNotification("Platillo guardado con éxito", "success");
  };

  const updateMenuItem = async (id: string, item: Partial<MenuItem>) => {
    const { imageUrl, ...rest } = item;
    const updateData: any = { ...rest };
    if (imageUrl !== undefined) updateData.image = imageUrl;
    
    let success = false;

    const { error } = await supabase.from('menu_items').update(updateData).eq('id', id);
    
    if (error) {
      if (error.message.includes("column \"image\"") || error.code === '42703') {
        delete updateData.image;
        updateData.image_url = imageUrl;
        const { error: error2 } = await supabase.from('menu_items').update(updateData).eq('id', id);
        if (!error2) success = true;
        else addNotification(`Error: ${error2.message}`, "warning");
      } else {
        addNotification(`Error: ${error.message}`, "warning");
      }
    } else {
      success = true;
    }

    if (success) addNotification("Platillo actualizado", "success");
  };

  const deleteMenuItem = async (id: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) addNotification(`Error al eliminar: ${error.message}`, "warning");
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
      addNotification(`Error al guardar staff: ${error.message}`, "warning");
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
      addNotification(`Error al actualizar staff: ${error.message}`, "warning");
    } else {
      addNotification("Empleado actualizado", "success");
    }
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) addNotification(`Error al eliminar staff: ${error.message}`, "warning");
    else addNotification("Empleado eliminado", "success");
  };

  const addCategory = async (name: string) => {
    const id = `c${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { error } = await supabase.from('categories').insert({ id, name });
    if (error) addNotification(`Error al guardar categoría: ${error.message}`, "warning");
    else addNotification("Categoría añadida", "success");
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) addNotification(`Error al eliminar: ${error.message}`, "warning");
    else addNotification("Categoría eliminada", "success");
  };

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `menu/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-assets')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, try 'images'
        if (uploadError.message.includes("is not found")) {
          const { error: uploadError2 } = await supabase.storage
            .from('images')
            .upload(filePath, file);
          
          if (uploadError2) throw uploadError2;
          
          const { data } = supabase.storage.from('images').getPublicUrl(filePath);
          return data.publicUrl;
        }
        throw uploadError;
      }

      const { data } = supabase.storage.from('restaurant-assets').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      addNotification(`Error al subir imagen: ${error.message}. Asegúrate de que exista el bucket 'restaurant-assets' o 'images' en Supabase Storage.`, 'warning');
      return null;
    }
  };

  return (
    <RestaurantContext.Provider value={{
      currentRole,
      setRole,
      tables,
      menu,
      categories,
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
      addCategory,
      deleteCategory,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      uploadImage,
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
