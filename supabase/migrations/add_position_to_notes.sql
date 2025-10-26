-- Add position column to notes table for drag and drop ordering
-- Run this in Supabase SQL Editor if you already have the notes table

-- Add position column
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS notes_position_idx ON public.notes(user_id, position);

-- Set initial positions based on created_at (oldest = 0, newest = n)
WITH numbered_notes AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS new_position
  FROM public.notes
)
UPDATE public.notes
SET position = numbered_notes.new_position
FROM numbered_notes
WHERE notes.id = numbered_notes.id;

