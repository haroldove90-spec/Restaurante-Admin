/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { TrendingUp, Users, DollarSign, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  const { orders, menu } = useRestaurant();

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalItemsSold = completedOrders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);

  // Mock data for charts - in a real app this would come from the backend based on order timestamps
  const salesHistory = [
    { day: 'Lun', sales: 450, orders: 12 },
    { day: 'Mar', sales: 520, orders: 15 },
    { day: 'Mie', sales: 480, orders: 14 },
    { day: 'Jue', sales: 610, orders: 18 },
    { day: 'Vie', sales: 850, orders: 25 },
    { day: 'Sab', sales: 1200, orders: 35 },
    { day: 'Dom', sales: 980, orders: 30 },
  ];

  const popularItems = [
    { name: 'Ceviche', count: 45 },
    { name: 'Lomo Saltado', count: 38 },
    { name: 'Aji de Gallina', count: 22 },
    { name: 'Pisco Sour', count: 18 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard Administrativo</h1>
        <p className="text-neutral-500 text-sm">Resumen de operaciones y ventas del restaurante.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Ventas Totales" 
          value={formatCurrency(totalRevenue)} 
          description="+12.5% vs semana pasada" 
          icon={<DollarSign className="text-emerald-600" size={20} />}
        />
        <StatCard 
          title="Órdenes Completadas" 
          value={completedOrders.length.toString()} 
          description="Hoy" 
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
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-6">Ventas Semanales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-6">Platillos Destacados</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#111' }} width={100} />
                <Tooltip 
                  cursor={{ fill: '#F5F5F5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon }) => (
  <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{title}</p>
      <h4 className="text-2xl font-bold mt-1 text-neutral-900">{value}</h4>
      <p className="text-[10px] text-neutral-500 mt-1">{description}</p>
    </div>
    <div className="p-2 bg-neutral-50 rounded-xl">
      {icon}
    </div>
  </div>
);
