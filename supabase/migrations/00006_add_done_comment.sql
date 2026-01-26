-- Add done_comment column for author's note when marking suggestion as done
ALTER TABLE public.suggestions 
ADD COLUMN IF NOT EXISTS done_comment TEXT CHECK (char_length(done_comment) <= 2000);

COMMENT ON COLUMN public.suggestions.done_comment IS 'Optional note from admin when marking suggestion as completed';
