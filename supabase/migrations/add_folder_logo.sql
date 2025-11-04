-- Add folder logo_url column
ALTER TABLE public.folders
ADD COLUMN IF NOT EXISTS logo_url TEXT;


