-- =============================================================================
-- Idees Supabase Migration: Initial Schema
-- =============================================================================
-- This migration creates all tables for the Idees application.
-- Run this in the Supabase SQL Editor.
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTION: Update timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PROFILES TABLE (extends auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT CHECK (char_length(username) <= 50),
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  is_banned BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- TAGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  slug TEXT NOT NULL UNIQUE CHECK (char_length(slug) <= 50),
  icon TEXT CHECK (char_length(icon) <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);

-- =============================================================================
-- SUGGESTIONS TABLE
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE suggestion_status AS ENUM ('open', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  description TEXT CHECK (char_length(description) <= 2000),
  status suggestion_status NOT NULL DEFAULT 'open',
  done_at TIMESTAMPTZ,
  done_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  thumbnail_path TEXT,
  icon TEXT CHECK (char_length(icon) <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suggestions_user ON public.suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_created ON public.suggestions(created_at DESC);

DROP TRIGGER IF EXISTS suggestions_updated_at ON public.suggestions;
CREATE TRIGGER suggestions_updated_at
  BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- SUGGESTION_TAGS (many-to-many junction table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.suggestion_tags (
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (suggestion_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_suggestion_tags_suggestion ON public.suggestion_tags(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_tags_tag ON public.suggestion_tags(tag_id);

-- =============================================================================
-- VOTES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(voter_id, suggestion_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_suggestion ON public.votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON public.votes(voter_id);

-- =============================================================================
-- SUGGESTION_LINKS TABLE
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE link_platform AS ENUM ('youtube', 'twitter', 'blog', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.suggestion_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  platform link_platform NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suggestion_links_suggestion ON public.suggestion_links(suggestion_id);

-- =============================================================================
-- COMMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_suggestion ON public.comments(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);

DROP TRIGGER IF EXISTS comments_updated_at ON public.comments;
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- SUGGESTION_FOLLOWS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.suggestion_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, suggestion_id)
);

CREATE INDEX IF NOT EXISTS idx_suggestion_follows_suggestion ON public.suggestion_follows(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_follows_user ON public.suggestion_follows(user_id);
