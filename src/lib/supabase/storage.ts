const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

export function getStorageUrl(bucket: string, path: string): string {
  if (!path) return ''
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

export function getAvatarUrl(path: string | null | undefined): string {
  if (!path) return ''
  return getStorageUrl('avatars', path)
}

export function getThumbnailUrl(
  path: string | null | undefined,
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  if (!path) return ''
  const width = size === 'sm' ? 100 : size === 'lg' ? 400 : 200
  return `${SUPABASE_URL}/storage/v1/render/image/public/thumbnails/${path}?width=${width}&height=${width}&resize=cover`
}
