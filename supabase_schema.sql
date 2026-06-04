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

-- Désactiver le RLS pour l'instant (accès complet via l'API)
ALTER TABLE public.equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items DISABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.promo_codes DISABLE ROW LEVEL SECURITY;
