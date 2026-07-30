-- Supabase kurulumu.
-- Panelde: SQL Editor -> New query -> bu dosyanın tamamını yapıştır -> Run.
-- Tek seferlik. Tekrar çalıştırmak zarar vermez.

create table if not exists public.subscriptions (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  deleted    boolean not null default false
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

create table if not exists public.app_settings (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Satır bazlı güvenlik: herkes yalnızca kendi satırlarını görür ve yazar.
-- Bu olmadan publishable/anon anahtarı tüm tabloyu açar; o yüzden şart.
alter table public.subscriptions enable row level security;
alter table public.app_settings  enable row level security;

drop policy if exists "kendi abonelikleri" on public.subscriptions;
create policy "kendi abonelikleri" on public.subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kendi ayarlari" on public.app_settings;
create policy "kendi ayarlari" on public.app_settings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tablo seviyesi izinler. RLS "hangi satırlar" sorusunu cevaplar; bu ise
-- "tabloya hiç dokunabilir mi" sorusunu. İkisi de gerekli.
-- Satır güvenliğini yine RLS sağlıyor: giriş yapan yalnızca kendi satırlarını görür.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.app_settings  to authenticated;
