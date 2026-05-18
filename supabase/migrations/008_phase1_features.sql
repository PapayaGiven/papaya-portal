-- Germany Phase 1 features port.
--
-- Idempotent — safe to re-run. Brings Germany's schema up to parity with
-- USA's "Phase 1 + Papaya Picks" baseline. Run this in Germany Supabase
-- before deploying the matching code.

-- 1. creators — phone, access code, onboarding flag, personal goal notes
alter table creators add column if not exists phone_number text;
alter table creators add column if not exists access_code text;
alter table creators add column if not exists has_completed_onboarding boolean default false;
alter table creators add column if not exists personal_goal_notes text;

-- access_code: enforce uniqueness lazily so a partial deploy doesn't fail
-- if rows already exist with the column. The CREATE UNIQUE INDEX below is
-- skipped when the constraint already exists.
do $$
begin
  if not exists (select 1 from pg_indexes where indexname = 'creators_access_code_key') then
    create unique index creators_access_code_key on creators(access_code) where access_code is not null;
  end if;
end$$;

-- 2. strategy_products — frequency, week, external product
alter table strategy_products add column if not exists frequency_type text default 'day';
alter table strategy_products add column if not exists week integer default 1;
alter table strategy_products add column if not exists is_external boolean default false;
alter table strategy_products add column if not exists external_product_name text;
alter table strategy_products add column if not exists external_brand text;
alter table strategy_products add column if not exists external_commission numeric;
alter table strategy_products add column if not exists external_link text;
create index if not exists idx_strategy_products_week on strategy_products(strategy_id, week);

-- 3. strategy_videos — example video notes
alter table strategy_videos add column if not exists notes text;

-- 4. campaigns — goal fields
alter table campaigns add column if not exists gmv_target numeric;
alter table campaigns add column if not exists videos_required integer;
alter table campaigns add column if not exists live_hours_required numeric;

-- 5. settings — agency GMV goal
alter table settings add column if not exists agency_gmv_goal numeric default 0;
alter table settings add column if not exists agency_gmv_goal_month date;

-- 6. products — extra display + sample fields (USA parity)
alter table products add column if not exists units_sold integer;
alter table products add column if not exists star_rating numeric(2,1);
alter table products add column if not exists review_count integer;
alter table products add column if not exists showcase_link text;
alter table products add column if not exists sample_link text;

-- 7. creator_monthly_stats — Wachstum data
create table if not exists creator_monthly_stats (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references creators(id) on delete cascade,
  month date not null,
  gmv numeric default 0,
  gmv_projection numeric default 0,
  commission_rate numeric default 0,
  videos_posted integer default 0,
  live_hours numeric default 0,
  commissions_earned numeric default 0,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(creator_id, month)
);
alter table creator_monthly_stats enable row level security;
drop policy if exists "creators_read_own_stats" on creator_monthly_stats;
create policy "creators_read_own_stats" on creator_monthly_stats
  for select using (
    creator_id in (select id from creators where lower(email) = lower(auth.email()))
  );

-- 8. creator_videos — tracker + Spark Ads
create table if not exists creator_videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references creators(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  tiktok_url text not null,
  converted boolean default false,
  gmv_generated numeric default 0,
  spark_code text,
  video_notes text,
  external_product_name text,
  month date default date_trunc('month', current_date),
  notes text,
  created_at timestamp default now()
);
alter table creator_videos enable row level security;
drop policy if exists "creators_read_own_videos" on creator_videos;
create policy "creators_read_own_videos" on creator_videos
  for select using (
    creator_id in (select id from creators where lower(email) = lower(auth.email()))
  );

-- 9. call_notes — admin-only
create table if not exists call_notes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references creators(id) on delete cascade,
  note text not null,
  call_date date default current_date,
  created_at timestamp default now()
);
alter table call_notes enable row level security;
drop policy if exists "call_notes_admin_only" on call_notes;
create policy "call_notes_admin_only" on call_notes for select using (false);

-- 10. creator_notifications — inbox banner
create table if not exists creator_notifications (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references creators(id) on delete cascade,
  title text not null,
  message text,
  type text default 'info',
  is_read boolean default false,
  created_at timestamp default now()
);
alter table creator_notifications enable row level security;
drop policy if exists "creators_own_notifications" on creator_notifications;
create policy "creators_own_notifications" on creator_notifications
  for all using (
    creator_id in (select id from creators where lower(email) = lower(auth.email()))
  );

-- 11. papaya_picks — score is GENERATED so admin only edits inputs
create table if not exists papaya_picks (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  brand_name text,
  niche text,
  commission_rate numeric,
  product_link text,
  sample_link text,
  product_image_url text,
  units_sold_this_week integer default 0,
  growth_percentage numeric default 0,
  affiliates_count integer default 0,
  videos_count integer default 0,
  papaya_pick_score numeric generated always as (
    (units_sold_this_week::numeric / 10 * 0.3)
    + (growth_percentage * 0.3)
    + ((100 - LEAST(affiliates_count, 100)) * 0.2)
    + ((100 - LEAST(videos_count, 100)) * 0.2)
  ) stored,
  why_its_a_pick text,
  example_video_url text,
  -- Germany levels: Initiation / Rising / Pro / Elite
  min_level text default 'Rising',
  is_active boolean default true,
  expires_at timestamp,
  created_at timestamp default now()
);
alter table papaya_picks enable row level security;
drop policy if exists "picks_read_active" on papaya_picks;
create policy "picks_read_active" on papaya_picks
  for select to authenticated using (is_active = true and (expires_at is null or expires_at > now()));

-- 12. initiation_template — global template admin can clone onto creators
create table if not exists initiation_template (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  external_product_name text,
  priority text default 'Hero',
  videos_per_day numeric,
  frequency_type text default 'day',
  live_hours_per_week numeric,
  gmv_target numeric,
  strategy_note text,
  hashtags text[],
  video_focus text,
  quick_checklist text[],
  order_index integer default 0,
  updated_at timestamp default now()
);

-- 13. deliverables — creators can read + update their own rows
drop policy if exists "creators_read_own_deliverables" on deliverables;
drop policy if exists "creators_update_own_deliverables" on deliverables;
create policy "creators_read_own_deliverables" on deliverables
  for select using (
    creator_id in (select id from creators where lower(email) = lower(auth.email()))
  );
create policy "creators_update_own_deliverables" on deliverables
  for update using (
    creator_id in (select id from creators where lower(email) = lower(auth.email()))
  );

-- 14. Backfill access codes for any pre-existing creators that don't have one yet.
update creators
set access_code = upper(
  chr(65 + floor(random() * 26)::int) ||
  chr(65 + floor(random() * 26)::int) ||
  chr(65 + floor(random() * 26)::int) || '-' ||
  floor(random() * 9 + 1)::text ||
  floor(random() * 10)::text ||
  floor(random() * 10)::text || '-' ||
  chr(65 + floor(random() * 26)::int) ||
  chr(65 + floor(random() * 26)::int) ||
  chr(65 + floor(random() * 26)::int)
)
where access_code is null;

-- 15. Normalize emails to lowercase so the RLS lower(email) = lower(auth.email())
--     comparisons land for all existing rows.
update creators set email = lower(email) where email != lower(email);
