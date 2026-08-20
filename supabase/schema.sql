-- ===========================================================================
-- NIELLOR — database foundation
--
-- Run this once in Supabase → SQL Editor → New query → Run.
-- It is safe to re-run: everything uses IF NOT EXISTS / CREATE OR REPLACE.
--
-- Security model
--   products, coupons  → readable by everyone (the storefront needs them)
--   everything else    → readable and writable ONLY by the customer who owns
--                        the row, enforced by Row Level Security at the
--                        database level, not in the frontend.
--
-- Coupon codes are NOT publicly listable. validate_coupon() checks one code
-- at a time so the table cannot be scraped for unreleased offers.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES — one row per customer, created automatically on sign-up
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  marketing_opt_in boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are self-readable"  on public.profiles;
drop policy if exists "profiles are self-writable"  on public.profiles;
drop policy if exists "profiles are self-insertable" on public.profiles;

create policy "profiles are self-readable"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles are self-writable"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles are self-insertable"
  on public.profiles for insert with check (auth.uid() = id);

-- Create the profile row the moment an account is created, taking the name
-- from whatever the sign-up (or Google) supplied.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. PRODUCTS — public catalogue
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  short_name   text,
  category     text,
  audience     text,
  line         text,
  family       text,
  description  text,
  accords      text[] default '{}',
  tags         text[] default '{}',
  notes        jsonb,                       -- null until NIELLOR publishes notes
  image_url    text,
  gallery      jsonb default '[]',
  sizes        jsonb default '[]',          -- [{ "ml":30, "price":1499 }, ...]
  currency     text not null default 'INR',
  available    boolean not null default true,
  coming_soon  boolean not null default false,
  sort_order   int default 0,
  created_at   timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products are public" on public.products;
create policy "products are public"
  on public.products for select using (true);
-- No insert/update/delete policy: the catalogue is edited in the dashboard
-- or with the service key on a server, never from the browser.

-- ---------------------------------------------------------------------------
-- 3. ADDRESSES
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text,
  full_name   text,
  phone       text,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text,
  postal_code text,
  country     text not null default 'India',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses(user_id);
alter table public.addresses enable row level security;

drop policy if exists "addresses are private" on public.addresses;
create policy "addresses are private"
  on public.addresses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. CART — one row per product + size
-- ---------------------------------------------------------------------------
create table if not exists public.cart (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  size_ml    int  not null,
  qty        int  not null default 1 check (qty > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id, size_ml)
);

create index if not exists cart_user_idx on public.cart(user_id);
alter table public.cart enable row level security;

drop policy if exists "cart is private" on public.cart;
create policy "cart is private"
  on public.cart for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. WISHLIST
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists wishlist_user_idx on public.wishlist(user_id);
alter table public.wishlist enable row level security;

drop policy if exists "wishlist is private" on public.wishlist;
create policy "wishlist is private"
  on public.wishlist for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. COUPONS
-- Not publicly listable. Use validate_coupon() to check one code.
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  code             text primary key,
  description      text,
  percent_off      int check (percent_off between 1 and 100),
  amount_off       numeric(10,2),
  currency         text not null default 'INR',
  first_order_only boolean not null default false,
  active           boolean not null default true,
  starts_at        timestamptz,
  ends_at          timestamptz,
  max_redemptions  int,
  times_redeemed   int not null default 0,
  created_at       timestamptz not null default now()
);

alter table public.coupons enable row level security;
-- Deliberately no select policy: nobody can list codes from the browser.

create or replace function public.validate_coupon(p_code text)
returns table (code text, percent_off int, amount_off numeric, description text)
language sql
security definer set search_path = public
as $$
  select c.code, c.percent_off, c.amount_off, c.description
  from public.coupons c
  where upper(c.code) = upper(trim(p_code))
    and c.active
    and (c.starts_at is null or c.starts_at <= now())
    and (c.ends_at   is null or c.ends_at   >= now())
    and (c.max_redemptions is null or c.times_redeemed < c.max_redemptions);
$$;

grant execute on function public.validate_coupon(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. ORDERS
-- Created server-side once a payment provider is connected. There is no
-- insert policy for customers, so an order cannot be forged from the browser.
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  order_number  text unique,
  status        text not null default 'pending'
                check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  currency      text not null default 'INR',
  subtotal      numeric(10,2) not null default 0,
  discount      numeric(10,2) not null default 0,
  shipping      numeric(10,2) not null default 0,
  total         numeric(10,2) not null default 0,
  coupon_code   text references public.coupons(code),
  address_id    uuid references public.addresses(id),
  payment_ref   text,
  placed_at     timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
alter table public.orders enable row level security;

drop policy if exists "orders are self-readable" on public.orders;
create policy "orders are self-readable"
  on public.orders for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8. ORDER ITEMS — visible only through an order the customer owns
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,        -- snapshot, so history survives renames
  size_ml      int  not null,
  unit_price   numeric(10,2) not null,
  qty          int  not null check (qty > 0),
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items(order_id);
alter table public.order_items enable row level security;

drop policy if exists "order items follow their order" on public.order_items;
create policy "order items follow their order"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- 9. SEED — PLACEHOLDER CATALOGUE, NOT FINAL PRODUCT DATA
--    Roselle / Aéris / Valenor and the 1499/2399/4699 prices are working
--    values for build and testing. Replace them with the final NIELLOR
--    fragrances before launch, e.g.
--      update public.products set name = ..., description = ... where slug = ...;
--    or delete these rows and insert the real collection.
-- ---------------------------------------------------------------------------
insert into public.products
  (slug, name, short_name, category, audience, line, family, description, accords, tags, image_url, sizes, sort_order)
values
  ('roselle', 'NIELLOR Roselle', 'Roselle', 'For Women', 'Women', 'Pour Femme', 'Floral',
   'A delicate blend of floral and musky notes designed for the modern woman who embodies elegance and confidence.',
   '{floral,musk}', '{women,"pour femme",floral,elegant,feminine,"eau de parfum"}',
   'assets/img/women.webp',
   '[{"ml":30,"price":1499},{"ml":50,"price":2399},{"ml":100,"price":4699}]', 1),

  ('aeris', 'NIELLOR Aéris', 'Aéris', 'Unisex', 'Unisex', 'Unisex', 'Fresh',
   'A harmonious fusion of fresh, woody, and musk notes — crafted for those who appreciate sophistication beyond gender.',
   '{fresh,woody,musk}', '{unisex,fresh,refined,refreshing,woody,"eau de parfum"}',
   'assets/img/unisex.webp',
   '[{"ml":30,"price":1499},{"ml":50,"price":2399},{"ml":100,"price":4699}]', 2),

  ('valenor', 'NIELLOR Valenor', 'Valenor', 'For Men', 'Men', 'Pour Homme', 'Woody',
   'A powerful blend of spicy, woody, and amber notes, made for the man who leaves a lasting impression.',
   '{spicy,woody,amber}', '{men,"pour homme",woody,intense,sophisticated,amber,"eau de parfum"}',
   'assets/img/men.webp',
   '[{"ml":30,"price":1499},{"ml":50,"price":2399},{"ml":100,"price":4699}]', 3)
on conflict (slug) do nothing;

insert into public.coupons (code, description, percent_off, first_order_only, active)
values ('WELCOME10', '10% off your first order', 10, true, true)
on conflict (code) do nothing;

-- ===========================================================================
-- Done. Verify in Supabase → Table Editor that all eight tables exist and
-- each shows "RLS enabled".
-- ===========================================================================
