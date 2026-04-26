/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { RoleSelector } from './components/RoleSelector';
import { AdminDashboard } from './components/AdminDashboard';
import { WaiterDashboard } from './components/WaiterDashboard';
import { KitchenDashboard } from './components/KitchenDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { NotificationToast } from './components/NotificationToast';
import { Layout } from 'lucide-react';

function DashboardSwitch() {
  const { currentRole } = useRestaurant();

  switch (currentRole) {
    case 'admin': return <AdminDashboard />;
    case 'waiter': return <WaiterDashboard />;
    case 'kitchen': return <KitchenDashboard />;
    case 'customer': return <CustomerDashboard />;
    default: return <AdminDashboard />;
  }
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-neutral-900 text-white p-1.5 rounded-xl">
            <Layout size={20} />
          </div>
          <span className="font-black text-xs tracking-[0.2em] uppercase hidden sm:block">Restoflow</span>
        </div>
        
        <RoleSelector />
        
        <div className="hidden md:flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
          <span>Abril 26, 2026</span>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <span className="text-emerald-500">Sistema Activo</span>
        </div>
      </nav>

      <NotificationToast />

      {/* Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <DashboardSwitch />
      </main>

      {/* Footer / Mobile Hint */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-neutral-100 text-center opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Built for Modern Hospitality &copy; 2026</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <MainLayout />
    </RestaurantProvider>
  );
}
