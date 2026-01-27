-- =============================================================================
-- Idees Supabase Migration: Remove username/avatar_url from profiles
-- =============================================================================
-- These fields are now stored in auth.users.raw_user_meta_data instead.
-- Run this AFTER deploying the code changes that read from user_metadata.
-- =============================================================================

DROP INDEX IF EXISTS public.idx_profiles_username;

ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS username,
  DROP COLUMN IF EXISTS avatar_url;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
