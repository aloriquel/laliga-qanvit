// Placeholder until: npx supabase gen types typescript --local > lib/supabase/types.ts
// Mirrors the exact structure the Supabase SDK expects (GenericSchema).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "startup" | "ecosystem" | "admin";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "startup" | "ecosystem" | "admin";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "startup" | "ecosystem" | "admin";
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      startups: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          name: string;
          legal_name: string | null;
          one_liner: string | null;
          website: string | null;
          logo_url: string | null;
          location_city: string | null;
          location_region: string | null;
          founded_year: number | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          is_public: boolean;
          current_division: Database["public"]["Enums"]["league_division"] | null;
          current_vertical: Database["public"]["Enums"]["startup_vertical"] | null;
          current_score: number | null;
          consent_public_profile: boolean;
          consent_internal_use: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          slug: string;
          name: string;
          legal_name?: string | null;
          one_liner?: string | null;
          website?: string | null;
          logo_url?: string | null;
          location_city?: string | null;
          location_region?: string | null;
          founded_year?: number | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          is_public?: boolean;
          current_division?: Database["public"]["Enums"]["league_division"] | null;
          current_vertical?: Database["public"]["Enums"]["startup_vertical"] | null;
          current_score?: number | null;
          consent_public_profile?: boolean;
          consent_internal_use?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          legal_name?: string | null;
          one_liner?: string | null;
          website?: string | null;
          logo_url?: string | null;
          location_city?: string | null;
          location_region?: string | null;
          founded_year?: number | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          is_public?: boolean;
          current_division?: Database["public"]["Enums"]["league_division"] | null;
          current_vertical?: Database["public"]["Enums"]["startup_vertical"] | null;
          current_score?: number | null;
          consent_public_profile?: boolean;
          consent_internal_use?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      decks: {
        Row: {
          id: string;
          startup_id: string;
          version: number;
          storage_path: string;
          file_size_bytes: number;
          page_count: number | null;
          status: Database["public"]["Enums"]["deck_status"];
          raw_text: string | null;
          language: string | null;
          uploaded_at: string;
          processed_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          startup_id: string;
          version?: number;
          storage_path: string;
          file_size_bytes: number;
          page_count?: number | null;
          status?: Database["public"]["Enums"]["deck_status"];
          raw_text?: string | null;
          language?: string | null;
          uploaded_at?: string;
          processed_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          version?: number;
          storage_path?: string;
          file_size_bytes?: number;
          page_count?: number | null;
          status?: Database["public"]["Enums"]["deck_status"];
          raw_text?: string | null;
          language?: string | null;
          processed_at?: string | null;
          error_message?: string | null;
        };
        Relationships: [];
      };
      deck_chunks: {
        Row: {
          id: string;
          deck_id: string;
          chunk_index: number;
          content: string;
          token_count: number | null;
          embedding: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          chunk_index: number;
          content: string;
          token_count?: number | null;
          embedding?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          content?: string;
          token_count?: number | null;
          embedding?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      evaluations: {
        Row: {
          id: string;
          deck_id: string;
          startup_id: string;
          assigned_division: Database["public"]["Enums"]["league_division"];
          assigned_vertical: Database["public"]["Enums"]["startup_vertical"];
          classification_confidence: number | null;
          score_problem: number;
          score_market: number;
          score_solution: number;
          score_team: number;
          score_traction: number;
          score_business_model: number;
          score_gtm: number;
          score_total: number;
          feedback: Json;
          summary: string | null;
          next_actions: Json | null;
          prompt_version: string;
          rubric_version: string;
          classifier_model: string;
          evaluator_model: string;
          tokens_input: number | null;
          tokens_output: number | null;
          cost_estimate_usd: number | null;
          latency_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          startup_id: string;
          assigned_division: Database["public"]["Enums"]["league_division"];
          assigned_vertical: Database["public"]["Enums"]["startup_vertical"];
          classification_confidence?: number | null;
          score_problem: number;
          score_market: number;
          score_solution: number;
          score_team: number;
          score_traction: number;
          score_business_model: number;
          score_gtm: number;
          score_total: number;
          feedback: Json;
          summary?: string | null;
          next_actions?: Json | null;
          prompt_version: string;
          rubric_version: string;
          classifier_model: string;
          evaluator_model: string;
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_estimate_usd?: number | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      ecosystem_organizations: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          org_type: Database["public"]["Enums"]["ecosystem_org_type"];
          website: string | null;
          logo_url: string | null;
          region: string | null;
          about: string | null;
          is_verified: boolean;
          verified_at: string | null;
          verified_by: string | null;
          referral_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          org_type: Database["public"]["Enums"]["ecosystem_org_type"];
          website?: string | null;
          logo_url?: string | null;
          region?: string | null;
          about?: string | null;
          is_verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          referral_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          org_type?: Database["public"]["Enums"]["ecosystem_org_type"];
          website?: string | null;
          logo_url?: string | null;
          region?: string | null;
          about?: string | null;
          is_verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ecosystem_points_log: {
        Row: {
          id: string;
          org_id: string;
          event_type: Database["public"]["Enums"]["points_event_type"];
          points: number;
          reference_startup_id: string | null;
          reference_evaluation_id: string | null;
          metadata: Json;
          notes: string | null;
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          event_type: Database["public"]["Enums"]["points_event_type"];
          points: number;
          reference_startup_id?: string | null;
          reference_evaluation_id?: string | null;
          metadata?: Json;
          notes?: string | null;
          granted_by?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      feedback_validations: {
        Row: {
          id: string;
          evaluation_id: string;
          org_id: string;
          is_positive: boolean;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          evaluation_id: string;
          org_id: string;
          is_positive: boolean;
          comment?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      deck_access_log: {
        Row: {
          id: string;
          deck_id: string;
          accessed_by: string;
          access_type: string;
          user_agent: string | null;
          ip_address: string | null;
          accessed_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          accessed_by: string;
          access_type: string;
          user_agent?: string | null;
          ip_address?: string | null;
          accessed_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      evaluation_appeals: {
        Row: {
          id: string;
          evaluation_id: string;
          startup_id: string;
          reason: string;
          requested_division: Database["public"]["Enums"]["league_division"] | null;
          requested_vertical: Database["public"]["Enums"]["startup_vertical"] | null;
          status: string;
          resolved_by: string | null;
          resolution_notes: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          evaluation_id: string;
          startup_id: string;
          reason: string;
          requested_division?: Database["public"]["Enums"]["league_division"] | null;
          requested_vertical?: Database["public"]["Enums"]["startup_vertical"] | null;
          status?: string;
          resolved_by?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          status?: string;
          resolved_by?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      league_standings: {
        Row: {
          startup_id: string;
          slug: string;
          name: string;
          one_liner: string | null;
          logo_url: string | null;
          current_division: Database["public"]["Enums"]["league_division"] | null;
          current_vertical: Database["public"]["Enums"]["startup_vertical"] | null;
          current_score: number | null;
          rank_national: number;
          rank_division: number;
          rank_division_vertical: number;
        };
        Relationships: [];
      };
      ecosystem_totals: {
        Row: {
          org_id: string;
          name: string;
          org_type: Database["public"]["Enums"]["ecosystem_org_type"];
          total_points: number;
          tier: Database["public"]["Enums"]["ecosystem_tier"];
        };
        Relationships: [];
      };
      public_evaluations: {
        Row: {
          id: string;
          startup_id: string;
          assigned_division: Database["public"]["Enums"]["league_division"];
          assigned_vertical: Database["public"]["Enums"]["startup_vertical"];
          score_total: number;
          summary: string | null;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: "startup" | "ecosystem" | "admin";
      deck_status: "pending" | "processing" | "evaluated" | "error" | "archived";
      league_division: "ideation" | "seed" | "growth" | "elite";
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
        | "cybersecurity";
      ecosystem_org_type:
        | "science_park"
        | "cluster"
        | "innovation_association"
        | "other";
      ecosystem_tier: "rookie" | "pro" | "elite";
      points_event_type:
        | "startup_referred_signup"
        | "startup_referred_top10"
        | "feedback_validated"
        | "vertical_proposed_accepted"
        | "admin_grant"
        | "admin_revoke";
    };
    CompositeTypes: Record<string, never>;
  };
};
