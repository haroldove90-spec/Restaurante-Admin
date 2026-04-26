/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Table, MenuItem, OrderItem } from '../types';
import { Plus, Minus, Search, Trash2, ArrowLeft, CheckCircle, Utensils } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const WaiterDashboard: React.FC = () => {
  const { tables, menu, orders, addOrder, updateTableStatus, completeOrder } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const activeOrderForTable = orders.find(o => o.tableId === selectedTable?.id && o.status === 'active');

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: `oi${Date.now()}${Math.random()}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        status: 'pending'
      }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const newQty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: newQty };
    }));
  };

  const handleCreateOrder = () => {
    if (!selectedTable || cart.length === 0) return;
    
    addOrder({
      tableId: selectedTable.id,
      items: cart,
      totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'active',
    });
    setCart([]);
    setSelectedTable(null);
  };

  const handleCompleteOrder = () => {
    if (activeOrderForTable) {
      completeOrder(activeOrderForTable.id);
      setSelectedTable(null);
    }
  };

  const filteredMenu = menu.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {!selectedTable ? (
          <motion.div 
            key="tables"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Salón de Mesas</h1>
              <p className="text-neutral-500 text-sm">Selecciona una mesa para gestionar su orden.</p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={cn(
                    "relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all p-4",
                    table.status === 'available' ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-300" :
                    table.status === 'occupied' ? "border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-300 shadow-inner" :
                    "border-orange-100 bg-orange-50 text-orange-700 hover:border-orange-300"
                  )}
                >
                  <span className="text-xs font-bold uppercase opacity-50">Mesa</span>
                  <span className="text-3xl font-black">{table.number}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    table.status === 'available' ? "bg-emerald-200" :
                    table.status === 'occupied' ? "bg-blue-200" : "bg-orange-200"
                  )}>
                    {table.status === 'available' ? 'LIBRE' : 
                     table.status === 'occupied' ? 'OCUPADA' : 'SUCIA'}
                  </span>
                  {table.status === 'occupied' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="order"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="flex flex-col lg:flex-row gap-6 h-full"
          >
            {/* Menu Selection */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedTable(null)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold">Mesa {selectedTable.number}</h2>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar platillo..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide">
                {filteredMenu.map(item => (
                  <button
                    key={item.id}
                    disabled={!item.available}
                    onClick={() => addToCart(item)}
                    className="flex text-left p-3 rounded-xl border border-neutral-100 bg-white hover:border-neutral-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">{item.name}</h4>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{item.description}</p>
                      <p className="text-sm font-bold mt-2">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center justify-center p-2 bg-neutral-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                      <Plus size={20} className="text-neutral-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Cart / Order Details */}
            <div className="w-full lg:w-96 flex flex-col bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden min-h-[500px]">
              <div className="p-6 bg-neutral-900 text-white flex justify-between items-center">
                <span className="font-bold">ORDEN ACTUAL</span>
                {activeOrderForTable && (
                  <span className="text-[10px] px-2 py-1 bg-emerald-500 rounded-md font-bold">EN PROCESO</span>
                )}
              </div>

              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {activeOrderForTable ? (
                  <div className="space-y-4">
                    {activeOrderForTable.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center pb-2 border-b border-neutral-50">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-neutral-400">Qty: {item.quantity}</span>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              item.status === 'pending' ? "bg-neutral-100 text-neutral-600" :
                              item.status === 'cooking' ? "bg-orange-100 text-orange-600" :
                              item.status === 'ready' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ) : cart.length > 0 ? (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-neutral-100 rounded-md"><Minus size={14} /></button>
                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-neutral-100 rounded-md"><Plus size={14} /></button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-neutral-300 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                    <Utensils size={48} className="mb-4" />
                    <p>No hay items seleccionados</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-neutral-50 space-y-4">
                <div className="flex justify-between items-center text-neutral-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency((activeOrderForTable?.totalPrice || cart.reduce((s, i) => s + (i.price * i.quantity), 0)) * 0.82)}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-500">
                  <span>IGV (18%)</span>
                  <span>{formatCurrency((activeOrderForTable?.totalPrice || cart.reduce((s, i) => s + (i.price * i.quantity), 0)) * 0.18)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-xl font-black">
                  <span>Total</span>
                  <span>{formatCurrency(activeOrderForTable?.totalPrice || cart.reduce((s, i) => s + (i.price * i.quantity), 0))}</span>
                </div>

                {activeOrderForTable ? (
                  <button 
                    onClick={handleCompleteOrder}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <CheckCircle size={20} />
                    COBRAR Y CERRAR
                  </button>
                ) : (
                  <button 
                    disabled={cart.length === 0}
                    onClick={handleCreateOrder}
                    className="w-full py-3 bg-neutral-900 text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors"
                  >
                    ENVIAR A COCINA
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
