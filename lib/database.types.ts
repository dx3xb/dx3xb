export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admission_case_snapshots: {
        Row: {
          act: number | null
          activities_count: number | null
          admission_result: string
          al_profile: string | null
          ap_count: number | null
          application_round: string | null
          awards_count: number | null
          completeness_score: number | null
          country_region: string | null
          essays_count: number | null
          external_application_id: string
          gpa: number | null
          graduation_school_hash: string | null
          graduation_year: number | null
          has_application_file: boolean | null
          id: string
          ielts: number | null
          ingested_at: string
          is_enrolled: boolean | null
          major_category_broad: string | null
          major_category_narrow: string | null
          major_name: string | null
          major_name_chinese: string | null
          major_name_standard: string | null
          original_admission_result: string | null
          sanitized_payload: Json
          sat: number | null
          source: string
          source_created_at: string | null
          source_updated_at: string | null
          teacher_count: number | null
          toefl: number | null
          university_id: string | null
          university_name: string
          university_name_chinese: string | null
          university_name_standard: string | null
          university_rank_category: string | null
        }
        Insert: {
          act?: number | null
          activities_count?: number | null
          admission_result: string
          al_profile?: string | null
          ap_count?: number | null
          application_round?: string | null
          awards_count?: number | null
          completeness_score?: number | null
          country_region?: string | null
          essays_count?: number | null
          external_application_id: string
          gpa?: number | null
          graduation_school_hash?: string | null
          graduation_year?: number | null
          has_application_file?: boolean | null
          id?: string
          ielts?: number | null
          ingested_at?: string
          is_enrolled?: boolean | null
          major_category_broad?: string | null
          major_category_narrow?: string | null
          major_name?: string | null
          major_name_chinese?: string | null
          major_name_standard?: string | null
          original_admission_result?: string | null
          sanitized_payload?: Json
          sat?: number | null
          source?: string
          source_created_at?: string | null
          source_updated_at?: string | null
          teacher_count?: number | null
          toefl?: number | null
          university_id?: string | null
          university_name: string
          university_name_chinese?: string | null
          university_name_standard?: string | null
          university_rank_category?: string | null
        }
        Update: {
          act?: number | null
          activities_count?: number | null
          admission_result?: string
          al_profile?: string | null
          ap_count?: number | null
          application_round?: string | null
          awards_count?: number | null
          completeness_score?: number | null
          country_region?: string | null
          essays_count?: number | null
          external_application_id?: string
          gpa?: number | null
          graduation_school_hash?: string | null
          graduation_year?: number | null
          has_application_file?: boolean | null
          id?: string
          ielts?: number | null
          ingested_at?: string
          is_enrolled?: boolean | null
          major_category_broad?: string | null
          major_category_narrow?: string | null
          major_name?: string | null
          major_name_chinese?: string | null
          major_name_standard?: string | null
          original_admission_result?: string | null
          sanitized_payload?: Json
          sat?: number | null
          source?: string
          source_created_at?: string | null
          source_updated_at?: string | null
          teacher_count?: number | null
          toefl?: number | null
          university_id?: string | null
          university_name?: string
          university_name_chinese?: string | null
          university_name_standard?: string | null
          university_rank_category?: string | null
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          action: string
          created_at: string
          document_id: number | null
          error_message: string | null
          id: number
          input_length: number
          model: string | null
          output_length: number | null
          output_text: string | null
          success: boolean
        }
        Insert: {
          action: string
          created_at?: string
          document_id?: number | null
          error_message?: string | null
          id?: number
          input_length: number
          model?: string | null
          output_length?: number | null
          output_text?: string | null
          success?: boolean
        }
        Update: {
          action?: string
          created_at?: string
          document_id?: number | null
          error_message?: string | null
          id?: number
          input_length?: number
          model?: string | null
          output_length?: number | null
          output_text?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_requests_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      amc_achievements: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      amc_cloud_progress: {
        Row: {
          bookmarked: boolean | null
          correct: boolean
          created_at: string | null
          id: string
          problem_id: string
          selected: number
          time_spent: number | null
          user_id: string
        }
        Insert: {
          bookmarked?: boolean | null
          correct: boolean
          created_at?: string | null
          id?: string
          problem_id: string
          selected: number
          time_spent?: number | null
          user_id: string
        }
        Update: {
          bookmarked?: boolean | null
          correct?: boolean
          created_at?: string | null
          id?: string
          problem_id?: string
          selected?: number
          time_spent?: number | null
          user_id?: string
        }
        Relationships: []
      }
      amc_custom_problems: {
        Row: {
          answer: number
          author_id: string
          choices: Json
          created_at: string | null
          difficulty: number
          hints: Json | null
          id: string
          level: string
          question: string
          question_zh: string | null
          solution: string
          solution_zh: string | null
          status: string
          topic: string
          updated_at: string | null
        }
        Insert: {
          answer: number
          author_id: string
          choices?: Json
          created_at?: string | null
          difficulty?: number
          hints?: Json | null
          id?: string
          level: string
          question: string
          question_zh?: string | null
          solution: string
          solution_zh?: string | null
          status?: string
          topic: string
          updated_at?: string | null
        }
        Update: {
          answer?: number
          author_id?: string
          choices?: Json
          created_at?: string | null
          difficulty?: number
          hints?: Json | null
          id?: string
          level?: string
          question?: string
          question_zh?: string | null
          solution?: string
          solution_zh?: string | null
          status?: string
          topic?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      amc_daily_challenge: {
        Row: {
          created_at: string | null
          date: string
          level: string
          problem_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          level: string
          problem_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          level?: string
          problem_id?: string
        }
        Relationships: []
      }
      amc_daily_usage: {
        Row: {
          count: number | null
          date: string
          user_id: string
        }
        Insert: {
          count?: number | null
          date: string
          user_id: string
        }
        Update: {
          count?: number | null
          date?: string
          user_id?: string
        }
        Relationships: []
      }
      amc_discussions: {
        Row: {
          content: string
          created_at: string | null
          id: string
          problem_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          problem_id: string
          user_id: string
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          problem_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      amc_group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "amc_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "amc_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      amc_groups: {
        Row: {
          code: string
          created_at: string | null
          creator_id: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          creator_id: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          creator_id?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      amc_orders: {
        Row: {
          amount: string
          created_at: string | null
          order_id: string
          paid_at: string | null
          plan: string
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: string
          created_at?: string | null
          order_id: string
          paid_at?: string | null
          plan: string
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: string
          created_at?: string | null
          order_id?: string
          paid_at?: string | null
          plan?: string
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      amc_parent_child: {
        Row: {
          child_id: string | null
          confirmed_at: string | null
          created_at: string | null
          id: string
          invite_code: string | null
          parent_id: string
          status: string
        }
        Insert: {
          child_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          invite_code?: string | null
          parent_id: string
          status?: string
        }
        Update: {
          child_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          invite_code?: string | null
          parent_id?: string
          status?: string
        }
        Relationships: []
      }
      amc_profiles: {
        Row: {
          bookmarks: string[] | null
          created_at: string | null
          daily_goal: number | null
          grade: number | null
          last_practice_date: string | null
          longest_streak: number | null
          onboarded: boolean | null
          role: string | null
          self_level: string | null
          streak: number | null
          target_level: string | null
          target_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bookmarks?: string[] | null
          created_at?: string | null
          daily_goal?: number | null
          grade?: number | null
          last_practice_date?: string | null
          longest_streak?: number | null
          onboarded?: boolean | null
          role?: string | null
          self_level?: string | null
          streak?: number | null
          target_level?: string | null
          target_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bookmarks?: string[] | null
          created_at?: string | null
          daily_goal?: number | null
          grade?: number | null
          last_practice_date?: string | null
          longest_streak?: number | null
          onboarded?: boolean | null
          role?: string | null
          self_level?: string | null
          streak?: number | null
          target_level?: string | null
          target_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      amc_progress: {
        Row: {
          correct: boolean | null
          created_at: string | null
          problem_id: string
          selected: number | null
          time_spent: number | null
          user_id: string | null
        }
        Insert: {
          correct?: boolean | null
          created_at?: string | null
          problem_id: string
          selected?: number | null
          time_spent?: number | null
          user_id?: string | null
        }
        Update: {
          correct?: boolean | null
          created_at?: string | null
          problem_id?: string
          selected?: number | null
          time_spent?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      amc_subscriptions: {
        Row: {
          current_period_end: string | null
          plan: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          plan?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          plan?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      amc_tutor_usage: {
        Row: {
          count: number
          created_at: string | null
          date: string
          id: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string | null
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      amc_webhook_processing: {
        Row: {
          id: string
          payload: Json | null
          processed_at: string
          status: string
          transaction_id: string
        }
        Insert: {
          id?: string
          payload?: Json | null
          processed_at?: string
          status?: string
          transaction_id: string
        }
        Update: {
          id?: string
          payload?: Json | null
          processed_at?: string
          status?: string
          transaction_id?: string
        }
        Relationships: []
      }
      app_conversations: {
        Row: {
          app_slug: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          app_slug: string
          created_at?: string
          id?: string
          title?: string
        }
        Update: {
          app_slug?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      app_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "app_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          content: Json
          created_at: string
          description: string
          id: string
          is_favorite: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          description: string
          id?: string
          is_favorite?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string
          id?: string
          is_favorite?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_benchmarks: {
        Row: {
          benchmark_type: string
          confidence_level: string
          id: string
          label: string
          major_category: string
          metric_payload: Json
          refreshed_at: string
          sample_size: number
          university_id: string
        }
        Insert: {
          benchmark_type: string
          confidence_level?: string
          id?: string
          label: string
          major_category?: string
          metric_payload?: Json
          refreshed_at?: string
          sample_size?: number
          university_id: string
        }
        Update: {
          benchmark_type?: string
          confidence_level?: string
          id?: string
          label?: string
          major_category?: string
          metric_payload?: Json
          refreshed_at?: string
          sample_size?: number
          university_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      delimenu_menus: {
        Row: {
          created_at: string
          cuisine_label: string
          deleted_at: string | null
          dish_count: number
          id: string
          is_deleted: boolean
          is_favorite: boolean
          meal_label: string
          menu_json: Json
          menu_title: string
          people_count: number
          sub_cuisine: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          cuisine_label: string
          deleted_at?: string | null
          dish_count: number
          id?: string
          is_deleted?: boolean
          is_favorite?: boolean
          meal_label: string
          menu_json: Json
          menu_title: string
          people_count: number
          sub_cuisine: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          cuisine_label?: string
          deleted_at?: string | null
          dish_count?: number
          id?: string
          is_deleted?: boolean
          is_favorite?: boolean
          meal_label?: string
          menu_json?: Json
          menu_title?: string
          people_count?: number
          sub_cuisine?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      delimenu_users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_banned: boolean
          last_login_at: string | null
          menu_count: number
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_banned?: boolean
          last_login_at?: string | null
          menu_count?: number
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_banned?: boolean
          last_login_at?: string | null
          menu_count?: number
          role?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          char_count: number
          content_text: string
          created_at: string
          doc_type: string | null
          filename: string | null
          id: number
          lang: string | null
        }
        Insert: {
          char_count: number
          content_text: string
          created_at?: string
          doc_type?: string | null
          filename?: string | null
          id?: number
          lang?: string | null
        }
        Update: {
          char_count?: number
          content_text?: string
          created_at?: string
          doc_type?: string | null
          filename?: string | null
          id?: number
          lang?: string | null
        }
        Relationships: []
      }
      dx3xb_creator_follows: {
        Row: {
          created_at: string
          creator_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          follower_id?: string
        }
        Relationships: []
      }
      dx3xb_creator_notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          kind: string
          microapp_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: number
          kind: string
          microapp_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: number
          kind?: string
          microapp_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dx3xb_creator_notifications_microapp_id_fkey"
            columns: ["microapp_id"]
            isOneToOne: false
            referencedRelation: "dx3xb_microapps"
            referencedColumns: ["id"]
          },
        ]
      }
      dx3xb_guestbook: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          hidden: boolean
          id: number
          ip: string | null
          message: string
          name: string
          parent_id: number | null
          region: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          hidden?: boolean
          id?: never
          ip?: string | null
          message: string
          name: string
          parent_id?: number | null
          region?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          hidden?: boolean
          id?: never
          ip?: string | null
          message?: string
          name?: string
          parent_id?: number | null
          region?: string | null
        }
        Relationships: []
      }
      dx3xb_microapp_events: {
        Row: {
          created_at: string
          event: string
          id: number
          microapp_id: string
          play_session_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: number
          microapp_id: string
          play_session_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: number
          microapp_id?: string
          play_session_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dx3xb_microapp_events_microapp_id_fkey"
            columns: ["microapp_id"]
            isOneToOne: false
            referencedRelation: "dx3xb_microapps"
            referencedColumns: ["id"]
          },
        ]
      }
      dx3xb_microapp_favorites: {
        Row: {
          created_at: string
          microapp_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          microapp_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          microapp_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dx3xb_microapp_favorites_microapp_id_fkey"
            columns: ["microapp_id"]
            isOneToOne: false
            referencedRelation: "dx3xb_microapps"
            referencedColumns: ["id"]
          },
        ]
      }
      dx3xb_microapp_reports: {
        Row: {
          created_at: string | null
          fingerprint_hash: string | null
          id: number
          microapp_id: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          fingerprint_hash?: string | null
          id?: never
          microapp_id?: string | null
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          fingerprint_hash?: string | null
          id?: never
          microapp_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dx3xb_microapp_reports_microapp_id_fkey"
            columns: ["microapp_id"]
            isOneToOne: false
            referencedRelation: "dx3xb_microapps"
            referencedColumns: ["id"]
          },
        ]
      }
      dx3xb_microapps: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          owner_id: string
          plays: number
          slug: string
          status: string
          template: string
          title: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          owner_id: string
          plays?: number
          slug: string
          status?: string
          template?: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          owner_id?: string
          plays?: number
          slug?: string
          status?: string
          template?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dx3xb_play_results: {
        Row: {
          created_at: string
          id: string
          label: string
          microapp_id: string
          play_session_id: string | null
          score: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          microapp_id: string
          play_session_id?: string | null
          score?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          microapp_id?: string
          play_session_id?: string | null
          score?: number | null
        }
        Relationships: []
      }
      dx3xb_profiles: {
        Row: {
          created_at: string | null
          handle: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          handle?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          handle?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dx3xb_recent_plays: {
        Row: {
          microapp_id: string
          played_at: string
          user_id: string
        }
        Insert: {
          microapp_id: string
          played_at?: string
          user_id: string
        }
        Update: {
          microapp_id?: string
          played_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dx3xb_recent_plays_microapp_id_fkey"
            columns: ["microapp_id"]
            isOneToOne: false
            referencedRelation: "dx3xb_microapps"
            referencedColumns: ["id"]
          },
        ]
      }
      dx3xb_runs: {
        Row: {
          created_at: string | null
          game: string
          id: number
          lang: string | null
          pct: number | null
          score: number
          stats: Json | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game: string
          id?: never
          lang?: string | null
          pct?: number | null
          score?: number
          stats?: Json | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game?: string
          id?: never
          lang?: string | null
          pct?: number | null
          score?: number
          stats?: Json | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dx3xb_subscribers: {
        Row: {
          created_at: string
          email: string
          id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: never
        }
        Update: {
          created_at?: string
          email?: string
          id?: never
        }
        Relationships: []
      }
      dx3xb_toys: {
        Row: {
          created_at: string
          desc_en: string | null
          desc_zh: string | null
          icon: string | null
          id: number
          slug: string
          sort_order: number
          status: string
          title_en: string
          title_zh: string
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          desc_en?: string | null
          desc_zh?: string | null
          icon?: string | null
          id?: never
          slug: string
          sort_order?: number
          status?: string
          title_en: string
          title_zh: string
          type?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          desc_en?: string | null
          desc_zh?: string | null
          icon?: string | null
          id?: never
          slug?: string
          sort_order?: number
          status?: string
          title_en?: string
          title_zh?: string
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      emotion_logs: {
        Row: {
          emotion_state: string | null
          happy_event: string | null
          id: string
          notes: string | null
          recorded_at: string | null
          source: string | null
          source_agent: string | null
          stress_source: string | null
          student_id: string | null
        }
        Insert: {
          emotion_state?: string | null
          happy_event?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string | null
          source?: string | null
          source_agent?: string | null
          stress_source?: string | null
          student_id?: string | null
        }
        Update: {
          emotion_state?: string | null
          happy_event?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string | null
          source?: string | null
          source_agent?: string | null
          stress_source?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emotion_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      error_book: {
        Row: {
          correct_answer: string | null
          error_type: string | null
          homework_id: string | null
          id: string
          knowledge_point: string | null
          last_review_at: string | null
          mastered: boolean | null
          question_text: string | null
          recorded_at: string | null
          review_count: number | null
          reviewed: boolean | null
          student_answer: string | null
          student_id: string | null
          subject: string | null
        }
        Insert: {
          correct_answer?: string | null
          error_type?: string | null
          homework_id?: string | null
          id?: string
          knowledge_point?: string | null
          last_review_at?: string | null
          mastered?: boolean | null
          question_text?: string | null
          recorded_at?: string | null
          review_count?: number | null
          reviewed?: boolean | null
          student_answer?: string | null
          student_id?: string | null
          subject?: string | null
        }
        Update: {
          correct_answer?: string | null
          error_type?: string | null
          homework_id?: string | null
          id?: string
          knowledge_point?: string | null
          last_review_at?: string | null
          mastered?: boolean | null
          question_text?: string | null
          recorded_at?: string | null
          review_count?: number | null
          reviewed?: boolean | null
          student_answer?: string | null
          student_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_book_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_book_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          action_taken: string | null
          content: string
          created_at: string | null
          feedback_type: string | null
          id: string
          reviewed_by: string | null
          source_name: string | null
          source_type: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          action_taken?: string | null
          content: string
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          reviewed_by?: string | null
          source_name?: string | null
          source_type?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          action_taken?: string | null
          content?: string
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          reviewed_by?: string | null
          source_name?: string | null
          source_type?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completion_rate: number | null
          created_at: string | null
          deadline: string | null
          description: string | null
          goal_type: string | null
          id: string
          metadata: Json | null
          parent_goal_id: string | null
          status: string | null
          student_id: string | null
          target_value: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completion_rate?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          goal_type?: string | null
          id?: string
          metadata?: Json | null
          parent_goal_id?: string | null
          status?: string | null
          student_id?: string | null
          target_value?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completion_rate?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          goal_type?: string | null
          id?: string
          metadata?: Json | null
          parent_goal_id?: string | null
          status?: string | null
          student_id?: string | null
          target_value?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assigned_at: string | null
          content_path: string | null
          correct_rate: number | null
          due_date: string | null
          error_analysis: Json | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          lesson_id: string | null
          score: number | null
          status: string | null
          student_id: string | null
          submitted_at: string | null
          title: string | null
        }
        Insert: {
          assigned_at?: string | null
          content_path?: string | null
          correct_rate?: number | null
          due_date?: string | null
          error_analysis?: Json | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          lesson_id?: string | null
          score?: number | null
          status?: string | null
          student_id?: string | null
          submitted_at?: string | null
          title?: string | null
        }
        Update: {
          assigned_at?: string | null
          content_path?: string | null
          correct_rate?: number | null
          due_date?: string | null
          error_analysis?: Json | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          lesson_id?: string | null
          score?: number | null
          status?: string | null
          student_id?: string | null
          submitted_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          aspect_ratio: string | null
          created_at: string
          id: string
          image_url: string | null
          negative_prompt: string | null
          project_id: string
          prompt: string
          section: string | null
          seed: number | null
          size: string | null
          slot_id: string | null
          style: string | null
          usage: string
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          negative_prompt?: string | null
          project_id: string
          prompt: string
          section?: string | null
          seed?: number | null
          size?: string | null
          slot_id?: string | null
          style?: string | null
          usage: string
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          negative_prompt?: string | null
          project_id?: string
          prompt?: string
          section?: string | null
          seed?: number | null
          size?: string | null
          slot_id?: string | null
          style?: string | null
          usage?: string
        }
        Relationships: [
          {
            foreignKeyName: "images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_records: {
        Row: {
          class_performance: string | null
          current_level: string | null
          id: string
          notes: string | null
          recent_score: Json | null
          recorded_at: string | null
          student_id: string | null
          study_habits: string | null
          subject: string | null
          weak_points: string[] | null
        }
        Insert: {
          class_performance?: string | null
          current_level?: string | null
          id?: string
          notes?: string | null
          recent_score?: Json | null
          recorded_at?: string | null
          student_id?: string | null
          study_habits?: string | null
          subject?: string | null
          weak_points?: string[] | null
        }
        Update: {
          class_performance?: string | null
          current_level?: string | null
          id?: string
          notes?: string | null
          recent_score?: Json | null
          recorded_at?: string | null
          student_id?: string | null
          study_habits?: string | null
          subject?: string | null
          weak_points?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          confused_points: string[] | null
          created_at: string | null
          duration_minutes: number | null
          homework_assigned: string | null
          homework_path: string | null
          id: string
          interaction_quality: string | null
          lesson_date: string
          lesson_plan_path: string | null
          student_id: string | null
          subject: string | null
          teacher_notes: string | null
          topic: string | null
          understood_points: string[] | null
        }
        Insert: {
          confused_points?: string[] | null
          created_at?: string | null
          duration_minutes?: number | null
          homework_assigned?: string | null
          homework_path?: string | null
          id?: string
          interaction_quality?: string | null
          lesson_date: string
          lesson_plan_path?: string | null
          student_id?: string | null
          subject?: string | null
          teacher_notes?: string | null
          topic?: string | null
          understood_points?: string[] | null
        }
        Update: {
          confused_points?: string[] | null
          created_at?: string | null
          duration_minutes?: number | null
          homework_assigned?: string | null
          homework_path?: string | null
          id?: string
          interaction_quality?: string | null
          lesson_date?: string
          lesson_plan_path?: string | null
          student_id?: string | null
          subject?: string | null
          teacher_notes?: string | null
          topic?: string | null
          understood_points?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      magicbook_pages: {
        Row: {
          answer: string
          created_at: string
          id: string
          image_url: string | null
          question: string
          snapshot: string | null
          title: string | null
          topic_id: string | null
          topic_title: string | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          image_url?: string | null
          question: string
          snapshot?: string | null
          title?: string | null
          topic_id?: string | null
          topic_title?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          image_url?: string | null
          question?: string
          snapshot?: string | null
          title?: string | null
          topic_id?: string | null
          topic_title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          confidence: number
          content: string
          created_at: string
          embedding: string | null
          entities: Json | null
          expires_at: string | null
          id: string
          importance: number
          relations: Json | null
          source: string
          tags: string[] | null
          type: string
          user_id: string
        }
        Insert: {
          confidence?: number
          content: string
          created_at?: string
          embedding?: string | null
          entities?: Json | null
          expires_at?: string | null
          id: string
          importance?: number
          relations?: Json | null
          source: string
          tags?: string[] | null
          type: string
          user_id?: string
        }
        Update: {
          confidence?: number
          content?: string
          created_at?: string
          embedding?: string | null
          entities?: Json | null
          expires_at?: string | null
          id?: string
          importance?: number
          relations?: Json | null
          source?: string
          tags?: string[] | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      preview_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          project_id: string
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          project_id: string
          revoked_at?: string | null
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          project_id?: string
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "preview_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          generated_html: string
          id: string
          image_plan: Json | null
          page_plan: Json | null
          preview_password_hash: string | null
          preview_password_salt: string | null
          title: string
          user_prompt: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          generated_html?: string
          id?: string
          image_plan?: Json | null
          page_plan?: Json | null
          preview_password_hash?: string | null
          preview_password_salt?: string | null
          title?: string
          user_prompt: string
        }
        Update: {
          created_at?: string
          description?: string | null
          generated_html?: string
          id?: string
          image_plan?: Json | null
          page_plan?: Json | null
          preview_password_hash?: string | null
          preview_password_salt?: string | null
          title?: string
          user_prompt?: string
        }
        Relationships: []
      }
      sheldoncomm_configs: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      sheldoncomm_conversations: {
        Row: {
          created_at: string | null
          deleted: boolean | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sheldoncomm_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheldoncomm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "sheldoncomm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      six_hearts_responses: {
        Row: {
          answers: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "six_hearts_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "six_hearts_users"
            referencedColumns: ["id"]
          },
        ]
      }
      six_hearts_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          phone: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          phone: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          phone?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          age: number | null
          agent_group_id: string | null
          created_at: string | null
          dislikes: string[] | null
          grade: string | null
          id: string
          interests: string[] | null
          metadata: Json | null
          name: string
          nickname: string | null
          parent_email: string | null
          parent_phone: string | null
          parent_wechat: string | null
          personality_tags: string[] | null
          schedule_notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          agent_group_id?: string | null
          created_at?: string | null
          dislikes?: string[] | null
          grade?: string | null
          id?: string
          interests?: string[] | null
          metadata?: Json | null
          name: string
          nickname?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          parent_wechat?: string | null
          personality_tags?: string[] | null
          schedule_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          agent_group_id?: string | null
          created_at?: string | null
          dislikes?: string[] | null
          grade?: string | null
          id?: string
          interests?: string[] | null
          metadata?: Json | null
          name?: string
          nickname?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          parent_wechat?: string | null
          personality_tags?: string[] | null
          schedule_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transcription_chunks: {
        Row: {
          chunk_index: number
          created_at: string
          end_seconds: number | null
          id: number
          model: string | null
          start_seconds: number | null
          text: string | null
          transcription_id: string | null
        }
        Insert: {
          chunk_index: number
          created_at?: string
          end_seconds?: number | null
          id?: number
          model?: string | null
          start_seconds?: number | null
          text?: string | null
          transcription_id?: string | null
        }
        Update: {
          chunk_index?: number
          created_at?: string
          end_seconds?: number | null
          id?: number
          model?: string | null
          start_seconds?: number | null
          text?: string | null
          transcription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcription_chunks_transcription_id_fkey"
            columns: ["transcription_id"]
            isOneToOne: false
            referencedRelation: "transcriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      transcription_requests: {
        Row: {
          chunk_index: number | null
          created_at: string
          error_message: string | null
          id: number
          input_chars: number
          model: string | null
          output_chars: number | null
          success: boolean
          transcription_id: string | null
        }
        Insert: {
          chunk_index?: number | null
          created_at?: string
          error_message?: string | null
          id?: number
          input_chars: number
          model?: string | null
          output_chars?: number | null
          success?: boolean
          transcription_id?: string | null
        }
        Update: {
          chunk_index?: number | null
          created_at?: string
          error_message?: string | null
          id?: number
          input_chars?: number
          model?: string | null
          output_chars?: number | null
          success?: boolean
          transcription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcription_requests_transcription_id_fkey"
            columns: ["transcription_id"]
            isOneToOne: false
            referencedRelation: "transcriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          completed_chunks: number | null
          created_at: string
          duration_seconds: number | null
          file_size_mb: number | null
          filename: string | null
          full_text: string | null
          id: string
          status: string | null
          target_lang: string | null
          total_chunks: number | null
          updated_at: string
        }
        Insert: {
          completed_chunks?: number | null
          created_at?: string
          duration_seconds?: number | null
          file_size_mb?: number | null
          filename?: string | null
          full_text?: string | null
          id?: string
          status?: string | null
          target_lang?: string | null
          total_chunks?: number | null
          updated_at?: string
        }
        Update: {
          completed_chunks?: number | null
          created_at?: string
          duration_seconds?: number | null
          file_size_mb?: number | null
          filename?: string | null
          full_text?: string | null
          id?: string
          status?: string | null
          target_lang?: string | null
          total_chunks?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      university_case_stats: {
        Row: {
          academic_routes: Json
          act_max: number | null
          act_median: number | null
          act_min: number | null
          admitted_major_examples: Json
          ap_count_max: number | null
          ap_count_median: number | null
          ap_count_min: number | null
          application_rounds: Json
          avg_activities_count: number | null
          avg_awards_count: number | null
          avg_completeness_score: number | null
          case_count: number
          confidence_level: string
          defer_count: number
          enrolled_count: number
          evidence_profile: Json
          gpa_max: number | null
          gpa_median: number | null
          gpa_min: number | null
          id: string
          ielts_max: number | null
          ielts_median: number | null
          ielts_min: number | null
          last_source_update: string | null
          major_category: string
          offer_count: number
          refreshed_at: string
          reject_count: number
          sample_size: number
          sat_max: number | null
          sat_median: number | null
          sat_min: number | null
          source_regions: Json
          source_snapshot_count: number
          toefl_max: number | null
          toefl_median: number | null
          toefl_min: number | null
          university_id: string
          university_name: string
          waitlist_count: number
        }
        Insert: {
          academic_routes?: Json
          act_max?: number | null
          act_median?: number | null
          act_min?: number | null
          admitted_major_examples?: Json
          ap_count_max?: number | null
          ap_count_median?: number | null
          ap_count_min?: number | null
          application_rounds?: Json
          avg_activities_count?: number | null
          avg_awards_count?: number | null
          avg_completeness_score?: number | null
          case_count?: number
          confidence_level?: string
          defer_count?: number
          enrolled_count?: number
          evidence_profile?: Json
          gpa_max?: number | null
          gpa_median?: number | null
          gpa_min?: number | null
          id?: string
          ielts_max?: number | null
          ielts_median?: number | null
          ielts_min?: number | null
          last_source_update?: string | null
          major_category?: string
          offer_count?: number
          refreshed_at?: string
          reject_count?: number
          sample_size?: number
          sat_max?: number | null
          sat_median?: number | null
          sat_min?: number | null
          source_regions?: Json
          source_snapshot_count?: number
          toefl_max?: number | null
          toefl_median?: number | null
          toefl_min?: number | null
          university_id: string
          university_name: string
          waitlist_count?: number
        }
        Update: {
          academic_routes?: Json
          act_max?: number | null
          act_median?: number | null
          act_min?: number | null
          admitted_major_examples?: Json
          ap_count_max?: number | null
          ap_count_median?: number | null
          ap_count_min?: number | null
          application_rounds?: Json
          avg_activities_count?: number | null
          avg_awards_count?: number | null
          avg_completeness_score?: number | null
          case_count?: number
          confidence_level?: string
          defer_count?: number
          enrolled_count?: number
          evidence_profile?: Json
          gpa_max?: number | null
          gpa_median?: number | null
          gpa_min?: number | null
          id?: string
          ielts_max?: number | null
          ielts_median?: number | null
          ielts_min?: number | null
          last_source_update?: string | null
          major_category?: string
          offer_count?: number
          refreshed_at?: string
          reject_count?: number
          sample_size?: number
          sat_max?: number | null
          sat_median?: number | null
          sat_min?: number | null
          source_regions?: Json
          source_snapshot_count?: number
          toefl_max?: number | null
          toefl_median?: number | null
          toefl_min?: number | null
          university_id?: string
          university_name?: string
          waitlist_count?: number
        }
        Relationships: []
      }
      university_map_feedback: {
        Row: {
          admin_reply: string | null
          browser_id: string
          contact: string | null
          content: string
          created_at: string
          id: string
          replied_at: string | null
          shortlist: Json
          title: string
          user_name: string
        }
        Insert: {
          admin_reply?: string | null
          browser_id: string
          contact?: string | null
          content: string
          created_at?: string
          id?: string
          replied_at?: string | null
          shortlist?: Json
          title: string
          user_name: string
        }
        Update: {
          admin_reply?: string | null
          browser_id?: string
          contact?: string | null
          content?: string
          created_at?: string
          id?: string
          replied_at?: string | null
          shortlist?: Json
          title?: string
          user_name?: string
        }
        Relationships: []
      }
      voicemaker_custom_voices: {
        Row: {
          audio_sample_data: string | null
          audio_sample_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          voice_id: string
        }
        Insert: {
          audio_sample_data?: string | null
          audio_sample_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          voice_id: string
        }
        Update: {
          audio_sample_data?: string | null
          audio_sample_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          voice_id?: string
        }
        Relationships: []
      }
      voicemaker_generations: {
        Row: {
          audio_data: string | null
          audio_url: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          text_content: string
          updated_at: string
          voice_id: string
        }
        Insert: {
          audio_data?: string | null
          audio_url?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          text_content: string
          updated_at?: string
          voice_id: string
        }
        Update: {
          audio_data?: string | null
          audio_url?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          text_content?: string
          updated_at?: string
          voice_id?: string
        }
        Relationships: []
      }
      webbuilder_api_keys: {
        Row: {
          created_at: string
          created_by_id: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          owner_id: string | null
          revoked_at: string | null
          scopes: Json
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          expires_at?: string | null
          id: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at?: string | null
          owner_id?: string | null
          revoked_at?: string | null
          scopes?: Json
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          owner_id?: string | null
          revoked_at?: string | null
          scopes?: Json
        }
        Relationships: []
      }
      webbuilder_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          actor_type: string
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          actor_type: string
          created_at?: string
          id: string
          metadata?: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      webbuilder_generation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by_id: string | null
          created_by_type: string | null
          error_message: string | null
          id: string
          project_id: string
          prompt: string
          remote_status: number | null
          remote_url: string | null
          request_payload: Json
          response_payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_type?: string | null
          error_message?: string | null
          id: string
          project_id: string
          prompt: string
          remote_status?: number | null
          remote_url?: string | null
          request_payload?: Json
          response_payload?: Json
          status: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_type?: string | null
          error_message?: string | null
          id?: string
          project_id?: string
          prompt?: string
          remote_status?: number | null
          remote_url?: string | null
          request_payload?: Json
          response_payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      webbuilder_images: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          isTrash: boolean | null
          prompt: string
          size: string | null
          storage_path: string | null
          tags: string[] | null
          url: string
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          isTrash?: boolean | null
          prompt: string
          size?: string | null
          storage_path?: string | null
          tags?: string[] | null
          url: string
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          isTrash?: boolean | null
          prompt?: string
          size?: string | null
          storage_path?: string | null
          tags?: string[] | null
          url?: string
        }
        Relationships: []
      }
      webbuilder_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          istrash: boolean | null
          isTrash: boolean | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          istrash?: boolean | null
          isTrash?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          istrash?: boolean | null
          isTrash?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webbuilder_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "webbuilder_users"
            referencedColumns: ["id"]
          },
        ]
      }
      webbuilder_projects: {
        Row: {
          chat_history: Json | null
          chatHistory: Json | null
          created_at: string | null
          created_by_id: string | null
          created_by_type: string | null
          date: string | null
          html_content: string | null
          htmlContent: string | null
          id: number
          initial_prompt: string | null
          initialPrompt: string | null
          is_published: boolean | null
          is_trash: boolean | null
          isPublished: boolean | null
          isTrash: boolean | null
          last_generation_id: string | null
          name: string | null
          owner_id: string | null
          revision: number | null
          share_mode: string | null
          share_token: string | null
          shareMode: string | null
          sharePassword: string | null
          shareToken: string | null
          source: string | null
          updated_at: string | null
          updated_by_id: string | null
          updated_by_type: string | null
          user_id: string | null
        }
        Insert: {
          chat_history?: Json | null
          chatHistory?: Json | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_type?: string | null
          date?: string | null
          html_content?: string | null
          htmlContent?: string | null
          id?: never
          initial_prompt?: string | null
          initialPrompt?: string | null
          is_published?: boolean | null
          is_trash?: boolean | null
          isPublished?: boolean | null
          isTrash?: boolean | null
          last_generation_id?: string | null
          name?: string | null
          owner_id?: string | null
          revision?: number | null
          share_mode?: string | null
          share_token?: string | null
          shareMode?: string | null
          sharePassword?: string | null
          shareToken?: string | null
          source?: string | null
          updated_at?: string | null
          updated_by_id?: string | null
          updated_by_type?: string | null
          user_id?: string | null
        }
        Update: {
          chat_history?: Json | null
          chatHistory?: Json | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_type?: string | null
          date?: string | null
          html_content?: string | null
          htmlContent?: string | null
          id?: never
          initial_prompt?: string | null
          initialPrompt?: string | null
          is_published?: boolean | null
          is_trash?: boolean | null
          isPublished?: boolean | null
          isTrash?: boolean | null
          last_generation_id?: string | null
          name?: string | null
          owner_id?: string | null
          revision?: number | null
          share_mode?: string | null
          share_token?: string | null
          shareMode?: string | null
          sharePassword?: string | null
          shareToken?: string | null
          source?: string | null
          updated_at?: string | null
          updated_by_id?: string | null
          updated_by_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webbuilder_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "webbuilder_users"
            referencedColumns: ["id"]
          },
        ]
      }
      webbuilder_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token_hash: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token_hash: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webbuilder_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "webbuilder_users"
            referencedColumns: ["id"]
          },
        ]
      }
      webbuilder_users: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          completion_rate: number | null
          emotion_summary: string | null
          generated_at: string | null
          highlights: string | null
          id: string
          improvements_needed: string | null
          next_week_plan: string | null
          report_path: string | null
          student_id: string | null
          teacher_comments: string | null
          week_end: string
          week_start: string
          weekly_goal: string | null
        }
        Insert: {
          completion_rate?: number | null
          emotion_summary?: string | null
          generated_at?: string | null
          highlights?: string | null
          id?: string
          improvements_needed?: string | null
          next_week_plan?: string | null
          report_path?: string | null
          student_id?: string | null
          teacher_comments?: string | null
          week_end: string
          week_start: string
          weekly_goal?: string | null
        }
        Update: {
          completion_rate?: number | null
          emotion_summary?: string | null
          generated_at?: string | null
          highlights?: string | null
          id?: string
          improvements_needed?: string | null
          next_week_plan?: string | null
          report_path?: string | null
          student_id?: string | null
          teacher_comments?: string | null
          week_end?: string
          week_start?: string
          weekly_goal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      xx_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dx3xb_accept_play_event: {
        Args: { p_event: string; p_microapp_id: string; p_session_id: string }
        Returns: boolean
      }
      dx3xb_bump_play: { Args: { app_slug: string }; Returns: undefined }
      dx3xb_create_play_session: {
        Args: {
          p_expires_at: string
          p_fingerprint_hash: string
          p_microapp_id: string
          p_session_id: string
        }
        Returns: boolean
      }
      dx3xb_finish_ai_request: {
        Args: { p_request_id: string; p_status: string; p_user_id: string }
        Returns: boolean
      }
      dx3xb_reserve_ai_request: {
        Args: {
          p_app_limit?: number
          p_daily_limit: number
          p_input_hash: string
          p_microapp_id?: string
          p_request_id: string
          p_scope: string
          p_user_id: string
        }
        Returns: Json
      }
      dx3xb_save_play_result: {
        Args: {
          p_label: string
          p_microapp_id: string
          p_score: number
          p_session_id: string
        }
        Returns: boolean
      }
      match_memories: {
        Args: {
          filter_user_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          confidence: number
          content: string
          created_at: string
          embedding: string
          entities: Json
          expires_at: string
          id: string
          importance: number
          relations: Json
          similarity: number
          source: string
          tags: string[]
          type: string
          user_id: string
        }[]
      }
      match_webbuilder_images: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          created_at: string
          id: string
          prompt: string
          similarity: number
          size: string
          tags: string[]
          url: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
