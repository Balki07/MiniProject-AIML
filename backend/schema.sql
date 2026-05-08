-- ============================================================
--  Advertisement Express — PostgreSQL Schema
--  Run this on your Supabase SQL editor (Database → SQL Editor)
-- ============================================================

-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  password_hash   TEXT,
  role            VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_verified     BOOLEAN     DEFAULT FALSE,        -- admin can manually verify
  trust_level     INT         DEFAULT 50 CHECK (trust_level BETWEEN 0 AND 100),
  ad_count        INT         DEFAULT 0,
  approved_count  INT         DEFAULT 0,
  email_verified  BOOLEAN     DEFAULT FALSE,
  email_verification_token VARCHAR(6),
  email_verification_expires TIMESTAMPTZ,
  google_id       VARCHAR(255) UNIQUE,
  company         VARCHAR(255),
  address         TEXT,
  bio             TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ADVERTISEMENTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advertisements (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        REFERENCES users(id) ON DELETE CASCADE,
  title                VARCHAR(200) NOT NULL,
  description          TEXT        NOT NULL,
  category             VARCHAR(50) CHECK (category IN
                          ('Jobs', 'Services', 'Business', 'Events', 'Real Estate', 'Other')),
  location             VARCHAR(100),
  image_url            VARCHAR(500),

  -- Trust & Verification
  status               VARCHAR(20) DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected','flagged','removed')),
  trust_score          INT         DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  auto_processed       BOOLEAN     DEFAULT FALSE,
  admin_message        TEXT,
  rejection_reason     TEXT,

  -- Revenue / Featured
  is_featured          BOOLEAN     DEFAULT FALSE,
  featured_until       TIMESTAMPTZ,

  -- Analytics
  impressions          INT         DEFAULT 0,
  clicks               INT         DEFAULT 0,
  report_count         INT         DEFAULT 0,

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REPORTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       UUID        REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  reason      VARCHAR(100) NOT NULL,
  details     TEXT,
  status      VARCHAR(20) DEFAULT 'open'
                CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AD EVENTS (impressions + clicks) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       UUID        REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  ip_address  VARCHAR(50),
  event_type  VARCHAR(15) CHECK (event_type IN ('impression', 'click')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DEPARTMENT PAGE LAYOUTS (Admin Drag & Drop Builder) ──────────────────
CREATE TABLE IF NOT EXISTS departments (
  slug        VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS department_layouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_slug  VARCHAR(50) REFERENCES departments(slug) ON DELETE CASCADE,
  status           VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published')),
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (department_slug, status)
);

CREATE TABLE IF NOT EXISTS department_layout_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id     UUID REFERENCES department_layouts(id) ON DELETE CASCADE,
  ad_id         UUID REFERENCES advertisements(id) ON DELETE CASCADE,
  x             INT NOT NULL DEFAULT 0,
  y             INT NOT NULL DEFAULT 0,
  width         INT NOT NULL DEFAULT 260,
  height        INT NOT NULL DEFAULT 180,
  z_index       INT NOT NULL DEFAULT 1,
  is_visible    BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ads_status      ON advertisements(status);
CREATE INDEX IF NOT EXISTS idx_ads_trust       ON advertisements(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_ads_user        ON advertisements(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_featured    ON advertisements(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_reports_ad      ON reports(ad_id);
CREATE INDEX IF NOT EXISTS idx_events_ad       ON ad_events(ad_id);
CREATE INDEX IF NOT EXISTS idx_layout_items_layout ON department_layout_items(layout_id);
CREATE INDEX IF NOT EXISTS idx_layout_items_ad     ON department_layout_items(ad_id);

-- ─── SEED: Default Admin Account ─────────────────────────────────────────────
-- Password: Admin@123456 (bcrypt hash — change in production!)
INSERT INTO users (name, email, password_hash, role, is_verified, trust_level)
VALUES (
  'Platform Admin',
  'admin@adexpress.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@123456
  'admin',
  TRUE,
  100
) ON CONFLICT (email) DO NOTHING;

-- ─── SEED: Department Pages ─────────────────────────────────────────────────
INSERT INTO departments (slug, name) VALUES
  ('dashboard', 'Dashboard'),
  ('food', 'Food'),
  ('tech', 'Tech'),
  ('jobs', 'Jobs'),
  ('services', 'Services'),
  ('business', 'Business'),
  ('events', 'Events'),
  ('real-estate', 'Real Estate'),
  ('other', 'Other')
ON CONFLICT (slug) DO NOTHING;
