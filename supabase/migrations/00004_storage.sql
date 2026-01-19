-- Idees Supabase Migration: Storage Buckets and Policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- AVATARS BUCKET POLICIES
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- THUMBNAILS BUCKET POLICIES (admin only for upload)
DROP POLICY IF EXISTS "Thumbnails are publicly accessible" ON storage.objects;
CREATE POLICY "Thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "Admins can upload thumbnails" ON storage.objects;
CREATE POLICY "Admins can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Admins can update thumbnails" ON storage.objects;
CREATE POLICY "Admins can update thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'thumbnails' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Admins can delete thumbnails" ON storage.objects;
CREATE POLICY "Admins can delete thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
