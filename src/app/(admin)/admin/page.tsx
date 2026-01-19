import Link from 'next/link'
import type { Metadata } from 'next'
import { getSuggestions, getTags } from '@/lib/actions/suggestions'
import { getAdminStats, getUsers, getAllComments } from '@/lib/actions/admin'
import { AdminStats } from '@/components/admin/admin-stats'
import { AdminSuggestionRow } from '@/components/admin/admin-suggestion-row'
import { AdminUserRow } from '@/components/admin/admin-user-row'
import { AdminTagManager } from '@/components/admin/admin-tag-manager'
import { AdminCommentRow } from '@/components/admin/admin-comment-row'
import { t } from '@/lib/i18n'
import type { Tag } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Administration',
  robots: {
    index: false,
    follow: false,
  },
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = params.tab || 'suggestions'
  const tr = t()

  const [stats, suggestionsData, users, tags, comments] = await Promise.all([
    getAdminStats(),
    getSuggestions({ sortBy: 'newest', limit: 100 }),
    getUsers(),
    getTags(),
    getAllComments(),
  ])

  const suggestions = suggestionsData.items

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tr.admin.title}</h1>
      
      <AdminStats stats={stats} />

      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <Link
            href="/admin?tab=suggestions"
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'suggestions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tr.admin.suggestions} ({stats.totalSuggestions})
          </Link>
          <Link
            href="/admin?tab=users"
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tr.admin.users} ({stats.totalUsers})
          </Link>
          <Link
            href="/admin?tab=tags"
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'tags'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Tags ({tags.length})
          </Link>
          <Link
            href="/admin?tab=comments"
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'comments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Commentaires ({comments.length})
          </Link>
        </nav>
      </div>

      {tab === 'suggestions' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{tr.admin.table.votes}</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{tr.admin.table.suggestion}</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{tr.admin.table.status}</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{tr.admin.table.created}</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{tr.admin.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suggestions.map((suggestion) => (
                  <AdminSuggestionRow key={suggestion.id} suggestion={suggestion} tags={tags} />
                ))}
              </tbody>
            </table>
          </div>

          {suggestions.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              Aucune suggestion
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tr.admin.table.author}</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tr.admin.table.email}</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tr.admin.table.created}</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tr.admin.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {users.map((user) => (
                  <AdminUserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              Aucun utilisateur
            </div>
          )}
        </div>
      )}

      {tab === 'tags' && (
        <AdminTagManager tags={tags} />
      )}

      {tab === 'comments' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Auteur</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Suggestion</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contenu</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comments.map((comment) => (
                  <AdminCommentRow key={comment.id} comment={comment} />
                ))}
              </tbody>
            </table>
          </div>

          {comments.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              Aucun commentaire
            </div>
          )}
        </div>
      )}
    </div>
  )
}
