-- Idees Supabase Migration: Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_follows ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile or admins" ON public.profiles;
CREATE POLICY "Users can update own profile or admins" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- TAGS POLICIES
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON public.tags;
CREATE POLICY "Tags are viewable by everyone" ON public.tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can insert tags" ON public.tags;
CREATE POLICY "Only admins can insert tags" ON public.tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Only admins can update tags" ON public.tags;
CREATE POLICY "Only admins can update tags" ON public.tags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Only admins can delete tags" ON public.tags;
CREATE POLICY "Only admins can delete tags" ON public.tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- SUGGESTIONS POLICIES
DROP POLICY IF EXISTS "Suggestions are viewable by everyone" ON public.suggestions;
CREATE POLICY "Suggestions are viewable by everyone" ON public.suggestions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create suggestions" ON public.suggestions;
CREATE POLICY "Authenticated users can create suggestions" ON public.suggestions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own suggestions or admins" ON public.suggestions;
CREATE POLICY "Users can update own suggestions or admins" ON public.suggestions
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Users can delete own suggestions or admins" ON public.suggestions;
CREATE POLICY "Users can delete own suggestions or admins" ON public.suggestions
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- SUGGESTION_TAGS POLICIES
DROP POLICY IF EXISTS "Suggestion tags viewable by everyone" ON public.suggestion_tags;
CREATE POLICY "Suggestion tags viewable by everyone" ON public.suggestion_tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own suggestion tags" ON public.suggestion_tags;
CREATE POLICY "Users can manage own suggestion tags" ON public.suggestion_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suggestions s 
      WHERE s.id = suggestion_id 
      AND (s.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
      ))
    )
  );

DROP POLICY IF EXISTS "Users can delete own suggestion tags" ON public.suggestion_tags;
CREATE POLICY "Users can delete own suggestion tags" ON public.suggestion_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.suggestions s 
      WHERE s.id = suggestion_id 
      AND (s.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
      ))
    )
  );

-- VOTES POLICIES (allow anonymous voting)
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;
CREATE POLICY "Votes are viewable by everyone" ON public.votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can vote" ON public.votes;
CREATE POLICY "Anyone can vote" ON public.votes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can remove votes" ON public.votes;
CREATE POLICY "Anyone can remove votes" ON public.votes
  FOR DELETE USING (true);

-- SUGGESTION_LINKS POLICIES
DROP POLICY IF EXISTS "Suggestion links viewable by everyone" ON public.suggestion_links;
CREATE POLICY "Suggestion links viewable by everyone" ON public.suggestion_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can insert links" ON public.suggestion_links;
CREATE POLICY "Only admins can insert links" ON public.suggestion_links
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Only admins can update links" ON public.suggestion_links;
CREATE POLICY "Only admins can update links" ON public.suggestion_links
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Only admins can delete links" ON public.suggestion_links;
CREATE POLICY "Only admins can delete links" ON public.suggestion_links
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- COMMENTS POLICIES
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments or admins" ON public.comments;
CREATE POLICY "Users can delete own comments or admins" ON public.comments
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- SUGGESTION_FOLLOWS POLICIES
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.suggestion_follows;
CREATE POLICY "Follows are viewable by everyone" ON public.suggestion_follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow" ON public.suggestion_follows;
CREATE POLICY "Authenticated users can follow" ON public.suggestion_follows
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unfollow own follows" ON public.suggestion_follows;
CREATE POLICY "Users can unfollow own follows" ON public.suggestion_follows
  FOR DELETE USING (auth.uid() = user_id);
