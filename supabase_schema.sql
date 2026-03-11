-- =============================================
-- VILENA — Схема БД (вставить в Supabase SQL Editor)
-- =============================================

drop table if exists public.booking_services cascade;
drop table if exists public.reviews cascade;
drop table if exists public.bookings cascade;
drop table if exists public.clients cascade;
drop table if exists public.schedule_blocks cascade;
drop table if exists public.schedules cascade;
drop table if exists public.working_shifts cascade;
drop table if exists public.services cascade;
drop table if exists public.masters cascade;

-- 2. Таблица мастеров (профили)
create table public.masters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slug text unique, -- красивый URL, например url.com/booking/vilena
  name text not null,
  specialty text,
  city text,
  address text,
  phone text,
  social_links jsonb default '{"whatsapp": "", "telegram": ""}'::jsonb, -- любые мессенджеры
  avatar_url text,
  cover_url text,
  telegram_chat_id text, -- для уведомлений мастеру при новой записи
  rating numeric(3,2) default 5.00,
  review_count integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SERVICES
create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  master_id        uuid references public.masters(id) on delete cascade,
  name             text not null,
  duration_minutes int not null,
  price            int not null,
  price_from       boolean default false,
  category         text,
  sort_order       int default 0,
  is_active        boolean default true
);

-- WORKING_SHIFTS (рабочие смены мастера на определенные дни)
create table if not exists public.working_shifts (
  id          uuid primary key default gen_random_uuid(),
  master_id   uuid references public.masters(id) on delete cascade,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  is_active   boolean default true
);

-- 4. Таблица клиентов (CRM)
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  phone text unique not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Таблица записей
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  master_id uuid references public.masters(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null, -- привязка к CRM
  client_name text, -- денормализация для простоты или fallback
  client_phone text, -- денормализация
  date date not null,
  start_time time not null,
  end_time time not null,
  total_minutes integer not null,
  total_price integer not null,
  status text check (status in ('upcoming', 'completed', 'cancelled', 'no_show')) default 'upcoming' not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BOOKING_SERVICES (услуги в записи)
create table if not exists public.booking_services (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid references public.bookings(id) on delete cascade,
  service_id       uuid references public.services(id) on delete set null,
  name             text not null,
  price            int not null,
  duration_minutes int not null
);

-- REVIEWS
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  master_id   uuid references public.masters(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete set null,
  booking_id  uuid references public.bookings(id) on delete set null,
  author_name text,
  rating      smallint not null check (rating between 1 and 5),
  text        text,
  created_at  timestamptz default now()
);

-- =============================================
-- ФУНКЦИЯ: get_available_slots
-- Возвращает доступные 30-минутные слоты на дату
-- с учётом суммарной длительности сессии клиента
-- =============================================
create or replace function public.get_available_slots(
  p_master_id      uuid,
  p_date           date,
  p_session_minutes int
)
returns table(slot_time time)
language plpgsql
security definer
as $$
declare
  v_shift       record;
  v_slot        time;
  v_slot_end    time;
  v_blocked     boolean;
begin
  -- Перебираем все рабочие смены мастера на выбранную дату
  for v_shift in 
    select start_time, end_time 
    from public.working_shifts 
    where master_id = p_master_id 
      and date = p_date
      and is_active = true
    order by start_time
  loop
    v_slot := v_shift.start_time;

    while v_slot < v_shift.end_time loop
      v_slot_end := v_slot + (p_session_minutes || ' minutes')::interval;

      -- Если сессия вылезает за пределы текущей смены, переходим к следующей смене
      if v_slot_end > v_shift.end_time then
        exit; -- прерывает while, переходит к следующей итерации for
      end if;

      -- Проверяем пересечение с уже существующими записями
      v_blocked := exists (
        select 1 from public.bookings b
        where  b.master_id = p_master_id
          and  b.date = p_date
          and  b.status != 'cancelled'
          and  b.start_time < v_slot_end
          and  b.end_time   > v_slot
      );

      if not v_blocked then
        slot_time := v_slot;
        return next;
      end if;

      v_slot := v_slot + interval '30 minutes';
    end loop;
  end loop;
end;
$$;

-- =============================================
-- RLS ПОЛИТИКИ
-- =============================================

alter table public.masters enable row level security;
create policy "masters_public_read"  on public.masters for select using (true);
create policy "masters_owner_write"  on public.masters for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.services enable row level security;
create policy "services_public_read" on public.services for select using (true);
create policy "services_owner_write" on public.services for all
  using (exists (select 1 from public.masters m where m.id = master_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.masters m where m.id = master_id and m.user_id = auth.uid()));

alter table public.working_shifts enable row level security;
create policy "shifts_public_read" on public.working_shifts for select using (true);
create policy "shifts_owner_write" on public.working_shifts for all
  using (exists (select 1 from public.masters m where m.id = master_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.masters m where m.id = master_id and m.user_id = auth.uid()));

alter table public.clients enable row level security;
-- Политики для клиентов
create policy "clients_public_read" on public.clients for select using (true);
create policy "clients_public_insert" on public.clients for insert with check (true);
create policy "clients_public_update" on public.clients for update using (true);

alter table public.bookings enable row level security;
create policy "bookings_master_read" on public.bookings for select
  using (
    exists (select 1 from public.masters m where m.id = master_id and m.user_id = auth.uid())
    or client_id = (select id from public.clients c where c.user_id = auth.uid() limit 1)
  );
create policy "bookings_insert_any"    on public.bookings for insert with check (true);
create policy "bookings_master_update" on public.bookings for update
  using (exists (select 1 from public.masters m where m.id = master_id and m.user_id = auth.uid()));

alter table public.booking_services enable row level security;
create policy "booking_services_read"   on public.booking_services for select using (true);
create policy "booking_services_insert" on public.booking_services for insert with check (true);

alter table public.reviews enable row level security;
create policy "reviews_public_read"   on public.reviews for select using (true);
create policy "reviews_client_write"  on public.reviews for insert with check (true);

-- =============================================
-- SEED: Вилена (демо-данные для разработки)
-- =============================================
do $$
declare
  v_master_id uuid;
begin
-- Вставка демо-мастера (Вилена)
insert into public.masters (slug, name, specialty, city, address, phone, social_links, rating, review_count, avatar_url, cover_url)
values (
  'vilena-nails',
  'Вилена',
  'Мастер ногтевого сервиса',
  'г. Сочи',
  'ул. Навагинская, 9Д',
  '+7 (999) 123-45-67',
  '{"whatsapp": "79991234567", "telegram": "vilena_nails"}'::jsonb,
  5.0,
  127,
  'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=200&h=200',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800&h=400'
)
returning id into v_master_id;

  -- Услуги
  insert into public.services (master_id, name, duration_minutes, price, price_from, category, sort_order) values
    (v_master_id, 'Стрижка',                          80,  1500, true,  'Стрижки',  1),
    (v_master_id, 'Челка',                            15,  500,  false, 'Стрижки',  2),
    (v_master_id, 'Уход волос',                       75,  2000, false, 'Уход',     3),
    (v_master_id, 'Женская стрижка ( До плеч )',       60,  1000, false, 'Стрижки',  4),
    (v_master_id, 'Женская стрижка ( по плечи )',      60,  1200, false, 'Стрижки',  5),
    (v_master_id, 'Женская стрижка ( до лопаток )',    60,  1500, true,  'Стрижки',  6),
    (v_master_id, 'Женская стрижка ( до талии )',      70,  1800, true,  'Стрижки',  7),
    (v_master_id, 'Укладка ( короткий волос)',         40,  1000, true,  'Укладка',  8),
    (v_master_id, 'Укладка ( средняя длина )',         50,  1500, true,  'Укладка',  9),
    (v_master_id, 'Укладка ( длинный волос )',         60,  1800, true,  'Укладка',  10),
    (v_master_id, 'Прическа ( на любой длины )',       60,  3000, true,  'Прически', 11);

  -- Рабочие смены: пример на ближайшие несколько дней
  insert into public.working_shifts (master_id, date, start_time, end_time) values
    (v_master_id, current_date, '10:00', '19:00'),
    (v_master_id, current_date + interval '1 day', '10:00', '14:00'),
    (v_master_id, current_date + interval '1 day', '15:00', '19:00'), -- две смены с перерывом
    (v_master_id, current_date + interval '2 days', '09:00', '16:00'),
    (v_master_id, current_date + interval '3 days', '10:00', '19:00'),
    (v_master_id, current_date + interval '5 days', '12:00', '21:00');
end;
$$;
