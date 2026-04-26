/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useRestaurant();

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        removeNotification(notifications[notifications.length - 1].id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 w-80">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={cn(
              "p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md",
              notif.type === 'success' ? "bg-emerald-50/90 border-emerald-100 text-emerald-800" :
              notif.type === 'warning' ? "bg-amber-50/90 border-amber-100 text-amber-800" :
              "bg-blue-50/90 border-blue-100 text-blue-800"
            )}
          >
            <div className="mt-1">
              {notif.type === 'success' ? <CheckCircle size={18} /> :
               notif.type === 'warning' ? <AlertCircle size={18} /> :
               <Info size={18} />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-1">Cocinero dice:</p>
              <p className="text-sm font-bold">{notif.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(notif.id)}
              className="mt-1 opacity-40 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
