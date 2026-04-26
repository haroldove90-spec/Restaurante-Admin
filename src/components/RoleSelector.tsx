/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Role } from '../types';
import { UserCog, Utensils, ChefHat, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const RoleSelector: React.FC = () => {
  const { currentRole, setRole } = useRestaurant();

  const roles: { id: Role; label: string; icon: React.ReactNode }[] = [
    { id: 'admin', label: 'Administrador', icon: <UserCog size={18} /> },
    { id: 'waiter', label: 'Mesero', icon: <Utensils size={18} /> },
    { id: 'kitchen', label: 'Cocina', icon: <ChefHat size={18} /> },
    { id: 'customer', label: 'Cliente', icon: <UserCircle size={18} /> },
  ];

  return (
    <div className="flex bg-neutral-900 text-white p-1 rounded-lg gap-1">
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => setRole(role.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            currentRole === role.id 
              ? "bg-white text-black shadow-sm" 
              : "hover:bg-neutral-800 text-neutral-400"
          )}
          id={`role-btn-${role.id}`}
        >
          {role.icon}
          <span className="hidden sm:inline">{role.label}</span>
        </button>
      ))}
    </div>
  );
};
