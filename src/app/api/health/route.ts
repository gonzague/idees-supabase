import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  let supabaseStatus = 'unknown'
  
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    supabaseStatus = error ? 'unhealthy' : 'healthy'
  } catch {
    supabaseStatus = 'unreachable'
  }

  const healthy = supabaseStatus === 'healthy'

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        app: 'healthy',
        supabase: supabaseStatus,
      },
    },
    { status: healthy ? 200 : 503 }
  )
}
