/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Clock, CheckCircle2, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const KitchenDashboard: React.FC = () => {
  const { orders, updateOrderItemStatus, tables } = useRestaurant();

  const activeOrders = orders.filter(o => o.status === 'active');
  
  // Flat list of all items that are not yet served, grouped by order
  // Sort by created time (oldest first)
  const cookingItems = activeOrders.sort((a, b) => a.createdAt - b.createdAt);

  if (activeOrders.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-400">
        <Clock size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-semibold">Todo al día</h2>
        <p>No hay órdenes pendientes en este momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">KDS - Pantalla de Cocina</h1>
          <p className="text-neutral-500 text-sm">Gestiona la preparación de pedidos en tiempo real.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
            {cookingItems.length} ÓRDENES
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {cookingItems.map((order) => {
            const table = tables.find(t => t.id === order.tableId);
            const timeElapsed = Math.floor((Date.now() - order.createdAt) / 60000);
            
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "bg-white rounded-3xl border-2 flex flex-col overflow-hidden shadow-sm",
                  timeElapsed > 20 ? "border-red-200" : timeElapsed > 10 ? "border-orange-200" : "border-neutral-100"
                )}
              >
                <div className={cn(
                  "p-4 flex justify-between items-center",
                  timeElapsed > 20 ? "bg-red-50" : timeElapsed > 10 ? "bg-orange-50" : "bg-neutral-50"
                )}>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">Mesa</span>
                    <h3 className="text-2xl font-black">{table?.number}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-neutral-400">HACE {timeElapsed} MIN</p>
                    <p className="text-[10px] text-neutral-400 uppercase">#ORDEN: {order.id.slice(-4)}</p>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-4">
                  {order.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-2xl transition-all",
                        item.status === 'ready' ? "bg-neutral-50 opacity-40" : "bg-white border border-neutral-100"
                      )}
                    >
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neutral-900 text-white rounded-lg font-bold text-lg">
                        {item.quantity}
                      </span>
                      <div className="flex-1">
                        <p className={cn("font-bold", item.status === 'ready' && "line-through text-neutral-400")}>
                          {item.name}
                        </p>
                        {item.notes && <p className="text-xs text-red-500 italic mt-0.5">Nota: {item.notes}</p>}
                        
                        <div className="mt-3 flex gap-2">
                          {item.status === 'pending' && (
                            <button 
                              onClick={() => updateOrderItemStatus(order.id, item.id, 'cooking')}
                              className="flex items-center gap-1.5 px-3 py-1 bg-orange-600 text-white text-[10px] font-bold rounded-lg hover:bg-orange-700 transition-colors uppercase"
                            >
                              <PlayCircle size={14} /> EMPEZAR
                            </button>
                          )}
                          {item.status === 'cooking' && (
                            <button 
                              onClick={() => updateOrderItemStatus(order.id, item.id, 'ready')}
                              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors uppercase"
                            >
                              <CheckCircle2 size={14} /> LISTO
                            </button>
                          )}
                          {item.status === 'ready' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                              <CheckCircle2 size={14} /> PREPARADO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
