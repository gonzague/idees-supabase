import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const title = searchParams.get('title') || 'Idées'
  const votes = searchParams.get('votes') || '0'
  const author = searchParams.get('author') || ''
  const status = searchParams.get('status') || 'open'
  
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #9333ea 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -50,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        
        {/* Content card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 24,
            padding: '48px 64px',
            maxWidth: 1000,
            margin: '0 48px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Status badge */}
          {status === 'done' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#22c55e',
                color: 'white',
                padding: '8px 20px',
                borderRadius: 20,
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 24,
              }}
            >
              ✓ Terminé
            </div>
          )}
          
          {/* Vote count */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #6366f1, #9333ea)',
                color: 'white',
                width: 80,
                height: 80,
                borderRadius: 16,
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              {votes}
            </div>
            <span style={{ color: '#64748b', fontSize: 24 }}>votes</span>
          </div>
          
          {/* Title */}
          <div
            style={{
              fontSize: title.length > 60 ? 36 : 48,
              fontWeight: 700,
              color: '#1e293b',
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: 800,
            }}
          >
            {title}
          </div>
          
          {/* Author */}
          {author && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: 24,
                color: '#64748b',
                fontSize: 24,
              }}
            >
              par @{author}
            </div>
          )}
        </div>
        
        {/* Footer branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            💡
          </div>
          <span style={{ color: 'white', fontSize: 28, fontWeight: 600 }}>
            Idées
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
