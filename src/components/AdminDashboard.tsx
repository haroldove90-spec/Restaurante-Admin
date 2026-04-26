/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, ShoppingBag, 
  Plus, Edit2, Trash2, FileText, Download, 
  Image as ImageIcon, LayoutDashboard, UtensilsCrossed, Wallet,
  UserPlus, ShieldCheck, Mail, Phone
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { MenuItem, Category, Employee, EmployeeRole } from '../types';

type AdminTab = 'dashboard' | 'menu' | 'sales' | 'employees';

export const AdminDashboard: React.FC = () => {
  const { orders, menu, addMenuItem, updateMenuItem, deleteMenuItem, employees, addEmployee, updateEmployee, deleteEmployee } = useRestaurant();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const waiterSales = completedOrders.reduce((acc, order) => {
    const waiterId = order.waiterId || 'No asignado';
    acc[waiterId] = (acc[waiterId] || 0) + order.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  const salesByWaiterData = Object.entries(waiterSales).map(([name, sales]) => ({ name, sales }));

  const exportSalesToPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Ventas General - RestoFlow', 20, 20);
    
    const tableData = completedOrders.map(order => [
      order.id.slice(-6),
      order.waiterId || '---',
      new Date(order.createdAt).toLocaleString(),
      formatCurrency(order.totalPrice)
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: [['ID Orden', 'Mesero', 'Fecha', 'Total']],
      body: tableData,
    });

    doc.save(`ventas_restoflow_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Panel Administrativo</h1>
          <p className="text-neutral-500 text-sm">Control total de la operación del restaurante.</p>
        </div>

        <div className="flex bg-neutral-100 p-1 rounded-xl gap-1 self-start">
          <TabButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={16} />}
            label="Resumen" 
          />
          <TabButton 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')} 
            icon={<UtensilsCrossed size={16} />}
            label="Menú" 
          />
          <TabButton 
            active={activeTab === 'sales'} 
            onClick={() => setActiveTab('sales')} 
            icon={<Wallet size={16} />}
            label="Ingresos" 
          />
          <TabButton 
            active={activeTab === 'employees'} 
            onClick={() => setActiveTab('employees')} 
            icon={<Users size={16} />}
            label="Staff" 
          />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Ventas Totales" 
                value={formatCurrency(totalRevenue)} 
                description="+12.5% vs semana pasada" 
                icon={<DollarSign className="text-emerald-600" size={20} />}
              />
              <StatCard 
                title="Órdenes" 
                value={completedOrders.length.toString()} 
                description="Completadas hoy" 
                icon={<ShoppingBag className="text-blue-600" size={20} />}
              />
              <StatCard 
                title="Cubiertos" 
                value={(completedOrders.length * 2.5).toFixed(0)} 
                description="Promedio por mesa" 
                icon={<Users className="text-orange-600" size={20} />}
              />
              <StatCard 
                title="Ticket Promedio" 
                value={formatCurrency(completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0)} 
                description="Por orden" 
                icon={<TrendingUp className="text-purple-600" size={20} />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer title="Ventas Semanales">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { day: 'Lun', sales: 450 }, { day: 'Mar', sales: 520 }, { day: 'Mie', sales: 480 },
                    { day: 'Jue', sales: 610 }, { day: 'Vie', sales: 850 }, { day: 'Sab', sales: 1200 }, { day: 'Dom', sales: 980 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Ventas por Mesero">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByWaiterData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Items más vendidos">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Ceviche', count: 45 }, { name: 'Lomo Saltado', count: 38 },
                    { name: 'Aji de Gallina', count: 22 }, { name: 'Pisco Sour', count: 18 }
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={100} />
                    <Tooltip cursor={{ fill: '#F5F5F5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </motion.div>
        )}

        {activeTab === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Gestión de Menú</h3>
              <button 
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
              >
                <Plus size={18} /> Nuevo Platillo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menu.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm group hover:border-neutral-400 transition-all">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-neutral-50">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon size={24} className="text-neutral-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold truncate">{item.name}</h4>
                        {!item.available && <span className="bg-red-50 text-red-500 text-[8px] font-black px-1 rounded">AGOTADO</span>}
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-1">{item.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-black text-sm">{formatCurrency(item.price)}</span>
                        <span className="text-[10px] font-bold uppercase text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded">{item.category.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingItem(item)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => deleteMenuItem(item.id)}
                      className="flex items-center justify-center px-3 py-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Menu Item Modal (Add/Edit) */}
            <AnimatePresence>
              {(isAddingItem || editingItem) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => { setIsAddingItem(false); setEditingItem(null); }}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6"
                  >
                    <h3 className="text-xl font-black mb-6">{isAddingItem ? 'Añadir Platillo' : 'Editar Platillo'}</h3>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const itemData = {
                          name: formData.get('name') as string,
                          description: formData.get('description') as string,
                          price: parseFloat(formData.get('price') as string),
                          category: formData.get('category') as Category,
                          imageUrl: formData.get('imageUrl') as string,
                          available: formData.get('available') === 'on'
                        };
                        if (isAddingItem) addMenuItem(itemData);
                        else if (editingItem) updateMenuItem(editingItem.id, itemData);
                        setIsAddingItem(false);
                        setEditingItem(null);
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase">Nombre</label>
                        <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-2 bg-neutral-50 border border-neutral-100 rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase">Descripción</label>
                        <textarea name="description" defaultValue={editingItem?.description} required className="w-full px-4 py-2 bg-neutral-50 border border-neutral-100 rounded-xl min-h-[80px]" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 text-left">
                          <label className="text-xs font-bold text-neutral-400 uppercase">Precio (PEN)</label>
                          <input name="price" type="number" step="0.01" defaultValue={editingItem?.price} required className="w-full px-4 py-2 bg-neutral-50 border border-neutral-100 rounded-xl" />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-xs font-bold text-neutral-400 uppercase">Categoría</label>
                          <select name="category" defaultValue={editingItem?.category || 'platos_principales'} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-100 rounded-xl">
                            <option value="entradas">Entradas</option>
                            <option value="platos_principales">Platos Principales</option>
                            <option value="bebidas">Bebidas</option>
                            <option value="postres">Postres</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-neutral-400 uppercase">URL de Imagen</label>
                        <input name="imageUrl" defaultValue={editingItem?.imageUrl} placeholder="https://ejemplo.com/imagen.jpg" className="w-full px-4 py-2 bg-neutral-50 border border-neutral-100 rounded-xl" />
                      </div>

                      <div className="flex items-center gap-2 py-2">
                        <input name="available" type="checkbox" defaultChecked={editingItem ? editingItem.available : true} className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900" />
                        <label className="text-xs font-bold text-neutral-600 uppercase">Disponible para la venta</label>
                      </div>
                      <div className="flex gap-3 pt-6">
                        <button type="button" onClick={() => { setIsAddingItem(false); setEditingItem(null); }} className="flex-1 py-3 font-bold text-neutral-400 hover:text-neutral-600 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-black transition-shadow shadow-lg">Guardar</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'sales' && (
          <motion.div 
            key="sales"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Registro de Ingresos</h3>
                <p className="text-sm text-neutral-500">Histórico de todas las transacciones finalizadas.</p>
              </div>
              <button 
                onClick={exportSalesToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md"
              >
                <Download size={18} /> Exportar PDF
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-400">ID Orden</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-400">Mesero</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-400">Fecha y Hora</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-400">Items</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-400 text-right">Total</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-400"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {completedOrders.length > 0 ? (
                      completedOrders.map(order => (
                        <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">#{order.id.slice(-6)}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                              {order.waiterId || 'No asignado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-600">{new Date(order.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {order.items.map((item, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-500 border border-neutral-200">
                                  {item.quantity}x {item.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-black">{formatCurrency(order.totalPrice)}</td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-neutral-400 hover:text-neutral-900"><FileText size={18} /></button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 italic">No hay ventas registradas aún</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'employees' && (
          <motion.div 
            key="employees"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Gestión de Personal</h3>
              <button 
                onClick={() => setIsAddingEmployee(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg"
              >
                <UserPlus size={18} /> Nuevo Empleado
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map(emp => (
                <div key={emp.id} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm relative group overflow-hidden">
                  <div className={cn(
                    "absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-10",
                    emp.role === 'chef' ? "bg-orange-600" : "bg-blue-600"
                  )} />
                  <div className="flex items-center gap-4 mb-6 relative">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg",
                      emp.role === 'chef' ? "bg-orange-600" : "bg-blue-600"
                    )}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-neutral-900">{emp.name}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{emp.role === 'chef' ? 'Cocinero' : 'Mesero'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Mail size={14} className="opacity-40" /> {emp.email}
                    </div>
                    {emp.phone && (
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Phone size={14} className="opacity-40" /> {emp.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-neutral-50">
                    <button 
                      onClick={() => setEditingEmployee(emp)}
                      className="flex-1 py-2 text-xs font-bold bg-neutral-50 text-neutral-600 rounded-xl hover:bg-neutral-100"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => deleteEmployee(emp.id)}
                      className="px-3 py-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {employees.length === 0 && (
                <div className="col-span-full py-20 text-center bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
                  <p className="text-neutral-400 font-medium">No has registrado empleados aún.</p>
                </div>
              )}
            </div>

            {/* Employee Modal */}
            <AnimatePresence>
              {(isAddingEmployee || editingEmployee) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => { setIsAddingEmployee(false); setEditingEmployee(null); }}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6"
                  >
                    <h3 className="text-xl font-black mb-6">{isAddingEmployee ? 'Nuevo Colaborador' : 'Editar Personal'}</h3>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const empData = {
                          name: formData.get('name') as string,
                          email: formData.get('email') as string,
                          phone: formData.get('phone') as string,
                          role: formData.get('role') as EmployeeRole,
                          active: true
                        };
                        if (isAddingEmployee) addEmployee(empData);
                        else if (editingEmployee) updateEmployee(editingEmployee.id, empData);
                        setIsAddingEmployee(false);
                        setEditingEmployee(null);
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Nombre Completo</label>
                        <input name="name" defaultValue={editingEmployee?.name} required className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Email</label>
                        <input name="email" type="email" defaultValue={editingEmployee?.email} required className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Celular</label>
                          <input name="phone" defaultValue={editingEmployee?.phone} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Rol</label>
                          <select name="role" defaultValue={editingEmployee?.role || 'waiter'} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none font-bold">
                            <option value="waiter">Mesero</option>
                            <option value="chef">Cocinero / Chef</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-6">
                        <button type="button" onClick={() => { setIsAddingEmployee(false); setEditingEmployee(null); }} className="flex-1 py-3 font-bold text-neutral-400 hover:text-neutral-600 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-black transition-shadow shadow-lg">Guardar Registro</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
      active ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StatCard: React.FC<{ title: string; value: string; description: string; icon: React.ReactNode }> = ({ title, value, description, icon }) => (
  <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{title}</p>
      <h4 className="text-2xl font-black mt-1 text-neutral-900">{value}</h4>
      <p className="text-[10px] font-medium text-neutral-500 mt-1">{description}</p>
    </div>
    <div className="p-2 bg-neutral-50 rounded-xl">{icon}</div>
  </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-6">{title}</h3>
    <div className="h-64">{children}</div>
  </div>
);
