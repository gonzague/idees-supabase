export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          email: string | null
          is_admin: boolean
          is_banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          email?: string | null
          is_admin?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          email?: string | null
          is_admin?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string | null
          created_at?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: 'open' | 'done'
          done_at: string | null
          done_by: string | null
          done_comment: string | null
          thumbnail_path: string | null
          icon: string | null
          created_at: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: 'open' | 'done'
          done_at?: string | null
          done_by?: string | null
          done_comment?: string | null
          thumbnail_path?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: 'open' | 'done'
          done_at?: string | null
          done_by?: string | null
          done_comment?: string | null
          thumbnail_path?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      suggestion_tags: {
        Row: {
          suggestion_id: string
          tag_id: string
        }
        Insert: {
          suggestion_id: string
          tag_id: string
        }
        Update: {
          suggestion_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_tags_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          id: string
          user_id: string | null
          suggestion_id: string
          voter_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          suggestion_id: string
          voter_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          suggestion_id?: string
          voter_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          }
        ]
      }
      suggestion_links: {
        Row: {
          id: string
          suggestion_id: string
          platform: 'youtube' | 'twitter' | 'blog' | 'other'
          url: string
          thumbnail_url: string | null
          title: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          suggestion_id: string
          platform: 'youtube' | 'twitter' | 'blog' | 'other'
          url: string
          thumbnail_url?: string | null
          title?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          suggestion_id?: string
          platform?: 'youtube' | 'twitter' | 'blog' | 'other'
          url?: string
          thumbnail_url?: string | null
          title?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_links_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          user_id: string
          suggestion_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          suggestion_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          suggestion_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          }
        ]
      }
      suggestion_follows: {
        Row: {
          id: string
          user_id: string
          suggestion_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          suggestion_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          suggestion_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_follows_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_vote_count: {
        Args: {
          p_suggestion_id: string
        }
        Returns: number
      }
      has_voted: {
        Args: {
          p_voter_id: string
          p_suggestion_id: string
        }
        Returns: boolean
      }
      get_follower_count: {
        Args: {
          p_suggestion_id: string
        }
        Returns: number
      }
      get_comment_count: {
        Args: {
          p_suggestion_id: string
        }
        Returns: number
      }
    }
    Enums: {
      suggestion_status: 'open' | 'done'
      link_platform: 'youtube' | 'twitter' | 'blog' | 'other'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
