const requiredEnvVars = ['NEXT_PUBLIC_POCKETBASE_URL'] as const

type EnvVar = (typeof requiredEnvVars)[number]

function getEnvVar(name: EnvVar): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function validateEnv(): void {
  const missing: string[] = []
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '))
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}

export const env = {
  POCKETBASE_URL: process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
}

validateEnv()
