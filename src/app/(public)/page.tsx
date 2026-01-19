import Link from 'next/link'
import { getSuggestions, getTags } from '@/lib/actions/suggestions'
import { getUserVotes } from '@/lib/actions/votes'
import { SuggestionList } from '@/components/suggestions/suggestion-list'
import { SearchBar } from '@/components/suggestions/search-bar'
import { TagFilter } from '@/components/suggestions/tag-filter'
import { Pagination } from '@/components/ui/pagination'
import { t } from '@/lib/i18n'

interface PageProps {
  searchParams: Promise<{ filter?: string; sort?: string; error?: string; error_code?: string; error_description?: string; search?: string; tag?: string; page?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams
  const filter = params.filter as 'all' | 'open' | 'done' | undefined
  const sort = params.sort as 'votes' | 'newest' | undefined
  const error = params.error
  const errorCode = params.error_code
  const errorDescription = params.error_description
  const search = params.search
  const tagId = params.tag
  const page = parseInt(params.page || '1', 10)

  const tr = t()
  const [suggestionsData, tags] = await Promise.all([
    getSuggestions({
      status: filter || 'all',
      sortBy: sort || 'votes',
      search,
      tagId,
      page,
      limit: 10,
    }),
    getTags(),
  ])

  const { items: suggestions, totalPages, totalItems } = suggestionsData

  const votedIds = suggestions.length > 0
    ? await getUserVotes(suggestions.map(s => s.id))
    : new Set<string>()

  return (
    <div className="max-w-4xl mx-auto">
      {(error || errorCode) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error === 'auth_required' && tr.errors.authRequired}
          {error === 'admin_required' && tr.errors.adminRequired}
          {error === 'signin_failed' && tr.errors.signInFailed}
          {error === 'auth_callback_error' && tr.errors.generic}
          {errorCode === 'otp_expired' && tr.errors.otpExpired}
          {error === 'access_denied' && !errorCode && tr.errors.accessDenied}
          {error === 'access_denied' && errorCode === 'otp_expired' && tr.errors.otpExpired}
          {!error && !errorCode && errorDescription && decodeURIComponent(errorDescription)}
        </div>
      )}

      <div className="mb-6 pt-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
          {tr.home.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {tr.home.subtitle}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <SearchBar initialValue={search} />
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="inline-flex p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <Link
                href={`/?${new URLSearchParams({ ...(search && { search }), ...(tagId && { tag: tagId }), filter: 'all' }).toString()}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  !filter || filter === 'all' 
                    ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tr.home.filterAll}
              </Link>
              <Link
                href={`/?${new URLSearchParams({ ...(search && { search }), ...(tagId && { tag: tagId }), filter: 'open' }).toString()}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'open' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tr.home.filterOpen}
              </Link>
              <Link
                href={`/?${new URLSearchParams({ ...(search && { search }), ...(tagId && { tag: tagId }), filter: 'done' }).toString()}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'done' 
                    ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tr.home.filterDone}
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>{tr.home.sortBy}</span>
              <div className="flex gap-1">
                <Link
                  href={`/?${new URLSearchParams({ ...(search && { search }), ...(tagId && { tag: tagId }), filter: filter || 'all', sort: 'votes' }).toString()}`}
                  className={`px-2 py-1 rounded-lg transition-all text-xs font-medium ${
                    !sort || sort === 'votes' 
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tr.home.topVoted}
                </Link>
                <Link
                  href={`/?${new URLSearchParams({ ...(search && { search }), ...(tagId && { tag: tagId }), filter: filter || 'all', sort: 'newest' }).toString()}`}
                  className={`px-2 py-1 rounded-lg transition-all text-xs font-medium ${
                    sort === 'newest' 
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tr.home.newest}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {tags.length > 0 && (
          <TagFilter tags={tags} selectedTagId={tagId} currentParams={params} />
        )}
      </div>

      <SuggestionList
        suggestions={suggestions}
        votedIds={votedIds}
      />

      {totalItems > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          {totalItems} suggestion{totalItems > 1 ? 's' : ''} au total
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/"
        searchParams={{
          filter: filter,
          sort: sort,
          search: search,
          tag: tagId,
        }}
      />
    </div>
  )
}
