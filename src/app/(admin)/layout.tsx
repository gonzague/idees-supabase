import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getProfile } from '@/lib/actions/auth'
import { SITE_NAME } from '@/lib/constants'
import { AuthButton } from '@/components/auth/auth-button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  if (!profile?.is_admin) {
    redirect('/?error=admin_required')
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-gray-900 text-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">{SITE_NAME}</span>
            </Link>
            <span className="text-sm bg-yellow-500 text-black px-2 py-0.5 rounded">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-300 hover:text-white">
              View Site
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  )
}
