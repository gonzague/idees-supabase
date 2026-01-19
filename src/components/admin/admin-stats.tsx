import { cn } from '@/lib/utils/cn'
import { t } from '@/lib/i18n'
import type { AdminStats as AdminStatsType } from '@/lib/types'

interface AdminStatsProps {
  stats: AdminStatsType
}

export function AdminStats({ stats }: AdminStatsProps) {
  const tr = t()
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard 
        label={tr.admin.stats.total} 
        value={stats.totalSuggestions} 
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      />
      <StatCard 
        label={tr.admin.stats.open} 
        value={stats.openSuggestions} 
        color="blue" 
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      <StatCard 
        label={tr.admin.stats.done} 
        value={stats.doneSuggestions} 
        color="green" 
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        }
      />
      <StatCard 
        label={tr.admin.stats.votes} 
        value={stats.totalVotes} 
        color="purple" 
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        }
      />
      <StatCard 
        label={tr.admin.stats.users} 
        value={stats.totalUsers} 
        color="orange" 
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  color = 'gray',
  icon
}: { 
  label: string
  value: number
  color?: 'gray' | 'blue' | 'green' | 'purple' | 'orange'
  icon?: React.ReactNode
}) {
  const colorStyles = {
    gray: 'bg-slate-50 text-slate-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-violet-50 text-violet-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3">
      {icon && (
        <div className={cn("p-2 rounded-lg", colorStyles[color])}>
          {icon}
        </div>
      )}
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )
}
