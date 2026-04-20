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
      challenge_progress: {
        Row: {
          challenge_id: string
          count: number
          id: string
          last_updated_at: string
          org_id: string
        }
        Insert: {
          challenge_id: string
          count?: number
          id?: string
          last_updated_at?: string
          org_id: string
        }
        Update: {
          challenge_id?: string
          count?: number
          id?: string
          last_updated_at?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "challenge_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
        ]
      }
      challenge_votes: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          org_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          org_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_votes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_votes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "challenge_votes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_votes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
        ]
      }
      challenges: {
        Row: {
          active_ends_at: string | null
          active_starts_at: string | null
          admin_notes: string | null
          created_at: string
          description: string
          duration_days: number
          id: string
          objective_params: Json
          objective_type: Database["public"]["Enums"]["challenge_objective_type"]
          prize_structure: Json
          proposed_by_org_id: string
          status: Database["public"]["Enums"]["challenge_status"]
          title: string
          updated_at: string
          voting_ends_at: string | null
          voting_starts_at: string | null
        }
        Insert: {
          active_ends_at?: string | null
          active_starts_at?: string | null
          admin_notes?: string | null
          created_at?: string
          description: string
          duration_days: number
          id?: string
          objective_params: Json
          objective_type: Database["public"]["Enums"]["challenge_objective_type"]
          prize_structure: Json
          proposed_by_org_id: string
          status?: Database["public"]["Enums"]["challenge_status"]
          title: string
          updated_at?: string
          voting_ends_at?: string | null
          voting_starts_at?: string | null
        }
        Update: {
          active_ends_at?: string | null
          active_starts_at?: string | null
          admin_notes?: string | null
          created_at?: string
          description?: string
          duration_days?: number
          id?: string
          objective_params?: Json
          objective_type?: Database["public"]["Enums"]["challenge_objective_type"]
          prize_structure?: Json
          proposed_by_org_id?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          title?: string
          updated_at?: string
          voting_ends_at?: string | null
          voting_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_proposed_by_org_id_fkey"
            columns: ["proposed_by_org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "challenges_proposed_by_org_id_fkey"
            columns: ["proposed_by_org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_proposed_by_org_id_fkey"
            columns: ["proposed_by_org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string
          from_org_id: string
          id: string
          message: string
          respond_token: string | null
          responded_at: string | null
          status: string
          to_startup_id: string
        }
        Insert: {
          created_at?: string
          from_org_id: string
          id?: string
          message: string
          respond_token?: string | null
          responded_at?: string | null
          status?: string
          to_startup_id: string
        }
        Update: {
          created_at?: string
          from_org_id?: string
          id?: string
          message?: string
          respond_token?: string | null
          responded_at?: string | null
          status?: string
          to_startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_from_org_id_fkey"
            columns: ["from_org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_anonymous_standings"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "contact_requests_from_org_id_fkey"
            columns: ["from_org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_from_org_id_fkey"
            columns: ["from_org_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_totals"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "contact_requests_to_startup_id_fkey"
            columns: ["to_startup_id"]
            isOneToOne: false
            referencedRelation: "league_standings"
            referencedColumns: ["startup_id"]
          },
          {
            foreignKeyName: "contact_requests_to_startup_id_fkey"
            columns: ["to_startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
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
          id: string
          matched_reason: string
          org_id: string
          startup_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean
          id?: string
          matched_reason: string
          org_id: string
          startup_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean
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
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
      startups: {
        Row: {
          consent_direct_contact: boolean
          consent_internal_use: boolean
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
          logo_url: string | null
          name: string
          notification_email_enabled: boolean
          notification_frequency: string
          one_liner: string | null
          owner_id: string
          referred_by_org_id: string | null
          show_public_timeline: boolean
          slug: string
          twitter_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          consent_direct_contact?: boolean
          consent_internal_use?: boolean
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
          logo_url?: string | null
          name: string
          notification_email_enabled?: boolean
          notification_frequency?: string
          one_liner?: string | null
          owner_id: string
          referred_by_org_id?: string | null
          show_public_timeline?: boolean
          slug: string
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          consent_direct_contact?: boolean
          consent_internal_use?: boolean
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
          logo_url?: string | null
          name?: string
          notification_email_enabled?: boolean
          notification_frequency?: string
          one_liner?: string | null
          owner_id?: string
          referred_by_org_id?: string | null
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
          slug: string | null
          startup_id: string | null
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
    }
    Functions: {
      check_challenge_vote_rate_limit: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_ecosystem: { Args: never; Returns: boolean }
      league_division_order: {
        Args: { d: Database["public"]["Enums"]["league_division"] }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      track_ecosystem_view: {
        Args: { p_org_id: string; p_startup_id: string }
        Returns: undefined
      }
    }
    Enums: {
      alert_type:
        | "moved_up_division"
        | "moved_down_division"
        | "new_top3_vertical"
        | "new_top10_vertical"
        | "new_top10_division"
        | "position_milestone"
      challenge_objective_type:
        | "referred_in_vertical"
        | "referred_in_region"
        | "referred_top10"
        | "validations_in_vertical"
      challenge_status:
        | "draft"
        | "voting"
        | "approved"
        | "active"
        | "completed"
        | "cancelled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      alert_type: [
        "moved_up_division",
        "moved_down_division",
        "new_top3_vertical",
        "new_top10_vertical",
        "new_top10_division",
        "position_milestone",
      ],
      challenge_objective_type: [
        "referred_in_vertical",
        "referred_in_region",
        "referred_top10",
        "validations_in_vertical",
      ],
      challenge_status: [
        "draft",
        "voting",
        "approved",
        "active",
        "completed",
        "cancelled",
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
