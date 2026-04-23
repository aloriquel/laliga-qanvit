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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_id: string
          created_at: string
          id: string
          payload: Json
          reason: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_id: string
          created_at?: string
          id?: string
          payload?: Json
          reason?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["admin_action_type"]
          admin_id?: string
          created_at?: string
          id?: string
          payload?: Json
          reason?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_exports: {
        Row: {
          admin_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          expires_at: string | null
          file_size_bytes: number | null
          filters: Json | null
          id: string
          record_count: number | null
          scope: string
          status: string
          storage_path: string | null
        }
        Insert: {
          admin_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          filters?: Json | null
          id?: string
          record_count?: number | null
          scope: string
          status?: string
          storage_path?: string | null
        }
        Update: {
          admin_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          filters?: Json | null
          id?: string
          record_count?: number | null
          scope?: string
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_exports_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_access_log: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by: string
          deck_id: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_by: string
          deck_id: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by?: string
          deck_id?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deck_access_log_accessed_by_fkey"
            columns: ["accessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_access_log_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          deck_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          deck_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          deck_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deck_chunks_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_public_previews: {
        Row: {
          deck_id: string
          generated_at: string
          height: number | null
          id: string
          slide_number: number
          startup_id: string
          thumbnail_url: string
          width: number | null
        }
        Insert: {
          deck_id: string
          generated_at?: string
          height?: number | null
          id?: string
          slide_number: number
          startup_id: string
          thumbnail_url: string
          width?: number | null
        }
        Update: {
          deck_id?: string
          generated_at?: string
          height?: number | null
          id?: string
          slide_number?: number
          startup_id?: string
          thumbnail_url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deck_public_previews_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_public_previews_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "deck_public_previews_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          error_message: string | null
          file_size_bytes: number
          id: string
          language: string | null
          page_count: number | null
          processed_at: string | null
          raw_text: string | null
          startup_id: string
          status: Database["public"]["Enums"]["deck_status"]
          storage_path: string
          uploaded_at: string
          version: number
        }
        Insert: {
          error_message?: string | null
          file_size_bytes: number
          id?: string
          language?: string | null
          page_count?: number | null
          processed_at?: string | null
          raw_text?: string | null
          startup_id: string
          status?: Database["public"]["Enums"]["deck_status"]
          storage_path: string
          uploaded_at?: string
          version?: number
        }
        Update: {
          error_message?: string | null
          file_size_bytes?: number
          id?: string
          language?: string | null
          page_count?: number | null
          processed_at?: string | null
          raw_text?: string | null
          startup_id?: string
          status?: Database["public"]["Enums"]["deck_status"]
          storage_path?: string
          uploaded_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "decks_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "decks_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_alerts_config: {
        Row: {
          email_enabled: boolean
          frequency: string
          id: string
          org_id: string
          regions: string[]
          updated_at: string
          verticals: Database["public"]["Enums"]["startup_vertical"][]
        }
        Insert: {
          email_enabled?: boolean
          frequency?: string
          id?: string
          org_id: string
          regions?: string[]
          updated_at?: string
          verticals?: Database["public"]["Enums"]["startup_vertical"][]
        }
        Update: {
          email_enabled?: boolean
          frequency?: string
          id?: string
          org_id?: string
          regions?: string[]
          updated_at?: string
          verticals?: Database["public"]["Enums"]["startup_vertical"][]
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_alerts_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ecosystem_alerts_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_alerts_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
        ]
      }
      ecosystem_csv_exports: {
        Row: {
          created_at: string
          filters_json: Json | null
          id: string
          org_id: string
          rows_count: number
          tier_at_export: Database["public"]["Enums"]["ecosystem_tier"]
        }
        Insert: {
          created_at?: string
          filters_json?: Json | null
          id?: string
          org_id: string
          rows_count: number
          tier_at_export: Database["public"]["Enums"]["ecosystem_tier"]
        }
        Update: {
          created_at?: string
          filters_json?: Json | null
          id?: string
          org_id?: string
          rows_count?: number
          tier_at_export?: Database["public"]["Enums"]["ecosystem_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_csv_exports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ecosystem_csv_exports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_csv_exports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
        ]
      }
      ecosystem_new_startup_alerts: {
        Row: {
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          id: string
          matched_reason: string
          org_id: string
          startup_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          matched_reason: string
          org_id: string
          startup_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          matched_reason?: string
          org_id?: string
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_new_startup_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ecosystem_new_startup_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_new_startup_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ecosystem_new_startup_alerts_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "ecosystem_new_startup_alerts_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_organizations: {
        Row: {
          about: string | null
          created_at: string
          id: string
          is_verified: boolean
          logo_url: string | null
          name: string
          org_type: Database["public"]["Enums"]["ecosystem_org_type"]
          owner_id: string
          pending_owner_email: string | null
          referral_code: string
          region: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name: string
          org_type: Database["public"]["Enums"]["ecosystem_org_type"]
          owner_id: string
          pending_owner_email?: string | null
          referral_code: string
          region?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          org_type?: Database["public"]["Enums"]["ecosystem_org_type"]
          owner_id?: string
          pending_owner_email?: string | null
          referral_code?: string
          region?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_organizations_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_points_log: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["points_event_type"]
          event_type_deprecated: boolean
          granted_by: string | null
          id: string
          metadata: Json | null
          notes: string | null
          org_id: string
          points: number
          reference_evaluation_id: string | null
          reference_startup_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["points_event_type"]
          event_type_deprecated?: boolean
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          org_id: string
          points: number
          reference_evaluation_id?: string | null
          reference_startup_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["points_event_type"]
          event_type_deprecated?: boolean
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          org_id?: string
          points?: number
          reference_evaluation_id?: string | null
          reference_startup_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_points_log_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_points_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ecosystem_points_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_points_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ecosystem_points_log_reference_evaluation_id_fkey"
            columns: ["reference_evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_points_log_reference_evaluation_id_fkey"
            columns: ["reference_evaluation_id"]
            isOneToOne: false
            referencedRelation: "public_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_points_log_reference_startup_id_fkey"
            columns: ["reference_startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "ecosystem_points_log_reference_startup_id_fkey"
            columns: ["reference_startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_appeals: {
        Row: {
          created_at: string
          evaluation_id: string
          id: string
          reason: string
          requested_division:
            | Database["public"]["Enums"]["league_division"]
            | null
          requested_vertical:
            | Database["public"]["Enums"]["startup_vertical"]
            | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          startup_id: string
          status: string
        }
        Insert: {
          created_at?: string
          evaluation_id: string
          id?: string
          reason: string
          requested_division?:
            | Database["public"]["Enums"]["league_division"]
            | null
          requested_vertical?:
            | Database["public"]["Enums"]["startup_vertical"]
            | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          startup_id: string
          status?: string
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          id?: string
          reason?: string
          requested_division?:
            | Database["public"]["Enums"]["league_division"]
            | null
          requested_vertical?:
            | Database["public"]["Enums"]["startup_vertical"]
            | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          startup_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_appeals_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_appeals_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "public_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_appeals_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_appeals_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "evaluation_appeals_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          assigned_division: Database["public"]["Enums"]["league_division"]
          assigned_vertical: Database["public"]["Enums"]["startup_vertical"]
          classification_confidence: number | null
          classifier_model: string
          cost_estimate_usd: number | null
          created_at: string
          deck_id: string
          evaluator_model: string
          feedback: Json
          id: string
          is_calibration_sample: boolean
          latency_ms: number | null
          next_actions: Json | null
          prompt_version: string
          rubric_version: string
          score_business_model: number
          score_gtm: number
          score_market: number
          score_problem: number
          score_solution: number
          score_team: number
          score_total: number
          score_traction: number
          startup_id: string
          summary: string | null
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          assigned_division: Database["public"]["Enums"]["league_division"]
          assigned_vertical: Database["public"]["Enums"]["startup_vertical"]
          classification_confidence?: number | null
          classifier_model: string
          cost_estimate_usd?: number | null
          created_at?: string
          deck_id: string
          evaluator_model: string
          feedback: Json
          id?: string
          is_calibration_sample?: boolean
          latency_ms?: number | null
          next_actions?: Json | null
          prompt_version: string
          rubric_version: string
          score_business_model: number
          score_gtm: number
          score_market: number
          score_problem: number
          score_solution: number
          score_team: number
          score_total: number
          score_traction: number
          startup_id: string
          summary?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          assigned_division?: Database["public"]["Enums"]["league_division"]
          assigned_vertical?: Database["public"]["Enums"]["startup_vertical"]
          classification_confidence?: number | null
          classifier_model?: string
          cost_estimate_usd?: number | null
          created_at?: string
          deck_id?: string
          evaluator_model?: string
          feedback?: Json
          id?: string
          is_calibration_sample?: boolean
          latency_ms?: number | null
          next_actions?: Json | null
          prompt_version?: string
          rubric_version?: string
          score_business_model?: number
          score_gtm?: number
          score_market?: number
          score_problem?: number
          score_solution?: number
          score_team?: number
          score_total?: number
          score_traction?: number
          startup_id?: string
          summary?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "evaluations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_validations: {
        Row: {
          comment: string | null
          created_at: string
          evaluation_id: string
          id: string
          is_positive: boolean
          org_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          evaluation_id: string
          id?: string
          is_positive: boolean
          org_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          evaluation_id?: string
          id?: string
          is_positive?: boolean
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_validations_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_validations_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "public_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_validations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "feedback_validations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_validations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consent_ip: string | null
          consent_user_agent: string | null
          consented_at: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          seen_deck_consent_wizard: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          consent_ip?: string | null
          consent_user_agent?: string | null
          consented_at?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          seen_deck_consent_wizard?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          consent_ip?: string | null
          consent_user_agent?: string | null
          consented_at?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          seen_deck_consent_wizard?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      startup_alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          email_sent: boolean
          id: string
          is_read: boolean
          payload: Json
          startup_id: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          email_sent?: boolean
          id?: string
          is_read?: boolean
          payload?: Json
          startup_id: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          email_sent?: boolean
          id?: string
          is_read?: boolean
          payload?: Json
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_alerts_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_alerts_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_ecosystem_views: {
        Row: {
          first_viewed_at: string
          id: string
          last_viewed_at: string
          org_id: string
          startup_id: string
          views_count: number
        }
        Insert: {
          first_viewed_at?: string
          id?: string
          last_viewed_at?: string
          org_id: string
          startup_id: string
          views_count?: number
        }
        Update: {
          first_viewed_at?: string
          id?: string
          last_viewed_at?: string
          org_id?: string
          startup_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "startup_ecosystem_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "startup_ecosystem_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_ecosystem_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "startup_ecosystem_views_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_ecosystem_views_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_votes: {
        Row: {
          created_at: string
          id: string
          org_id: string
          reason: string | null
          startup_id: string
          tier_at_vote: string
          user_id: string
          vote_type: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          reason?: string | null
          startup_id: string
          tier_at_vote: string
          user_id: string
          vote_type: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          reason?: string | null
          startup_id?: string
          tier_at_vote?: string
          user_id?: string
          vote_type?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "startup_votes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "startup_votes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_votes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "startup_votes_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_votes_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          consent_direct_contact: boolean
          consent_internal_use: boolean
          consent_public_deck: boolean
          consent_public_profile: boolean
          created_at: string
          current_division:
            | Database["public"]["Enums"]["league_division"]
            | null
          current_score: number | null
          current_vertical:
            | Database["public"]["Enums"]["startup_vertical"]
            | null
          founded_year: number | null
          id: string
          is_public: boolean
          legal_name: string | null
          linkedin_url: string | null
          location_city: string | null
          location_region: string | null
          logo_storage_path: string | null
          logo_updated_at: string | null
          logo_url: string | null
          name: string
          notification_email_enabled: boolean
          notification_frequency: string
          one_liner: string | null
          owner_id: string
          referred_by_org_id: string | null
          region_ca: Database["public"]["Enums"]["ca_id"] | null
          region_province: string | null
          show_public_timeline: boolean
          slug: string
          twitter_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          consent_direct_contact?: boolean
          consent_internal_use?: boolean
          consent_public_deck?: boolean
          consent_public_profile?: boolean
          created_at?: string
          current_division?:
            | Database["public"]["Enums"]["league_division"]
            | null
          current_score?: number | null
          current_vertical?:
            | Database["public"]["Enums"]["startup_vertical"]
            | null
          founded_year?: number | null
          id?: string
          is_public?: boolean
          legal_name?: string | null
          linkedin_url?: string | null
          location_city?: string | null
          location_region?: string | null
          logo_storage_path?: string | null
          logo_updated_at?: string | null
          logo_url?: string | null
          name: string
          notification_email_enabled?: boolean
          notification_frequency?: string
          one_liner?: string | null
          owner_id: string
          referred_by_org_id?: string | null
          region_ca?: Database["public"]["Enums"]["ca_id"] | null
          region_province?: string | null
          show_public_timeline?: boolean
          slug: string
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          consent_direct_contact?: boolean
          consent_internal_use?: boolean
          consent_public_deck?: boolean
          consent_public_profile?: boolean
          created_at?: string
          current_division?:
            | Database["public"]["Enums"]["league_division"]
            | null
          current_score?: number | null
          current_vertical?:
            | Database["public"]["Enums"]["startup_vertical"]
            | null
          founded_year?: number | null
          id?: string
          is_public?: boolean
          legal_name?: string | null
          linkedin_url?: string | null
          location_city?: string | null
          location_region?: string | null
          logo_storage_path?: string | null
          logo_updated_at?: string | null
          logo_url?: string | null
          name?: string
          notification_email_enabled?: boolean
          notification_frequency?: string
          one_liner?: string | null
          owner_id?: string
          referred_by_org_id?: string | null
          region_ca?: Database["public"]["Enums"]["ca_id"] | null
          region_province?: string | null
          show_public_timeline?: boolean
          slug?: string
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startups_referred_by_org_id_fkey"
            columns: ["referred_by_org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "startups_referred_by_org_id_fkey"
            columns: ["referred_by_org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startups_referred_by_org_id_fkey"
            columns: ["referred_by_org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
        ]
      }
    }
    Views: {
      ecosystem_anonymous_standings: {
        Row: {
          decile: number | null
          org_id: string | null
          org_type: Database["public"]["Enums"]["ecosystem_org_type"] | null
          percentile: number | null
          total_points: number | null
        }
        Relationships: []
      }
      ecosystem_totals: {
        Row: {
          name: string | null
          org_id: string | null
          org_type: Database["public"]["Enums"]["ecosystem_org_type"] | null
          tier: Database["public"]["Enums"]["ecosystem_tier"] | null
          total_points: number | null
        }
        Relationships: []
      }
      league_standings: {
        Row: {
          current_division:
            | Database["public"]["Enums"]["league_division"]
            | null
          current_score: number | null
          current_vertical:
            | Database["public"]["Enums"]["startup_vertical"]
            | null
          logo_url: string | null
          name: string | null
          one_liner: string | null
          rank_division: number | null
          rank_division_vertical: number | null
          rank_national: number | null
          region_ca: Database["public"]["Enums"]["ca_id"] | null
          region_province: string | null
          slug: string | null
          startup_id: string | null
        }
        Relationships: []
      }
      metrics_summary: {
        Row: {
          avg_cost_per_eval_30d: number | null
          avg_latency_ms_7d: number | null
          cost_usd_30d: number | null
          cost_usd_7d: number | null
          decks_error_7d: number | null
          decks_error_total: number | null
          decks_evaluated_7d: number | null
          decks_evaluated_total: number | null
          degraded_evals_30d: number | null
          orgs_verified: number | null
          pipeline_success_rate_7d: number | null
          refreshed_at: string | null
          startups_with_score: number | null
          total_cost_usd: number | null
        }
        Relationships: []
      }
      public_evaluations: {
        Row: {
          assigned_division:
            | Database["public"]["Enums"]["league_division"]
            | null
          assigned_vertical:
            | Database["public"]["Enums"]["startup_vertical"]
            | null
          created_at: string | null
          id: string | null
          score_total: number | null
          startup_id: string | null
          summary: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "evaluations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      public_startup_momentum: {
        Row: {
          distinct_voters: number | null
          down_count: number | null
          down_weighted: number | null
          last_vote_at: string | null
          momentum_score: number | null
          startup_id: string | null
          up_count: number | null
          up_weighted: number | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_votes_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_votes_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_momentum: {
        Row: {
          distinct_voters: number | null
          down_count: number | null
          down_weighted: number | null
          last_vote_at: string | null
          momentum_score: number | null
          startup_id: string | null
          up_count: number | null
          up_weighted: number | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_votes_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "startup_votes_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_refresh_league_standings: { Args: never; Returns: undefined }
      check_startup_vote_eligibility: {
        Args: { p_org_id: string; p_startup_id: string }
        Returns: Json
      }
      get_cohort_retention: {
        Args: { weeks_back?: number }
        Returns: {
          cohort: string
          cohort_size: number
          retention_w1: number
          retention_w12: number
          retention_w4: number
          retention_w8: number
        }[]
      }
      get_division_vertical_heatmap: {
        Args: never
        Returns: {
          avg_score: number
          division: Database["public"]["Enums"]["league_division"]
          startup_count: number
          vertical: Database["public"]["Enums"]["startup_vertical"]
        }[]
      }
      get_vault_setting: { Args: { p_name: string }; Returns: string }
      get_vote_weight_for_tier: { Args: { p_tier: string }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_ecosystem: { Args: never; Returns: boolean }
      league_division_order: {
        Args: { d: Database["public"]["Enums"]["league_division"] }
        Returns: number
      }
      set_database_setting: {
        Args: { setting_name: string; setting_value: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      track_ecosystem_view: {
        Args: { p_org_id: string; p_startup_id: string }
        Returns: undefined
      }
    }
    Enums: {
      admin_action_type:
        | "org_approved"
        | "org_rejected"
        | "org_info_requested"
        | "org_revoked"
        | "org_points_adjusted"
        | "evaluation_overridden"
        | "evaluation_rerun"
        | "evaluation_deleted"
        | "evaluation_calibration_flagged"
        | "appeal_accepted_override"
        | "appeal_accepted_rerun"
        | "appeal_rejected"
        | "startup_hidden"
        | "startup_restored"
        | "startup_rerun_forced"
        | "challenge_approved_voting"
        | "challenge_activated"
        | "challenge_cancelled"
        | "challenge_prizes_distributed"
        | "dataset_exported"
        | "setting_updated"
        | "consent_given"
        | "startup_consent_forced"
        | "test_email_sent"
        | "ecosystem_application_received"
      alert_type:
        | "moved_up_division"
        | "moved_down_division"
        | "new_top3_vertical"
        | "new_top10_vertical"
        | "new_top10_division"
        | "position_milestone"
      ca_id:
        | "andalucia"
        | "aragon"
        | "asturias"
        | "baleares"
        | "canarias"
        | "cantabria"
        | "castilla_leon"
        | "castilla_la_mancha"
        | "cataluna"
        | "valenciana"
        | "extremadura"
        | "galicia"
        | "madrid"
        | "murcia"
        | "navarra"
        | "pais_vasco"
        | "rioja"
        | "ceuta"
        | "melilla"
      deck_status: "pending" | "processing" | "evaluated" | "error" | "archived"
      ecosystem_org_type:
        | "science_park"
        | "cluster"
        | "innovation_association"
        | "other"
      ecosystem_tier: "rookie" | "pro" | "elite"
      league_division: "ideation" | "seed" | "growth" | "elite"
      points_event_type:
        | "startup_referred_signup"
        | "startup_referred_top10"
        | "feedback_validated"
        | "vertical_proposed_accepted"
        | "admin_grant"
        | "admin_revoke"
        | "startup_referred_phase_up"
        | "challenge_winner"
      startup_vertical:
        | "deeptech_ai"
        | "robotics_automation"
        | "mobility"
        | "energy_cleantech"
        | "agrifood"
        | "healthtech_medtech"
        | "industrial_manufacturing"
        | "space_aerospace"
        | "materials_chemistry"
        | "cybersecurity"
      user_role: "startup" | "ecosystem" | "admin"
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
  public: {
    Enums: {
      admin_action_type: [
        "org_approved",
        "org_rejected",
        "org_info_requested",
        "org_revoked",
        "org_points_adjusted",
        "evaluation_overridden",
        "evaluation_rerun",
        "evaluation_deleted",
        "evaluation_calibration_flagged",
        "appeal_accepted_override",
        "appeal_accepted_rerun",
        "appeal_rejected",
        "startup_hidden",
        "startup_restored",
        "startup_rerun_forced",
        "challenge_approved_voting",
        "challenge_activated",
        "challenge_cancelled",
        "challenge_prizes_distributed",
        "dataset_exported",
        "setting_updated",
        "consent_given",
        "startup_consent_forced",
        "test_email_sent",
        "ecosystem_application_received",
      ],
      alert_type: [
        "moved_up_division",
        "moved_down_division",
        "new_top3_vertical",
        "new_top10_vertical",
        "new_top10_division",
        "position_milestone",
      ],
      ca_id: [
        "andalucia",
        "aragon",
        "asturias",
        "baleares",
        "canarias",
        "cantabria",
        "castilla_leon",
        "castilla_la_mancha",
        "cataluna",
        "valenciana",
        "extremadura",
        "galicia",
        "madrid",
        "murcia",
        "navarra",
        "pais_vasco",
        "rioja",
        "ceuta",
        "melilla",
      ],
      deck_status: ["pending", "processing", "evaluated", "error", "archived"],
      ecosystem_org_type: [
        "science_park",
        "cluster",
        "innovation_association",
        "other",
      ],
      ecosystem_tier: ["rookie", "pro", "elite"],
      league_division: ["ideation", "seed", "growth", "elite"],
      points_event_type: [
        "startup_referred_signup",
        "startup_referred_top10",
        "feedback_validated",
        "vertical_proposed_accepted",
        "admin_grant",
        "admin_revoke",
        "startup_referred_phase_up",
        "challenge_winner",
      ],
      startup_vertical: [
        "deeptech_ai",
        "robotics_automation",
        "mobility",
        "energy_cleantech",
        "agrifood",
        "healthtech_medtech",
        "industrial_manufacturing",
        "space_aerospace",
        "materials_chemistry",
        "cybersecurity",
      ],
      user_role: ["startup", "ecosystem", "admin"],
    },
  },
} as const
