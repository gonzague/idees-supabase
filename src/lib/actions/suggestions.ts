'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerClient, getCurrentUser, getUsersMetadata } from '@/lib/supabase/server'
import { verifyTurnstileToken } from '@/lib/utils/turnstile'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { SUGGESTION_TITLE_MIN, SUGGESTION_TITLE_MAX, SUGGESTION_DESC_MAX } from '@/lib/constants'
import type { SuggestionWithVotes, SuggestionLink, Tag } from '@/lib/types'

export interface CreateSuggestionState {
  errors?: {
    title?: string[]
    description?: string[]
    tags?: string[]
    _form?: string[]
  }
  success?: boolean
}

async function getClientIP(): Promise<string> {
  const headersList = await headers()
  return headersList.get('cf-connecting-ip')
    || headersList.get('x-real-ip')
    || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || 'unknown'
}

export async function createSuggestion(
  _prevState: CreateSuggestionState,
  formData: FormData
): Promise<CreateSuggestionState> {
  const clientIP = await getClientIP()
  const rateLimit = checkRateLimit(`suggestion:${clientIP}`, { maxRequests: 5, windowMs: 300000 })
  if (!rateLimit.allowed) {
    return { errors: { _form: ['Trop de suggestions. Réessayez dans quelques minutes.'] } }
  }

  const turnstileToken = formData.get('turnstileToken') as string
  const isValidToken = await verifyTurnstileToken(turnstileToken)
  if (!isValidToken) {
    return { errors: { _form: ['Vérification anti-spam échouée. Veuillez réessayer.'] } }
  }

  const user = await getCurrentUser()
  if (!user) {
    return { errors: { _form: ['Vous devez être connecté pour proposer un sujet'] } }
  }

  if (user.is_banned) {
    return { errors: { _form: ['Votre compte a été suspendu'] } }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const tagIds = formData.getAll('tags') as string[]

  const errors: CreateSuggestionState['errors'] = {}

  if (!title || title.length < SUGGESTION_TITLE_MIN) {
    errors.title = [`Le titre doit contenir au moins ${SUGGESTION_TITLE_MIN} caractères`]
  } else if (title.length > SUGGESTION_TITLE_MAX) {
    errors.title = [`Le titre doit contenir moins de ${SUGGESTION_TITLE_MAX} caractères`]
  }

  if (description && description.length > SUGGESTION_DESC_MAX) {
    errors.description = [`La description doit contenir moins de ${SUGGESTION_DESC_MAX} caractères`]
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  let recordId: string

  try {
    const supabase = await createServerClient()
    
    const { data: suggestion, error: suggestionError } = await supabase
      .from('suggestions')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || '',
        status: 'open',
      })
      .select('id')
      .single()

    if (suggestionError || !suggestion) {
      console.error('Create suggestion error:', suggestionError)
      return { errors: { _form: ['Échec de la création. Veuillez réessayer.'] } }
    }

    recordId = suggestion.id

    if (tagIds.length > 0) {
      const tagInserts = tagIds.map(tagId => ({
        suggestion_id: recordId,
        tag_id: tagId,
      }))
      
      await supabase.from('suggestion_tags').insert(tagInserts)
    }
  } catch (error) {
    console.error('Create suggestion error:', error)
    return { errors: { _form: ['Échec de la création. Veuillez réessayer.'] } }
  }

  revalidatePath('/')
  redirect(`/suggestions/${recordId}`)
}

export async function updateSuggestion(
  id: string,
  data: { title?: string; description?: string; tags?: string[]; icon?: string }
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const supabase = await createServerClient()
    
    const { data: suggestion } = await supabase
      .from('suggestions')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (!suggestion) {
      return { success: false, error: 'Suggestion non trouvée' }
    }
    
    if (suggestion.user_id !== user.id && !user.is_admin) {
      return { success: false, error: 'Non autorisé' }
    }

    const updateData: { title?: string; description?: string; icon?: string } = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.icon !== undefined) updateData.icon = data.icon

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('suggestions')
        .update(updateData)
        .eq('id', id)
      
      if (error) throw error
    }

    if (data.tags !== undefined) {
      await supabase
        .from('suggestion_tags')
        .delete()
        .eq('suggestion_id', id)
      
      if (data.tags.length > 0) {
        const tagInserts = data.tags.map(tagId => ({
          suggestion_id: id,
          tag_id: tagId,
        }))
        await supabase.from('suggestion_tags').insert(tagInserts)
      }
    }

    revalidatePath('/')
    revalidatePath(`/suggestions/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Update suggestion error:', error)
    return { success: false, error: 'Échec de la mise à jour' }
  }
}

export async function deleteSuggestion(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const supabase = await createServerClient()
    
    const { data: suggestion } = await supabase
      .from('suggestions')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (!suggestion) {
      return { success: false, error: 'Suggestion non trouvée' }
    }
    
    if (suggestion.user_id !== user.id && !user.is_admin) {
      return { success: false, error: 'Non autorisé' }
    }

    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', id)
    
    if (error) throw error

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Delete suggestion error:', error)
    return { success: false, error: 'Échec de la suppression' }
  }
}

export interface GetSuggestionsOptions {
  status?: 'open' | 'done' | 'all'
  sortBy?: 'votes' | 'newest'
  limit?: number
  page?: number
  search?: string
  tagId?: string
}

export interface PaginatedSuggestions {
  items: SuggestionWithVotes[]
  page: number
  perPage: number
  totalItems: number
  totalPages: number
}

export async function getSuggestions(options?: GetSuggestionsOptions): Promise<PaginatedSuggestions> {
  const { status = 'all', sortBy = 'votes', limit = 10, page = 1, search, tagId } = options || {}

  try {
    const supabase = await createServerClient()
    const user = await getCurrentUser()

    let query = supabase
      .from('suggestions')
      .select('*', { count: 'exact' })
    
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (search && search.trim()) {
      const searchTerm = search.trim()
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }
    
    if (tagId) {
      const { data: suggestionIdsWithTag } = await supabase
        .from('suggestion_tags')
        .select('suggestion_id')
        .eq('tag_id', tagId)
      
      if (suggestionIdsWithTag && suggestionIdsWithTag.length > 0) {
        const ids = suggestionIdsWithTag.map(s => s.suggestion_id)
        query = query.in('id', ids)
      } else {
        return {
          items: [],
          page: 1,
          perPage: limit,
          totalItems: 0,
          totalPages: 0,
        }
      }
    }

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: suggestions, error, count } = await query

    if (error) {
      console.error('Get suggestions error:', error)
      throw error
    }

    if (!suggestions) {
      return {
        items: [],
        page: 1,
        perPage: limit,
        totalItems: 0,
        totalPages: 0,
      }
    }

    const suggestionIds = suggestions.map((s: { id: string }) => s.id)

    const voteCountMap = new Map<string, number>()
    const userVotes = new Set<string>()
    const linksMap = new Map<string, SuggestionLink[]>()

    if (suggestionIds.length > 0) {
      const { data: votes } = await supabase
        .from('votes')
        .select('suggestion_id, user_id, voter_id')
        .in('suggestion_id', suggestionIds)

      if (votes) {
        for (const vote of votes) {
          voteCountMap.set(vote.suggestion_id, (voteCountMap.get(vote.suggestion_id) || 0) + 1)
          if (user && (vote.user_id === user.id || vote.voter_id === user.id)) {
            userVotes.add(vote.suggestion_id)
          }
        }
      }

      const { data: links } = await supabase
        .from('suggestion_links')
        .select('*')
        .in('suggestion_id', suggestionIds)

      if (links) {
        for (const link of links) {
          const existing = linksMap.get(link.suggestion_id) || []
          existing.push(link)
          linksMap.set(link.suggestion_id, existing)
        }
      }
    }

    const tagsMap = new Map<string, Tag[]>()
    const userIds = suggestionIds.length > 0 ? [...new Set(suggestions.map(s => s.user_id))] : []
    const usersMetadata = await getUsersMetadata(userIds)
    
    if (suggestionIds.length > 0) {
      
      const { data: suggestionTags } = await supabase
        .from('suggestion_tags')
        .select('suggestion_id, tag_id')
        .in('suggestion_id', suggestionIds)
      
      if (suggestionTags && suggestionTags.length > 0) {
        const tagIds = [...new Set(suggestionTags.map(st => st.tag_id))]
        const { data: allTags } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds)
        
        const tagById = new Map<string, Tag>()
        if (allTags) {
          for (const tag of allTags) {
            tagById.set(tag.id, tag)
          }
        }
        
        for (const st of suggestionTags) {
          const tag = tagById.get(st.tag_id)
          if (tag) {
            const existing = tagsMap.get(st.suggestion_id) || []
            existing.push(tag)
            tagsMap.set(st.suggestion_id, existing)
          }
        }
      }
    }

    const items: SuggestionWithVotes[] = suggestions.map((s) => {
      const userMeta = usersMetadata.get(s.user_id)
      
      return {
        ...s,
        vote_count: voteCountMap.get(s.id) || 0,
        has_voted: userVotes.has(s.id),
        links: linksMap.get(s.id) || [],
        tags: tagsMap.get(s.id) || [],
        author_username: userMeta?.username,
        author_avatar_url: userMeta?.avatar_url,
        author_id: s.user_id,
      } as SuggestionWithVotes
    })

    if (sortBy === 'votes') {
      items.sort((a, b) => b.vote_count - a.vote_count)
    }

    const totalItems = count || 0
    const totalPages = Math.ceil(totalItems / limit)

    return {
      items,
      page,
      perPage: limit,
      totalItems,
      totalPages,
    }
  } catch (error) {
    console.error('Get suggestions error:', error)
    return {
      items: [],
      page: 1,
      perPage: limit,
      totalItems: 0,
      totalPages: 0,
    }
  }
}

export async function getSuggestion(id: string): Promise<SuggestionWithVotes | null> {
  try {
    const supabase = await createServerClient()
    const user = await getCurrentUser()

    const { data: suggestion, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !suggestion) {
      console.error('Get suggestion error:', error)
      return null
    }

    const usersMetadata = await getUsersMetadata([suggestion.user_id])
    const userMeta = usersMetadata.get(suggestion.user_id)

    const { data: suggestionTags } = await supabase
      .from('suggestion_tags')
      .select('tag_id')
      .eq('suggestion_id', id)

    let tags: Tag[] = []
    if (suggestionTags && suggestionTags.length > 0) {
      const tagIds = suggestionTags.map(st => st.tag_id)
      const { data: tagData } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds)
      tags = tagData || []
    }

    const { data: votes } = await supabase
      .from('votes')
      .select('user_id, voter_id')
      .eq('suggestion_id', id)

    const voteCount = votes?.length || 0
    const hasVoted = user 
      ? votes?.some((v) => v.user_id === user.id || v.voter_id === user.id) || false
      : false

    const { data: links } = await supabase
      .from('suggestion_links')
      .select('*')
      .eq('suggestion_id', id)

    return {
      ...suggestion,
      vote_count: voteCount,
      has_voted: hasVoted,
      links: links || [],
      tags,
      author_username: userMeta?.username,
      author_avatar_url: userMeta?.avatar_url,
      author_id: suggestion.user_id,
    } as SuggestionWithVotes
  } catch (error) {
    console.error('Get suggestion error:', error)
    return null
  }
}

export async function getTags(): Promise<Tag[]> {
  try {
    const supabase = await createServerClient()
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')
    
    if (error) throw error
    return tags || []
  } catch (error) {
    console.error('Get tags error:', error)
    return []
  }
}

export async function createTag(name: string, icon?: string): Promise<{ success: boolean; tag?: Tag; error?: string }> {
  const user = await getCurrentUser()
  if (!user?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  try {
    const supabase = await createServerClient()
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        name,
        slug,
        icon: icon || null,
      })
      .select()
      .single()

    if (error) throw error
    
    revalidatePath('/')
    return { success: true, tag }
  } catch (error) {
    console.error('Create tag error:', error)
    return { success: false, error: 'Échec de la création du tag' }
  }
}

export async function updateTagIcon(id: string, icon: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('tags')
      .update({ icon: icon || null })
      .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Update tag icon error:', error)
    return { success: false, error: 'Échec de la mise à jour' }
  }
}

export async function deleteTag(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Delete tag error:', error)
    return { success: false, error: 'Échec de la suppression' }
  }
}
