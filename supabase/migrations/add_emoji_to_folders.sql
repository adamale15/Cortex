-- ========================================
-- MIGRATION: Add Emoji Support to Folders
-- ========================================
-- Run this in Supabase SQL Editor if you already have the folders table

-- Add emoji column to folders table
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Migration complete!

