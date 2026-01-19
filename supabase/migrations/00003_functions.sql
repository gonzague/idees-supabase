-- Idees Supabase Migration: Helper Functions

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get vote count for a suggestion
CREATE OR REPLACE FUNCTION public.get_vote_count(p_suggestion_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.votes 
    WHERE suggestion_id = p_suggestion_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if voter has voted for a suggestion
CREATE OR REPLACE FUNCTION public.has_voted(p_voter_id TEXT, p_suggestion_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.votes 
    WHERE voter_id = p_voter_id AND suggestion_id = p_suggestion_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get follower count for a suggestion
CREATE OR REPLACE FUNCTION public.get_follower_count(p_suggestion_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.suggestion_follows 
    WHERE suggestion_id = p_suggestion_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get comment count for a suggestion
CREATE OR REPLACE FUNCTION public.get_comment_count(p_suggestion_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.comments 
    WHERE suggestion_id = p_suggestion_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
