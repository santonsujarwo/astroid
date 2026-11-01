CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','publishing','published','failed')),
  template_id TEXT NOT NULL DEFAULT 'business-starter',
  template_version TEXT NOT NULL DEFAULT '1.0.0',
  github_owner TEXT,
  github_repo TEXT,
  github_url TEXT,
  published_commit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL DEFAULT '/',
  title TEXT NOT NULL DEFAULT 'Home',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  document JSONB NOT NULL DEFAULT '{"version":1,"sections":[]}'::jsonb,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, slug)
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  package_path TEXT NOT NULL,
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id, version)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pages_site_idx ON pages(site_id);
CREATE INDEX IF NOT EXISTS activity_site_idx ON activity_log(site_id, created_at DESC);

INSERT INTO templates (id,name,version,package_path,manifest)
VALUES ('business-starter','Business Starter','1.0.0','templates/business-starter','{"sections":["hero","about","services","features","testimonials","faq","cta","contact"]}'::jsonb)
ON CONFLICT (id,version) DO NOTHING;