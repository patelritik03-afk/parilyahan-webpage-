-- Run this once in your Supabase project's SQL Editor (Database > SQL Editor > New query).
-- All access from the app goes through the service role key on the server, so RLS is enabled
-- with no public policies: the anon/public key gets no access to these tables at all.

create table if not exists daily_menu (
  date date primary key,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  date date not null,
  time text not null,
  party_size int not null,
  notes text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  storage_path text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 5-star reviews the owner features by hand (in addition to those pulled from Google automatically).
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  review_text text not null,
  when_text text,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enquiries from the website's Enquiries page (event, marketing collab, partnership, other).
create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  type text not null,
  specify text,
  event_type text,
  pax int,
  event_date date,
  message text,
  created_at timestamptz not null default now()
);

alter table enquiries enable row level security;
alter table reviews enable row level security;
alter table daily_menu enable row level security;
alter table reservations enable row level security;
alter table gallery_images enable row level security;

-- Admin settings (the dashboard stores a changed admin password hash here).
create table if not exists admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table admin_settings enable row level security;

-- TikTok videos shown on the Videos page and the home page (added by pasting links in the dashboard).
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  video_id text not null unique,
  url text not null,
  title text,
  author text,
  created_at timestamptz not null default now()
);

alter table videos enable row level security;
-- Offers and pricing shown on the home page (managed from the dashboard's Offers tab).
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric(10,2) not null check (price >= 0),
  note text,
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table offers enable row level security;
-- Storage bucket for gallery + menu item photos, served publicly by URL.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;
