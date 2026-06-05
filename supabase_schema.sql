-- Schéma de base de données pour Rental SaaS

CREATE TABLE public.equipment (
  id UUID PRIMARY KEY,
  reference TEXT,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.customers (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  shopify_transfer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.booking_items (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL, -- 'percentage' or 'amount'
  discount_value NUMERIC NOT NULL,
  target_email TEXT, -- if null, valid for everyone
  max_uses INTEGER, -- if null, unlimited
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer le RLS pour sécuriser la base de données
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture publique uniquement sur les équipements (pour le catalogue)
CREATE POLICY "Allow public read equipment" ON public.equipment FOR SELECT USING (true);

-- Autoriser la lecture publique sur les bookings et booking_items pour le calcul de disponibilité côté client
-- NOTE: Si possible, il est préférable de déplacer le calcul de disponibilité côté serveur pour ne pas avoir à exposer ces tables.
CREATE POLICY "Allow public read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow public read booking items" ON public.booking_items FOR SELECT USING (true);

-- Aucune politique publique pour customers et promo_codes, seul le serveur (via SUPABASE_SERVICE_ROLE_KEY) peut y accéder.
