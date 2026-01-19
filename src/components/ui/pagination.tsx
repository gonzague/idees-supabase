import Link from 'next/link'
import { Button } from './button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  searchParams?: Record<string, string | undefined>
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value)
      }
    })
    if (page > 1) {
      params.set('page', String(page))
    }
    const query = params.toString()
    return query ? `${baseUrl}?${query}` : baseUrl
  }

  const pages: (number | 'ellipsis')[] = []
  
  pages.push(1)
  
  if (currentPage > 3) {
    pages.push('ellipsis')
  }
  
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }
  
  if (currentPage < totalPages - 2) {
    pages.push('ellipsis')
  }
  
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages)
  }

  return (
    <nav className="flex items-center justify-center gap-2 sm:gap-1 mt-8" aria-label="Pagination">
      <Link
        href={createPageUrl(currentPage - 1)}
        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
        aria-disabled={currentPage <= 1}
      >
        <Button variant="outline" size="sm" disabled={currentPage <= 1}>
          ← Précédent
        </Button>
      </Link>

      <span className="sm:hidden text-sm text-gray-500 dark:text-gray-400 mx-2">
        {currentPage} / {totalPages}
      </span>
      <div className="hidden sm:flex items-center gap-1 mx-2">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400 dark:text-gray-500">
                ...
              </span>
            )
          }

          const isActive = page === currentPage

          return (
            <Link key={page} href={createPageUrl(page)}>
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={`min-w-[36px] ${isActive ? '' : 'text-gray-600 dark:text-gray-400'}`}
              >
                {page}
              </Button>
            </Link>
          )
        })}
      </div>

      <Link
        href={createPageUrl(currentPage + 1)}
        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
        aria-disabled={currentPage >= totalPages}
      >
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
          Suivant →
        </Button>
      </Link>
    </nav>
  )
}
