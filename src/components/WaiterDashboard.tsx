/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Table, MenuItem, OrderItem, Category } from '../types';
import { Plus, Minus, Search, Trash2, ArrowLeft, CheckCircle, Utensils, Wallet, Download } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const WaiterDashboard: React.FC = () => {
  const { tables, menu, orders, addOrder, updateTableStatus, completeOrder, employees, categories: rawCategories } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [numDiners, setNumDiners] = useState<number>(0);
  const [activeDiner, setActiveDiner] = useState<number>(1);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'todos'>('todos');
  const [showSales, setShowSales] = useState(false);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');

  const activeOrderForTable = orders.find(o => o.tableId === selectedTable?.id && o.status === 'active');

  const waiters = employees.filter(e => e.role === 'waiter');
  
  // Effective waiter name for current session
  const currentWaiter = waiters.find(w => w.id === selectedWaiterId)?.name || "Mesero Demo";

  const categories = [
    { id: 'todos', label: 'Todo' },
    ...rawCategories.map(c => ({ id: c.name, label: c.name }))
  ];

  const addToCart = (item: MenuItem) => {
    if (!item.available) return;
    setCart(prev => {
      // Find if item already exists FOR THIS DINER
      const existingIndex = prev.findIndex(i => i.menuItemId === item.id && i.dinerNumber === activeDiner);
      
      if (existingIndex > -1) {
        return prev.map((i, idx) => idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i);
      }
      
      return [...prev, {
        id: `oi${Date.now()}${Math.random()}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        status: 'pending',
        dinerNumber: activeDiner
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
      waiterId: currentWaiter, // Use selected waiter
      items: cart,
      totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'active',
    });
    setCart([]);
    setSelectedTable(null);
    setNumDiners(0);
    setActiveDiner(1);
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    if (table.status === 'occupied') {
      const activeOrder = orders.find(o => o.tableId === table.id && o.status === 'active');
      if (activeOrder) {
        const diners = new Set(activeOrder.items.map(i => i.dinerNumber || 1));
        setNumDiners(diners.size);
      } else {
        setNumDiners(table.currentDiners || 1);
      }
    } else {
      setNumDiners(0); // Needs initialization
    }
  };

  const myCompletedOrders = orders.filter(o => o.status === 'completed' && o.waiterId === currentWaiter);
  const myTotalSales = myCompletedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const exportMySalesToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Reporte de Ventas - ${currentWaiter}`, 20, 20);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 30);
    
    const tableData = myCompletedOrders.map(order => [
      order.id.slice(-6),
      new Date(order.createdAt).toLocaleTimeString(),
      formatCurrency(order.totalPrice)
    ]);

    (doc as any).autoTable({
      startY: 40,
      head: [['ID Orden', 'Hora', 'Total']],
      body: tableData,
    });

    doc.text(`Ventas Totales: ${formatCurrency(myTotalSales)}`, 20, (doc as any).lastAutoTable.finalY + 10);
    doc.save(`mis_ventas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleCompleteOrder = () => {
    if (activeOrderForTable) {
      completeOrder(activeOrderForTable.id);
      setSelectedTable(null);
      setNumDiners(0);
      setActiveDiner(1);
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'todos' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Salón de Mesas</h1>
                <p className="text-neutral-500 text-sm">Selecciona una mesa para gestionar su orden.</p>
              </div>
              <div className="flex items-center gap-3">
                {waiters.length > 0 && !showSales && (
                  <select 
                    value={selectedWaiterId} 
                    onChange={(e) => setSelectedWaiterId(e.target.value)}
                    className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="">Seleccionar Mesero</option>
                    {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                )}
                <button 
                  onClick={() => setShowSales(!showSales)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl font-bold text-xs hover:border-neutral-900 transition-all"
                >
                  <Wallet size={16} /> {showSales ? 'MESAS' : 'MIS VENTAS'}
                </button>
              </div>
            </header>

            {showSales ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">Mis Ventas de Hoy</p>
                    <h2 className="text-4xl font-black mt-2">{formatCurrency(myTotalSales)}</h2>
                    <button 
                      onClick={exportMySalesToPDF}
                      className="mt-6 flex items-center justify-center gap-2 w-full py-2 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold hover:bg-white/30 transition-all"
                    >
                      <Download size={16} /> EXPORTAR PDF
                    </button>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Órdenes Atendidas</p>
                    <h2 className="text-4xl font-black mt-2 text-neutral-900">{myCompletedOrders.length}</h2>
                    <p className="text-xs text-neutral-500 mt-2">Mesero: {currentWaiter}</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-100">
                        <th className="px-6 py-4 font-bold text-neutral-400">ID</th>
                        <th className="px-6 py-4 font-bold text-neutral-400">HORA</th>
                        <th className="px-6 py-4 font-bold text-neutral-400 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {myCompletedOrders.map(order => (
                        <tr key={order.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 font-bold text-blue-600">#{order.id.slice(-6)}</td>
                          <td className="px-6 py-4 text-neutral-500">{new Date(order.createdAt).toLocaleTimeString()}</td>
                          <td className="px-6 py-4 text-right font-black">{formatCurrency(order.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleTableSelect(table)}
                    className={cn(
                      "relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all p-4",
                      table.status === 'available' ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-300" :
                      table.status === 'occupied' ? "border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-300 shadow-inner" :
                      "border-orange-100 bg-orange-50 text-orange-700 hover:border-orange-300"
                    )}
                  >
                    <span className="text-xs font-bold uppercase opacity-50">Mesa</span>
                    <span className="text-3xl font-black">{table.number}</span>
                    
                    {table.totalActivations !== undefined && (
                      <div className="absolute top-2 right-2 text-[8px] font-black bg-neutral-100 text-neutral-400 px-1.5 py-0.5 rounded-full">
                        {table.totalActivations}v
                      </div>
                    )}
                    
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      table.status === 'available' ? "bg-emerald-200" :
                      table.status === 'occupied' ? "bg-blue-200" : "bg-orange-200"
                    )}>
                      {table.status === 'available' ? 'LIBRE' : 
                      table.status === 'occupied' ? 'OCUPADA' : 'SUCIA'}
                    </span>
                    
                    <div className="flex flex-col items-center gap-1 mt-2">
                        {table.status === 'occupied' && (
                          <>
                            <span className="text-[9px] font-black">{table.currentDiners} COMENSALES</span>
                            <div className="flex gap-1">
                              {(() => {
                                const order = orders.find(o => o.tableId === table.id && o.status === 'active');
                                const allReady = order?.items.every(i => i.status === 'ready');
                                const someCooking = order?.items.some(i => i.status === 'cooking');
                                
                                return (
                                  <>
                                    <div className={cn("w-3 h-3 rounded-full border border-neutral-200", order ? "bg-orange-500" : "bg-neutral-50")}></div>
                                    <div className={cn("w-3 h-3 rounded-full border border-neutral-200 shadow-sm", someCooking ? "bg-amber-400" : "bg-neutral-50")}></div>
                                    <div className={cn("w-3 h-3 rounded-full border border-neutral-200 shadow-sm", allReady ? "bg-emerald-500" : "bg-neutral-50")}></div>
                                  </>
                                );
                              })()}
                            </div>
                          </>
                        )}
                        
                        {(table.status === 'dirty' || table.status === 'occupied') && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const msg = table.status === 'occupied' ? '¿Deseas cerrar el servicio y marcar la mesa como sucia?' : '¿Deseas resetear la mesa a disponible?';
                              if (confirm(msg)) {
                                updateTableStatus(table.id, table.status === 'occupied' ? 'dirty' : 'available', 0);
                              }
                            }}
                            className="mt-1 text-[8px] font-black underline uppercase text-neutral-400 hover:text-neutral-900"
                          >
                            {table.status === 'occupied' ? 'Finalizar' : 'Liberar'}
                          </button>
                        )}

                        {table.status === 'available' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTableSelect(table);
                            }}
                            className="mt-1 text-[8px] font-black underline uppercase text-neutral-400 hover:text-emerald-600"
                          >
                            Abrir Servicio
                          </button>
                        )}
                    </div>

                    {table.status === 'occupied' && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="order"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="flex flex-col lg:flex-row gap-6 h-full"
          >
            {/* Modal for Diners Count if new table */}
            {selectedTable.status === 'available' && numDiners === 0 && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl"
                >
                  <h3 className="text-2xl font-black mb-2">Comensales</h3>
                  <p className="text-neutral-500 text-sm mb-6">¿Cuántas personas ocuparán la mesa {selectedTable.number}?</p>
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <button 
                        key={n}
                        onClick={() => { setNumDiners(n); setActiveDiner(1); }}
                        className="py-4 bg-neutral-100 rounded-2xl font-black text-xl hover:bg-neutral-900 hover:text-white transition-all shadow-sm"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setSelectedTable(null)}
                    className="text-neutral-400 font-bold hover:text-neutral-900"
                  >
                    Cancelar
                  </button>
                </motion.div>
              </div>
            )}

            {/* Menu Selection */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setSelectedTable(null); setNumDiners(0); }}
                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold">Mesa {selectedTable.number}</h2>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{numDiners} Comensales</p>
                  </div>
                </div>

                <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
                  {Array.from({ length: numDiners }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveDiner(i + 1)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black transition-all",
                        activeDiner === i + 1 ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                      )}
                    >
                      C{i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar platillo..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                        activeCategory === cat.id ? "bg-neutral-900 text-white" : "bg-white text-neutral-400 border border-neutral-100"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide">
                {filteredMenu.map(item => (
                  <button
                    key={item.id}
                    disabled={!item.available}
                    onClick={() => addToCart(item)}
                    className={cn(
                      "flex text-left p-3 rounded-xl border transition-all group",
                      item.available 
                        ? "border-neutral-100 bg-white hover:border-neutral-300 hover:shadow-md" 
                        : "border-neutral-50 bg-neutral-50/50 opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg mr-3 flex-shrink-0 overflow-hidden">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={cn("font-bold truncate", item.available ? "text-neutral-900 group-hover:text-blue-600" : "text-neutral-400")}>{item.name}</h4>
                        {!item.available && <span className="bg-red-50 text-red-500 text-[8px] font-black px-1 rounded">AGOTADO</span>}
                      </div>
                      <p className="text-[10px] text-neutral-500 line-clamp-1">{item.description}</p>
                      <p className="text-xs font-bold mt-1">{formatCurrency(item.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Cart / Order Details */}
            <div className="w-full lg:w-96 flex flex-col bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden min-h-[500px]">
              <div className="p-6 bg-neutral-900 text-white flex justify-between items-center">
                <span className="font-bold uppercase tracking-tighter">ORDEN MESA {selectedTable.number}</span>
                {activeOrderForTable && (
                  <span className="text-[10px] px-2 py-1 bg-emerald-500 rounded-md font-bold">EN PROCESO</span>
                )}
              </div>

              <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                {Array.from({ length: numDiners }).map((_, idx) => {
                  const dinerIdx = idx + 1;
                  const activeItems = activeOrderForTable?.items.filter(i => (i.dinerNumber || 1) === dinerIdx) || [];
                  const cartItems = cart.filter(i => i.dinerNumber === dinerIdx);
                  
                  if (activeItems.length === 0 && cartItems.length === 0) return null;

                  return (
                    <div key={dinerIdx} className="space-y-2">
                      <div className="flex justify-between items-center bg-neutral-50 px-3 py-1.5 rounded-lg border-l-4 border-neutral-900">
                        <span className="text-xs font-black">COMENSAL {dinerIdx}</span>
                        <span className="text-[10px] font-bold text-neutral-400">
                          {activeItems.length + cartItems.length} items
                        </span>
                      </div>
                      
                      <div className="space-y-3 px-1">
                        {activeItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-neutral-400">x{item.quantity}</span>
                                <span className={cn(
                                  "text-[8px] font-black px-1.5 py-0.5 rounded",
                                  item.status === 'pending' ? "bg-neutral-100 text-neutral-600" :
                                  item.status === 'cooking' ? "bg-orange-100 text-orange-600" :
                                  item.status === 'ready' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                                )}>
                                  {item.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        
                        {cartItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center group">
                            <div>
                              <p className="text-sm font-medium italic text-blue-600">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-neutral-100 rounded-md text-neutral-400"><Minus size={12} /></button>
                                <span className="text-xs w-4 text-center font-bold text-blue-600">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-neutral-100 rounded-md text-neutral-400"><Plus size={12} /></button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-blue-600">{formatCurrency(item.price * item.quantity)}</span>
                              <button onClick={() => removeFromCart(item.id)} className="text-neutral-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {cart.length === 0 && !activeOrderForTable && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-20">
                    <Utensils size={48} className="mb-4" />
                    <p className="text-sm font-medium">No hay pedidos registrados</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-neutral-50 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <div className="pt-2 flex justify-between items-center text-2xl font-black tracking-tighter">
                  <span className="text-neutral-400 text-sm uppercase tracking-widest font-bold">Total Cuenta</span>
                  <span>{formatCurrency(activeOrderForTable?.totalPrice || cart.reduce((s, i) => s + (i.price * i.quantity), 0))}</span>
                </div>

                {activeOrderForTable ? (
                  <button 
                    onClick={handleCompleteOrder}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                  >
                    <CheckCircle size={20} />
                    FINALIZAR Y COBRAR
                  </button>
                ) : (
                  <button 
                    disabled={cart.length === 0}
                    onClick={handleCreateOrder}
                    className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-all shadow-lg active:scale-95"
                  >
                    ENVIAR COMANDA
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
