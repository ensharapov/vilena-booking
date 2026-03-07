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

-- MASTERS
create table if not exists public.masters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  name         text not null,
  specialty    text,
  city         text,
  address      text,
  phone        text,
  whatsapp     text,
  telegram     text,
  avatar_url   text,
  cover_url    text,
  rating       numeric(3,2) default 0,
  review_count int default 0,
  is_active    boolean default true,
  created_at   timestamptz default now()
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

-- CLIENTS
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  name       text,
  phone      text,
  avatar_url text,
  created_at timestamptz default now()
);

-- BOOKINGS
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  master_id     uuid references public.masters(id) on delete cascade,
  client_id     uuid references public.clients(id) on delete set null,
  client_name   text,
  client_phone  text,
  date          date not null,
  start_time    time not null,
  end_time      time not null,
  total_minutes int not null,
  total_price   int not null,
  status        text not null default 'upcoming'
                check (status in ('upcoming','completed','cancelled','no_show')),
  notes         text,
  created_at    timestamptz default now()
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
create policy "clients_own_data" on public.clients for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
  insert into public.masters (name, specialty, city, address, phone, whatsapp, telegram, rating, review_count)
  values ('Вилена', 'Мастер-парикмахер', 'Сочи', 'Краснодонская, 6/1', '+7 (999) 000-00-00', '79990000000', 'vilena_master', 0, 0)
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
