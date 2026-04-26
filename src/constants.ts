/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Table } from './types';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Ceviche Clásico',
    description: 'Pescado fresco marinado en limón, con ají y cilantro.',
    price: 12.50,
    category: 'entradas',
    available: true
  },
  {
    id: 'm2',
    name: 'Empanadas de Carne',
    description: 'Tres empanadas fritas rellenas de carne y especias.',
    price: 8.00,
    category: 'entradas',
    available: true
  },
  {
    id: 'm3',
    name: 'Lomo Saltado',
    description: 'Trozos de res salteados con cebolla, tomate y papas fritas.',
    price: 18.50,
    category: 'platos_principales',
    available: true
  },
  {
    id: 'm4',
    name: 'Ají de Gallina',
    description: 'Pechuga de pollo deshilachada en crema de ají amarillo.',
    price: 16.00,
    category: 'platos_principales',
    available: true
  },
  {
    id: 'm5',
    name: 'Chicha Morada',
    description: 'Bebida tradicional de maíz morado.',
    price: 4.50,
    category: 'bebidas',
    available: true
  },
  {
    id: 'm6',
    name: 'Pisco Sour',
    description: 'Cóctel emblemático a base de pisco.',
    price: 9.00,
    category: 'bebidas',
    available: true
  },
  {
    id: 'm7',
    name: 'Suspiro a la Limeña',
    description: 'Dulce tradicional con manjar blanco y merengue.',
    price: 6.50,
    category: 'postres',
    available: true
  }
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  number: i + 1,
  status: 'available',
  capacity: i < 4 ? 2 : i < 10 ? 4 : 6,
}));
