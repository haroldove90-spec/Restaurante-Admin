-- SQL for Restaurante Pro
-- Execute this in your Supabase SQL Editor

-- 1. Table for Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns to Tables for Diners
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS current_diners INTEGER DEFAULT 0;

-- 3. Update Menu Items for dynamic categories
-- Ensure the category column is TEXT and not an ENUM if you want it dynamic
ALTER TABLE public.menu_items 
ALTER COLUMN category TYPE TEXT;

-- 4. Update Orders to track diners
-- The items column in 'orders' is usually JSONB by default. 
-- Ensure your 'orders' table can store the dinerNumber in the items array.

-- 5. Insert some initial categories if empty
INSERT INTO public.categories (id, name)
VALUES 
('c1', 'ENTRADAS'),
('c2', 'PLATOS PRINCIPALES'),
('c3', 'BEBIDAS'),
('c4', 'POSTRES')
ON CONFLICT (name) DO NOTHING;

-- 6. Enable Realtime for the new categories table
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
