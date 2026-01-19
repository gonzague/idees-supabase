import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  )
}
