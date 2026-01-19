import type { Database } from './database'

type Tables = Database['public']['Tables']

export type Profile = Tables['profiles']['Row']
export type Tag = Tables['tags']['Row']
export type Suggestion = Tables['suggestions']['Row']
export type Vote = Tables['votes']['Row']
export type SuggestionLink = Tables['suggestion_links']['Row']
export type Comment = Tables['comments']['Row']
export type SuggestionFollow = Tables['suggestion_follows']['Row']

export interface User {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  is_admin: boolean
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface SuggestionWithVotes extends Suggestion {
  vote_count: number
  has_voted: boolean
  links?: SuggestionLink[]
  tags?: Tag[]
  author_username?: string | null
  author_avatar_url?: string | null
  author_id?: string
}

export interface CommentWithUser extends Comment {
  author_username?: string | null
  author_avatar_url?: string | null
  author_id?: string
}

export type SuggestionStatus = 'open' | 'done'
export type LinkPlatform = 'youtube' | 'twitter' | 'blog' | 'other'

export interface AdminStats {
  totalSuggestions: number
  openSuggestions: number
  doneSuggestions: number
  totalVotes: number
  totalUsers: number
}
