-- SQL REVISADO Y COMPLETO PARA RESTAURANTE PRO
-- Copia y pega todo este código en el SQL Editor de Supabase y dale a 'Run'

-- 1. Crear TABLAS si no existen
CREATE TABLE IF NOT EXISTS public.menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id TEXT NOT NULL,
    waiter_id TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tables (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'available',
    total_activations INTEGER DEFAULT 0,
    assigned_waiter_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Asegurar COLUMNAS específicas por si las tablas ya existían
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tables' AND column_name='assigned_waiter_id') THEN
        ALTER TABLE public.tables ADD COLUMN assigned_waiter_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tables' AND column_name='total_activations') THEN
        ALTER TABLE public.tables ADD COLUMN total_activations INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Configurar REALTIME de forma segura (ignora si ya existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Añadir tablas a la publicación de forma individual para evitar errores de duplicado
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['menu', 'orders', 'tables', 'employees', 'categories'])
    LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ya existe en la publicación, ignoramos
        END;
    END LOOP;
END $$;

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 5. Crear POLÍTICAS (permite todo para desarrollo/demo)
DROP POLICY IF EXISTS "Allow all for menu" ON public.menu;
CREATE POLICY "Allow all for menu" ON public.menu FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for orders" ON public.orders;
CREATE POLICY "Allow all for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for tables" ON public.tables;
CREATE POLICY "Allow all for tables" ON public.tables FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for employees" ON public.employees;
CREATE POLICY "Allow all for employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for categories" ON public.categories;
CREATE POLICY "Allow all for categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
