-- ========================================
-- DEBUG: Check if users and profiles exist
-- ========================================
-- Run this in Supabase SQL Editor to debug

-- 1. Check auth.users table
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check profiles table
SELECT * FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 4. Check if function exists
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- ========================================
-- FIX: Manually create missing profiles
-- ========================================
-- If users exist but profiles don't, run this:

INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'avatar_url', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- ========================================
-- RECREATE trigger if needed
-- ========================================
-- Drop and recreate the trigger

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

