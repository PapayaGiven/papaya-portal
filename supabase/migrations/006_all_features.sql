-- Migration: 006_all_features.sql
-- Updates levels from 5 to 4 (Initiation, Rising, Pro, Elite)
-- Adds all new tables for features

-- ── Update existing creators with old level names ──
UPDATE creators SET level = 'Rising' WHERE level = 'Foundation';
UPDATE creators SET level = 'Pro' WHERE level = 'Growth';
UPDATE creators SET level = 'Pro' WHERE level = 'Scale';

-- ── Add booking_link to creators ──
ALTER TABLE creators ADD COLUMN IF NOT EXISTS booking_link text;

-- ── Add video_focus and quick_checklist to strategy_products ──
ALTER TABLE strategy_products ADD COLUMN IF NOT EXISTS video_focus text;
ALTER TABLE strategy_products ADD COLUMN IF NOT EXISTS quick_checklist text[] DEFAULT '{}';

-- ── Add contact_info to product_requests ──
ALTER TABLE product_requests ADD COLUMN IF NOT EXISTS contact_info text;

-- ── Add personal_goal_notes to creators (if not exists) ──
ALTER TABLE creators ADD COLUMN IF NOT EXISTS personal_goal_notes text;

-- ── Site Settings table ──
CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY DEFAULT 'default',
  calls_per_month_initiation integer DEFAULT 0,
  calls_per_month_rising integer DEFAULT 0,
  calls_per_month_pro integer DEFAULT 2,
  calls_per_month_elite integer DEFAULT 4,
  booking_link_pro text,
  booking_link_elite text DEFAULT 'https://calendar.app.google/bW5ZsKF9wbDrLVF6A',
  created_at timestamptz DEFAULT now()
);

-- Insert default settings row
INSERT INTO site_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- ── Announcements table ──
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  display_type text NOT NULL DEFAULT 'banner' CHECK (display_type IN ('banner', 'popup')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── Levels table ──
CREATE TABLE IF NOT EXISTS levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  emoji text NOT NULL DEFAULT '🌱',
  min_gmv integer NOT NULL DEFAULT 0,
  max_gmv integer,
  color text NOT NULL DEFAULT '#9CA3AF',
  includes text[] DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── Rewards table ──
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '🎁',
  cta_type text CHECK (cta_type IN ('claim', 'link', 'whatsapp', 'form')),
  cta_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── Creator Rewards (junction) table ──
CREATE TABLE IF NOT EXISTS creator_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'received')),
  claimed_at timestamptz,
  address_data jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(creator_id, reward_id)
);

-- ── Violations table ──
CREATE TABLE IF NOT EXISTS violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  description text NOT NULL,
  screenshot_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved')),
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

-- ── Storage buckets (run these via Supabase dashboard or API) ──
-- product-images
-- campaign-assets
-- strategy-briefs
-- violation-screenshots

-- ── RLS policies ──
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY IF NOT EXISTS "Anyone can read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can read levels" ON levels FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can read rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can read settings" ON site_settings FOR SELECT USING (true);

-- Creator rewards - users can read their own
CREATE POLICY IF NOT EXISTS "Users can read own creator_rewards" ON creator_rewards FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Users can insert own creator_rewards" ON creator_rewards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Users can update own creator_rewards" ON creator_rewards FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Violations - users can insert their own
CREATE POLICY IF NOT EXISTS "Users can read own violations" ON violations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Users can insert violations" ON violations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
