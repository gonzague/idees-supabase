/**
 * PocketBase to Supabase Data Migration Script
 * 
 * Prerequisites:
 * 1. Set up environment variables in .env.local or export them:
 *    - POCKETBASE_URL: URL of your PocketBase instance (e.g., http://127.0.0.1:8090)
 *    - POCKETBASE_ADMIN_EMAIL: PocketBase admin email
 *    - POCKETBASE_ADMIN_PASSWORD: PocketBase admin password
 *    - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 *    - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (for admin operations)
 * 
 * 2. Run PocketBase locally with your existing data
 * 
 * 3. Run this script:
 *    npx tsx scripts/migrate-data.ts
 * 
 * The script will:
 * - Migrate users (create Supabase Auth users + profiles)
 * - Migrate tags
 * - Migrate suggestions (with tag relationships)
 * - Migrate votes
 * - Migrate comments
 * - Migrate suggestion_follows
 * - Migrate suggestion_links
 */

import { createClient } from '@supabase/supabase-js'
import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!POCKETBASE_ADMIN_EMAIL || !POCKETBASE_ADMIN_PASSWORD) {
  console.error('Missing PocketBase admin credentials: POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD')
  process.exit(1)
}

const pb = new PocketBase(POCKETBASE_URL)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function authenticatePocketBase() {
  console.log('Authenticating with PocketBase as admin...')
  await pb.admins.authWithPassword(POCKETBASE_ADMIN_EMAIL!, POCKETBASE_ADMIN_PASSWORD!)
  console.log('PocketBase authentication successful')
}

const userIdMap = new Map<string, string>()
const tagIdMap = new Map<string, string>()
const suggestionIdMap = new Map<string, string>()

async function migrateUsers() {
  console.log('\n=== Migrating Users ===')
  
  const users = await pb.collection('users').getFullList()
  console.log(`Found ${users.length} users to migrate`)
  
  for (const user of users) {
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: user.verified || true,
        password: 'TEMP_PASSWORD_' + Math.random().toString(36).slice(2),
        user_metadata: { username: user.username }
      })
      
      if (authError) {
        if (authError.message.includes('already been registered')) {
          const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()
          const existingUser = existingUsers?.find(u => u.email === user.email)
          if (existingUser) {
            userIdMap.set(user.id, existingUser.id)
            console.log(`  User already exists: ${user.email} -> ${existingUser.id}`)
            continue
          }
        }
        console.error(`  Failed to create auth user ${user.email}:`, authError.message)
        continue
      }
      
      if (authUser?.user) {
        userIdMap.set(user.id, authUser.user.id)
        
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authUser.user.id,
          username: user.username,
          avatar_url: user.avatar ? `${POCKETBASE_URL}/api/files/${user.collectionId}/${user.id}/${user.avatar}` : null,
          is_admin: user.is_admin || false,
          is_banned: user.is_banned || false,
          created_at: user.created,
          updated_at: user.updated,
        })
        
        if (profileError) {
          console.error(`  Failed to create profile for ${user.email}:`, profileError.message)
        } else {
          console.log(`  Migrated: ${user.email} -> ${authUser.user.id}`)
        }
      }
    } catch (err) {
      console.error(`  Error migrating user ${user.email}:`, err)
    }
  }
  
  console.log(`Users migration complete. Mapped ${userIdMap.size} users.`)
}

async function migrateTags() {
  console.log('\n=== Migrating Tags ===')
  
  const tags = await pb.collection('tags').getFullList()
  console.log(`Found ${tags.length} tags to migrate`)
  
  for (const tag of tags) {
    try {
      const { data, error } = await supabase.from('tags').insert({
        name: tag.name,
        slug: tag.slug,
        icon: tag.icon || null,
        created_at: tag.created,
        updated_at: tag.updated,
      }).select('id').single()
      
      if (error) {
        console.error(`  Failed to create tag ${tag.name}:`, error.message)
        continue
      }
      
      if (data) {
        tagIdMap.set(tag.id, data.id)
        console.log(`  Migrated: ${tag.name} -> ${data.id}`)
      }
    } catch (err) {
      console.error(`  Error migrating tag ${tag.name}:`, err)
    }
  }
  
  console.log(`Tags migration complete. Mapped ${tagIdMap.size} tags.`)
}

async function migrateSuggestions() {
  console.log('\n=== Migrating Suggestions ===')
  
  const suggestions = await pb.collection('suggestions').getFullList()
  console.log(`Found ${suggestions.length} suggestions to migrate`)
  
  for (const suggestion of suggestions) {
    try {
      const newUserId = userIdMap.get(suggestion.user)
      const newDoneById = suggestion.done_by ? userIdMap.get(suggestion.done_by) : null
      
      if (!newUserId) {
        console.warn(`  Skipping suggestion "${suggestion.title}" - user not found`)
        continue
      }
      
      const { data, error } = await supabase.from('suggestions').insert({
        user_id: newUserId,
        title: suggestion.title,
        description: suggestion.description || '',
        status: suggestion.status || 'open',
        icon: suggestion.icon || null,
        done_at: suggestion.done_at || null,
        done_by: newDoneById,
        created_at: suggestion.created,
        updated_at: suggestion.updated,
      }).select('id').single()
      
      if (error) {
        console.error(`  Failed to create suggestion "${suggestion.title}":`, error.message)
        continue
      }
      
      if (data) {
        suggestionIdMap.set(suggestion.id, data.id)
        
        if (suggestion.tags && suggestion.tags.length > 0) {
          const tagInserts = suggestion.tags
            .map((oldTagId: string) => {
              const newTagId = tagIdMap.get(oldTagId)
              return newTagId ? { suggestion_id: data.id, tag_id: newTagId } : null
            })
            .filter(Boolean)
          
          if (tagInserts.length > 0) {
            await supabase.from('suggestion_tags').insert(tagInserts)
          }
        }
        
        console.log(`  Migrated: "${suggestion.title}" -> ${data.id}`)
      }
    } catch (err) {
      console.error(`  Error migrating suggestion "${suggestion.title}":`, err)
    }
  }
  
  console.log(`Suggestions migration complete. Mapped ${suggestionIdMap.size} suggestions.`)
}

async function migrateVotes() {
  console.log('\n=== Migrating Votes ===')
  
  const votes = await pb.collection('votes').getFullList()
  console.log(`Found ${votes.length} votes to migrate`)
  
  let migrated = 0
  for (const vote of votes) {
    try {
      const newSuggestionId = suggestionIdMap.get(vote.suggestion)
      const newUserId = vote.user ? userIdMap.get(vote.user) : null
      
      if (!newSuggestionId) {
        continue
      }
      
      const { error } = await supabase.from('votes').insert({
        suggestion_id: newSuggestionId,
        user_id: newUserId,
        voter_id: vote.voter_id || newUserId || `anon_${vote.id}`,
        created_at: vote.created,
      })
      
      if (!error) migrated++
    } catch (err) {
      // Ignore duplicate votes
    }
  }
  
  console.log(`Votes migration complete. Migrated ${migrated} votes.`)
}

async function migrateComments() {
  console.log('\n=== Migrating Comments ===')
  
  const comments = await pb.collection('comments').getFullList()
  console.log(`Found ${comments.length} comments to migrate`)
  
  let migrated = 0
  for (const comment of comments) {
    try {
      const newSuggestionId = suggestionIdMap.get(comment.suggestion)
      const newUserId = userIdMap.get(comment.user)
      
      if (!newSuggestionId || !newUserId) {
        continue
      }
      
      const { error } = await supabase.from('comments').insert({
        suggestion_id: newSuggestionId,
        user_id: newUserId,
        content: comment.content,
        created_at: comment.created,
        updated_at: comment.updated,
      })
      
      if (!error) migrated++
    } catch (err) {
      // Ignore errors
    }
  }
  
  console.log(`Comments migration complete. Migrated ${migrated} comments.`)
}

async function migrateFollows() {
  console.log('\n=== Migrating Suggestion Follows ===')
  
  const follows = await pb.collection('suggestion_follows').getFullList()
  console.log(`Found ${follows.length} follows to migrate`)
  
  let migrated = 0
  for (const follow of follows) {
    try {
      const newSuggestionId = suggestionIdMap.get(follow.suggestion)
      const newUserId = userIdMap.get(follow.user)
      
      if (!newSuggestionId || !newUserId) {
        continue
      }
      
      const { error } = await supabase.from('suggestion_follows').insert({
        suggestion_id: newSuggestionId,
        user_id: newUserId,
        created_at: follow.created,
      })
      
      if (!error) migrated++
    } catch (err) {
      // Ignore errors
    }
  }
  
  console.log(`Follows migration complete. Migrated ${migrated} follows.`)
}

async function migrateLinks() {
  console.log('\n=== Migrating Suggestion Links ===')
  
  const links = await pb.collection('suggestion_links').getFullList()
  console.log(`Found ${links.length} links to migrate`)
  
  let migrated = 0
  for (const link of links) {
    try {
      const newSuggestionId = suggestionIdMap.get(link.suggestion)
      const newCreatedById = link.created_by ? userIdMap.get(link.created_by) : null
      
      if (!newSuggestionId) {
        continue
      }
      
      const { error } = await supabase.from('suggestion_links').insert({
        suggestion_id: newSuggestionId,
        platform: link.platform || 'other',
        url: link.url,
        thumbnail_url: link.thumbnail_url || null,
        title: link.title || null,
        created_by: newCreatedById,
        created_at: link.created,
      })
      
      if (!error) migrated++
    } catch (err) {
      // Ignore errors
    }
  }
  
  console.log(`Links migration complete. Migrated ${migrated} links.`)
}

async function main() {
  console.log('Starting PocketBase to Supabase migration...')
  console.log(`PocketBase URL: ${POCKETBASE_URL}`)
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  
  try {
    await authenticatePocketBase()
    await migrateUsers()
    await migrateTags()
    await migrateSuggestions()
    await migrateVotes()
    await migrateComments()
    await migrateFollows()
    await migrateLinks()
    
    console.log('\n=== Migration Complete ===')
    console.log(`Users: ${userIdMap.size}`)
    console.log(`Tags: ${tagIdMap.size}`)
    console.log(`Suggestions: ${suggestionIdMap.size}`)
    
    console.log('\n⚠️  IMPORTANT: Users were created with temporary passwords.')
    console.log('Send password reset emails to users so they can set their own passwords.')
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()
