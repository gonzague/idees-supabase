-- Add vote_count column to suggestions table for efficient sorting
ALTER TABLE public.suggestions 
ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient sorting by votes
CREATE INDEX IF NOT EXISTS idx_suggestions_vote_count ON public.suggestions(vote_count DESC);

-- Create index for combined sorting (vote_count + created_at for tiebreaker)
CREATE INDEX IF NOT EXISTS idx_suggestions_vote_count_created 
ON public.suggestions(vote_count DESC, created_at DESC);

-- Function to update vote_count when votes change
CREATE OR REPLACE FUNCTION public.update_suggestion_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.suggestions 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.suggestion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.suggestions 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.suggestion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vote inserts
DROP TRIGGER IF EXISTS trigger_vote_insert ON public.votes;
CREATE TRIGGER trigger_vote_insert
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suggestion_vote_count();

-- Create trigger for vote deletes
DROP TRIGGER IF EXISTS trigger_vote_delete ON public.votes;
CREATE TRIGGER trigger_vote_delete
  AFTER DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suggestion_vote_count();

-- Backfill existing vote counts
UPDATE public.suggestions s
SET vote_count = (
  SELECT COUNT(*) 
  FROM public.votes v 
  WHERE v.suggestion_id = s.id
);
