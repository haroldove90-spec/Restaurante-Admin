-- SQL for Restaurante Pro - Update
-- Execute this in your Supabase SQL Editor

-- 1. Add activation counter to tables
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS total_activations INTEGER DEFAULT 0;

-- 2. Fix RLS for categories (ALLOW ALL FOR DEMO/DEVELOPMENT)
-- If RLS is enabled, we need policies to allow inserting/deleting
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for categories" ON public.categories;
CREATE POLICY "Allow all for categories" ON public.categories 
FOR ALL USING (true) WITH CHECK (true);

-- Also ensure RLS for other tables if needed
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for tables" ON public.tables;
CREATE POLICY "Allow all for tables" ON public.tables FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for menu_items" ON public.menu_items;
CREATE POLICY "Allow all for menu_items" ON public.menu_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for orders" ON public.orders;
CREATE POLICY "Allow all for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 3. Add waiter assignment to tables
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS assigned_waiter_id TEXT;
