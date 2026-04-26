/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { ShoppingBasket, Receipt, Clock, Star } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Category } from '../types';
import { motion } from 'motion/react';

export const CustomerDashboard: React.FC = () => {
  const { menu, orders, tables, categories: rawCategories } = useRestaurant();
  const [activeCategory, setActiveCategory] = useState<string | 'todos'>('todos');

  // For the customer demo, we'll assume they are at Table 1
  const tableOneId = tables.find(t => t.number === 1)?.id;
  const myOrder = orders.find(o => o.tableId === tableOneId && o.status === 'active');

  const categories = [
    { id: 'todos', label: 'Todo' },
    ...rawCategories.map(c => ({ id: c.name, label: c.name }))
  ];

  const filteredMenu = activeCategory === 'todos' 
    ? menu 
    : menu.filter(item => item.category === activeCategory);

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center text-white">
          <ShoppingBasket size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-black italic tracking-tight">RESTAURANTE PRO</h1>
          <p className="text-neutral-500 font-medium">Experiencia Gastronómica Digital</p>
        </div>
      </header>

      {/* Customer's Order Status (Floating card if active) */}
      {myOrder && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border-2 border-emerald-100 shadow-xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Receipt className="text-emerald-500" size={20} />
                Tu Pedido (Mesa 1)
              </h3>
              <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full animate-pulse">
                EN COCINA
              </span>
            </div>
            
            <div className="space-y-3">
              {myOrder.items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.quantity}x</span>
                    <span>{item.name}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    item.status === 'pending' ? "bg-neutral-100 text-neutral-400" :
                    item.status === 'cooking' ? "bg-orange-100 text-orange-500" :
                    "bg-emerald-100 text-emerald-600"
                  )}>
                    {item.status === 'pending' ? 'ESPERANDO' : 
                     item.status === 'cooking' ? 'COCINANDO' : 'LISTO!'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Chips */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide snap-x">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-black transition-all snap-start",
                activeCategory === cat.id 
                  ? "bg-neutral-900 text-white shadow-xl scale-105" 
                  : "bg-neutral-50 text-neutral-400 border border-neutral-100 hover:bg-neutral-100"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="absolute top-0 right-0 h-full w-12 bg-linear-to-l from-white to-transparent pointer-events-none" />
      </div>

      {/* Menu Grid */}
      <div className="space-y-4">
        {filteredMenu.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group flex gap-4 p-4 rounded-3xl bg-neutral-50 hover:bg-white border border-transparent hover:border-neutral-200 transition-all cursor-pointer"
          >
            <div className="w-24 h-24 bg-neutral-100 rounded-2xl flex-shrink-0 flex items-center justify-center relative overflow-hidden border border-neutral-100">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Star className="text-neutral-200" size={32} />
              )}
              {!item.available && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                   <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">AGOTADO</span>
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
              <div>
                <h4 className={cn("font-black text-lg transition-colors", item.available ? "group-hover:text-blue-600" : "text-neutral-400")}>{item.name}</h4>
                <p className="text-[10px] text-neutral-400 font-medium line-clamp-2 mt-0.5">{item.description}</p>
              </div>
              <div className="flex justify-between items-end">
                <span className={cn("font-bold text-xl", !item.available && "text-neutral-300")}>{formatCurrency(item.price)}</span>
                <div className="flex items-center gap-1 text-[8px] text-neutral-400 font-bold uppercase tracking-widest">
                  <Clock size={10} /> 15-20 MIN
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
