/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Clock, CheckCircle2, PlayCircle, BarChart3, ChefHat, History, Utensils, Bell, X, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const KitchenDashboard: React.FC = () => {
  const { orders, updateOrderItemStatus, tables, lastNotification, clearNotification } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'pending' | 'prepared'>('pending');
  const [selectedPreparedItems, setSelectedPreparedItems] = useState<string[]>([]);

  // Auto-clear notification
  useEffect(() => {
    if (lastNotification) {
      const timer = setTimeout(() => {
        if (clearNotification) clearNotification();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [lastNotification, clearNotification]);

  const activeOrders = orders.filter(o => o.status === 'active');
  const completedOrders = orders.filter(o => o.status === 'completed');

  // Pending items for current orders
  const pendingOrders = activeOrders.filter(o => o.items.some(i => i.status !== 'ready'))
    .sort((a, b) => Number(a.createdAt) - Number(b.createdAt));

  // Prepared items: Flat list of items marked as 'ready' from both active and completed orders
  const allReadyItems = [...activeOrders, ...completedOrders].flatMap(order => 
    order.items.filter(i => i.status === 'ready' || i.status === 'served')
      .map(item => ({ 
        ...item, 
        orderDate: Number(order.createdAt), 
        tableId: order.tableId, 
        orderId: order.id,
        selectionId: `${order.id}-${item.id}`
      }))
  ).sort((a: any, b: any) => Number(b.orderDate) - Number(a.orderDate));

  const exportPreparedToPDF = () => {
    const itemsToExport = selectedPreparedItems.length > 0
      ? allReadyItems.filter(item => selectedPreparedItems.includes(item.selectionId))
      : allReadyItems;

    if (itemsToExport.length === 0) {
      alert("No hay platillos preparados para exportar");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('RESTAURANTE PRO - KDS', 14, 20);
    doc.setFontSize(10);
    doc.text(`Reporte de Platillos Preparados - ${new Date().toLocaleString()}`, 14, 28);
    
    const tableData = itemsToExport.map(item => [
      `#${item.orderId.slice(-6)}`,
      `MESA ${tables.find(t => t.id === item.tableId)?.number || '?'}`,
      item.name,
      item.quantity.toString(),
      new Date(item.orderDate).toLocaleTimeString()
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['ORDEN', 'MESA', 'PLATILLO', 'CANT', 'HORA']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [24, 24, 24] }
    });

    try {
      doc.save(`reporte_cocina_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Kitchen PDF Error:', err);
      const docUrl = doc.output('bloburl');
      window.open(docUrl.toString());
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedPreparedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedPreparedItems.length === allReadyItems.length) {
      setSelectedPreparedItems([]);
    } else {
      setSelectedPreparedItems(allReadyItems.map(i => i.selectionId));
    }
  };

  // Metrics
  const totalPreparedCount = allReadyItems.length;
  const mostPreparedItems = allReadyItems.reduce((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const topItem = Object.entries(mostPreparedItems).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {lastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={cn(
              "fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-8 py-5 rounded-[2.5rem] shadow-2xl border-2 min-w-[350px] backdrop-blur-xl",
              lastNotification.type === 'success' 
                ? "bg-emerald-600/90 border-emerald-400 text-white" 
                : "bg-neutral-900/90 border-neutral-700 text-white"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              lastNotification.type === 'success' ? "bg-white/20" : "bg-white/10"
            )}>
              <Bell className="animate-bounce" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Alerta de Sistema</p>
              <p className="font-black text-lg">{lastNotification.message}</p>
            </div>
            <button 
              onClick={clearNotification}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 italic">KDS - COCINA</h1>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Gestión de órdenes en tiempo real</p>
        </div>
        <div className="flex bg-neutral-100 p-1.5 rounded-2xl gap-1 overflow-x-auto scrollbar-hide max-w-full">
          <button 
            onClick={() => setActiveTab('pending')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap",
              activeTab === 'pending' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <ChefHat size={16} /> COMANDAS PENDIENTES ({pendingOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('prepared')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap",
              activeTab === 'prepared' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <History size={16} /> PLATILLOS PREPARADOS
          </button>
        </div>
      </header>

      {activeTab === 'pending' ? (
        <>
          {pendingOrders.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-neutral-400">
              <Clock size={64} className="mb-4 opacity-20" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Todo al día</h2>
              <p className="text-sm">No hay órdenes pendientes en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {pendingOrders.map((order) => {
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
                        "bg-white rounded-[2.5rem] border-2 flex flex-col overflow-hidden shadow-sm",
                        timeElapsed > 20 ? "border-red-200" : timeElapsed > 10 ? "border-orange-200" : "border-neutral-100"
                      )}
                    >
                      <div className={cn(
                        "p-6 flex justify-between items-center",
                        timeElapsed > 20 ? "bg-red-50 text-red-700" : timeElapsed > 10 ? "bg-orange-50 text-orange-700" : "bg-neutral-50"
                      )}>
                        <div>
                          <span className="text-[10px] font-black uppercase opacity-60">Mesa</span>
                          <h3 className="text-3xl font-black italic">{table?.number}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase opacity-60">Pedido hace</p>
                          <p className="text-lg font-black">{timeElapsed} MIN</p>
                        </div>
                      </div>

                      <div className="flex-1 p-6 space-y-4">
                        {order.items.map((item) => (
                          <div 
                            key={item.id} 
                            className={cn(
                              "flex items-start gap-4 p-4 rounded-3xl transition-all",
                              item.status === 'ready' ? "bg-emerald-50/50 border border-emerald-100 opacity-60" : "bg-white border border-neutral-100"
                            )}
                          >
                            <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-neutral-900 text-white rounded-xl font-black text-xl">
                              {item.quantity}
                            </span>
                            <div className="flex-1">
                              <p className={cn("text-lg font-black leading-tight", item.status === 'ready' && "line-through text-neutral-400")}>
                                {item.name}
                              </p>
                              {item.notes && <p className="text-xs text-red-500 font-bold italic mt-1 bg-red-50 px-2 py-1 rounded-lg">Nota: {item.notes}</p>}
                              
                              <div className="mt-4 flex gap-2">
                                {item.status === 'pending' && (
                                  <button 
                                    onClick={() => updateOrderItemStatus(order.id, item.id, 'cooking')}
                                    className="flex-1 flex items-center gap-2 px-4 py-3 bg-neutral-900 text-white text-[10px] font-black rounded-2xl hover:bg-black transition-all uppercase justify-center shadow-lg active:scale-95"
                                  >
                                    <PlayCircle size={16} /> EMPEZAR PREPARACIÓN
                                  </button>
                                )}
                                {item.status === 'cooking' && (
                                  <button 
                                    onClick={() => updateOrderItemStatus(order.id, item.id, 'ready')}
                                    className="flex-1 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-[10px] font-black rounded-2xl hover:bg-emerald-700 transition-all uppercase justify-center shadow-xl shadow-emerald-100 active:scale-95"
                                  >
                                    <CheckCircle2 size={18} /> ¡PLATILLO LISTO!
                                  </button>
                                )}
                                {item.status === 'ready' && (
                                  <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-[10px] font-black text-emerald-600 uppercase rounded-2xl border border-emerald-100">
                                    <CheckCircle2 size={16} /> LISTO PARA SALÓN
                                  </div>
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
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center gap-3 opacity-60 mb-2">
                <ChefHat size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Producción Total</span>
              </div>
              <h2 className="text-5xl font-black italic">{totalPreparedCount}</h2>
              <p className="text-xs font-bold mt-2 opacity-60">Platillos preparados durante la jornada</p>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3 text-neutral-400 mb-2">
                <BarChart3 size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Más Pedido</span>
              </div>
              {topItem ? (
                <>
                  <h2 className="text-3xl font-black text-neutral-900 truncate">{topItem[0]}</h2>
                  <p className="text-lg font-black text-emerald-600 mt-1">{topItem[1]} porciones preparadas</p>
                </>
              ) : (
                <p className="text-neutral-400 italic">Sin datos aún</p>
              )}
            </div>

            <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center">
                <Utensils size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Eficiencia</p>
                <p className="text-2xl font-black">Sistema Activo</p>
                <p className="text-xs font-bold text-emerald-400">Sincronización Realtime</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-neutral-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <History size={20} className="text-neutral-400" />
                <h3 className="font-black text-neutral-900 uppercase tracking-widest text-xs">Historial de Preparación</h3>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {selectedPreparedItems.length > 0 && (
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                    {selectedPreparedItems.length} seleccionados
                  </span>
                )}
                <button 
                  onClick={exportPreparedToPDF}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-[10px] font-black hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  <Download size={14} /> EXPORTAR PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    <th className="px-8 py-4 w-10">
                      <input 
                        type="checkbox" 
                        checked={allReadyItems.length > 0 && selectedPreparedItems.length === allReadyItems.length}
                        onChange={toggleAllSelection}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                    </th>
                    <th className="px-8 py-4">ID Pedido</th>
                    <th className="px-8 py-4">Mesa</th>
                    <th className="px-8 py-4">Platillo</th>
                    <th className="px-8 py-4 text-center">Cant</th>
                    <th className="px-8 py-4 text-right">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {allReadyItems.length > 0 ? (
                    allReadyItems.map((item, idx) => {
                      const tableNum = tables.find(t => t.id === item.tableId)?.number || '?';
                      const isSelected = selectedPreparedItems.includes(item.selectionId);
                      return (
                        <tr 
                          key={item.selectionId} 
                          className={cn(
                            "hover:bg-neutral-50 transition-colors cursor-pointer",
                            isSelected && "bg-neutral-50/80"
                          )}
                          onClick={() => toggleItemSelection(item.selectionId)}
                        >
                          <td className="px-8 py-4" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleItemSelection(item.selectionId)}
                              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                            />
                          </td>
                          <td className="px-8 py-4 font-mono text-[10px] font-bold text-blue-600">#{item.orderId.slice(-6)}</td>
                          <td className="px-8 py-4"><span className="px-2 py-1 bg-neutral-100 rounded-lg font-black text-xs">MESA {tableNum}</span></td>
                          <td className="px-8 py-4 font-bold">{item.name}</td>
                          <td className="px-8 py-4 text-center font-black">{item.quantity}</td>
                          <td className="px-8 py-4 text-right text-xs text-neutral-500">{new Date(item.orderDate).toLocaleTimeString()}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-neutral-400 italic">No hay historial de platillos preparados aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
