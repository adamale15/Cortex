-- Add a starred flag to notes to support starring specific files
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false;

-- Optional: create an index to quickly filter/order by starred
CREATE INDEX IF NOT EXISTS notes_starred_idx ON public.notes (user_id, starred);

