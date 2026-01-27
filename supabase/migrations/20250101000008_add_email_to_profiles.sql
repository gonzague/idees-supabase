-- Add email column to profiles table
-- This avoids expensive auth.admin.listUsers() calls by storing email directly

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Create a function to sync email from auth.users on profile creation/update
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users
  SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON public.profiles;
CREATE TRIGGER sync_profile_email_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

-- Backfill existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
