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
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_details: Json | null
          action_type: string
          actor_user_id: string
          created_at: string
          deal_id: string
          id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          actor_user_id: string
          created_at?: string
          deal_id: string
          id?: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          actor_user_id?: string
          created_at?: string
          deal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          deal_id: string
          id: string
          notes: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          deal_id: string
          id?: string
          notes?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          deal_id?: string
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_assignments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_field_values: {
        Row: {
          deal_id: string
          field_key: string
          id: string
          updated_at: string
          updated_by: string | null
          value_date: string | null
          value_json: Json | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          deal_id: string
          field_key: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          deal_id?: string
          field_key?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_field_values_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_field_values_field_key_fkey"
            columns: ["field_key"]
            isOneToOne: false
            referencedRelation: "field_dictionary"
            referencedColumns: ["field_key"]
          },
        ]
      }
      deal_participants: {
        Row: {
          access_method: Database["public"]["Enums"]["participant_access_method"]
          completed_at: string | null
          created_at: string
          deal_id: string
          email: string | null
          id: string
          invited_at: string
          name: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          sequence_order: number | null
          status: Database["public"]["Enums"]["participant_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_method?: Database["public"]["Enums"]["participant_access_method"]
          completed_at?: string | null
          created_at?: string
          deal_id: string
          email?: string | null
          id?: string
          invited_at?: string
          name?: string | null
          revoked_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          sequence_order?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_method?: Database["public"]["Enums"]["participant_access_method"]
          completed_at?: string | null
          created_at?: string
          deal_id?: string
          email?: string | null
          id?: string
          invited_at?: string
          name?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          sequence_order?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_participants_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          borrower_name: string | null
          created_at: string
          created_by: string
          deal_number: string
          id: string
          loan_amount: number | null
          mode: Database["public"]["Enums"]["deal_mode"]
          notes: string | null
          packet_id: string | null
          product_type: string
          property_address: string | null
          state: string
          status: Database["public"]["Enums"]["deal_status"]
          updated_at: string
        }
        Insert: {
          borrower_name?: string | null
          created_at?: string
          created_by: string
          deal_number: string
          id?: string
          loan_amount?: number | null
          mode?: Database["public"]["Enums"]["deal_mode"]
          notes?: string | null
          packet_id?: string | null
          product_type: string
          property_address?: string | null
          state: string
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Update: {
          borrower_name?: string | null
          created_at?: string
          created_by?: string
          deal_number?: string
          id?: string
          loan_amount?: number | null
          mode?: Database["public"]["Enums"]["deal_mode"]
          notes?: string | null
          packet_id?: string | null
          product_type?: string
          property_address?: string | null
          state?: string
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      field_dictionary: {
        Row: {
          allowed_roles: string[] | null
          calculation_dependencies: string[] | null
          calculation_formula: string | null
          created_at: string
          data_type: Database["public"]["Enums"]["field_data_type"]
          default_value: string | null
          description: string | null
          field_key: string
          id: string
          is_calculated: boolean
          is_repeatable: boolean
          label: string
          read_only_roles: string[] | null
          section: Database["public"]["Enums"]["field_section"]
          updated_at: string
          validation_rule: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          calculation_dependencies?: string[] | null
          calculation_formula?: string | null
          created_at?: string
          data_type?: Database["public"]["Enums"]["field_data_type"]
          default_value?: string | null
          description?: string | null
          field_key: string
          id?: string
          is_calculated?: boolean
          is_repeatable?: boolean
          label: string
          read_only_roles?: string[] | null
          section: Database["public"]["Enums"]["field_section"]
          updated_at?: string
          validation_rule?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          calculation_dependencies?: string[] | null
          calculation_formula?: string | null
          created_at?: string
          data_type?: Database["public"]["Enums"]["field_data_type"]
          default_value?: string | null
          description?: string | null
          field_key?: string
          id?: string
          is_calculated?: boolean
          is_repeatable?: boolean
          label?: string
          read_only_roles?: string[] | null
          section?: Database["public"]["Enums"]["field_section"]
          updated_at?: string
          validation_rule?: string | null
        }
        Relationships: []
      }
      field_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          created_at: string
          field_key: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          field_key: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          field_key?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string
          error_message: string | null
          generation_status: Database["public"]["Enums"]["generation_status"]
          id: string
          output_docx_path: string
          output_pdf_path: string | null
          output_type: Database["public"]["Enums"]["output_type"]
          packet_id: string | null
          template_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id: string
          error_message?: string | null
          generation_status?: Database["public"]["Enums"]["generation_status"]
          id?: string
          output_docx_path: string
          output_pdf_path?: string | null
          output_type?: Database["public"]["Enums"]["output_type"]
          packet_id?: string | null
          template_id: string
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string
          error_message?: string | null
          generation_status?: Database["public"]["Enums"]["generation_status"]
          id?: string
          output_docx_path?: string
          output_pdf_path?: string | null
          output_type?: Database["public"]["Enums"]["output_type"]
          packet_id?: string | null
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          deal_id: string
          error_message: string | null
          id: string
          output_type: Database["public"]["Enums"]["output_type"]
          packet_id: string | null
          request_type: Database["public"]["Enums"]["request_type"]
          requested_by: string
          started_at: string | null
          status: Database["public"]["Enums"]["generation_status"]
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deal_id: string
          error_message?: string | null
          id?: string
          output_type?: Database["public"]["Enums"]["output_type"]
          packet_id?: string | null
          request_type: Database["public"]["Enums"]["request_type"]
          requested_by: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string
          error_message?: string | null
          id?: string
          output_type?: Database["public"]["Enums"]["output_type"]
          packet_id?: string | null
          request_type?: Database["public"]["Enums"]["request_type"]
          requested_by?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_links: {
        Row: {
          created_at: string
          created_by: string
          deal_participant_id: string
          expires_at: string
          id: string
          last_used_at: string | null
          max_uses: number
          token: string
          used_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_participant_id: string
          expires_at: string
          id?: string
          last_used_at?: string | null
          max_uses?: number
          token: string
          used_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_participant_id?: string
          expires_at?: string
          id?: string
          last_used_at?: string | null
          max_uses?: number
          token?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "magic_links_deal_participant_id_fkey"
            columns: ["deal_participant_id"]
            isOneToOne: false
            referencedRelation: "deal_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      packet_templates: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_required: boolean
          packet_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean
          packet_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean
          packet_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packet_templates_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packet_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      packets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          product_type: string
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_type: string
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_type?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      template_field_maps: {
        Row: {
          created_at: string
          display_order: number | null
          field_key: string
          id: string
          required_flag: boolean
          template_id: string
          transform_rule: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          field_key: string
          id?: string
          required_flag?: boolean
          template_id: string
          transform_rule?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          field_key?: string
          id?: string
          required_flag?: boolean
          template_id?: string
          transform_rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_field_maps_field_key_fkey"
            columns: ["field_key"]
            isOneToOne: false
            referencedRelation: "field_dictionary"
            referencedColumns: ["field_key"]
          },
          {
            foreignKeyName: "template_field_maps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string | null
          id: string
          is_active: boolean
          name: string
          product_type: string
          reference_pdf_path: string | null
          state: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_type: string
          reference_pdf_path?: string | null
          state: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_type?: string
          reference_pdf_path?: string | null
          state?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_field: {
        Args: { _field_key: string; _user_id: string }
        Returns: boolean
      }
      can_edit_field_v2: {
        Args: { _field_key: string; _user_id: string }
        Returns: boolean
      }
      can_view_field: {
        Args: { _field_key: string; _user_id: string }
        Returns: boolean
      }
      can_view_field_v2: {
        Args: { _field_key: string; _user_id: string }
        Returns: boolean
      }
      generate_deal_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_deal_access: {
        Args: { _deal_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_external_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      validate_magic_link: {
        Args: { _token: string }
        Returns: {
          deal_id: string
          deal_number: string
          error_message: string
          is_valid: boolean
          participant_id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "csr" | "borrower" | "broker" | "lender"
      deal_mode: "doc_prep" | "servicing_only"
      deal_status: "draft" | "ready" | "generated"
      field_data_type:
        | "text"
        | "number"
        | "currency"
        | "date"
        | "percentage"
        | "boolean"
      field_section:
        | "borrower"
        | "co_borrower"
        | "loan_terms"
        | "property"
        | "seller"
        | "title"
        | "escrow"
        | "other"
        | "broker"
        | "system"
      generation_status: "queued" | "running" | "success" | "failed"
      output_type: "docx_only" | "docx_and_pdf"
      participant_access_method: "login" | "magic_link"
      participant_status: "invited" | "in_progress" | "completed" | "expired"
      request_type: "single_doc" | "packet"
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
      app_role: ["admin", "csr", "borrower", "broker", "lender"],
      deal_mode: ["doc_prep", "servicing_only"],
      deal_status: ["draft", "ready", "generated"],
      field_data_type: [
        "text",
        "number",
        "currency",
        "date",
        "percentage",
        "boolean",
      ],
      field_section: [
        "borrower",
        "co_borrower",
        "loan_terms",
        "property",
        "seller",
        "title",
        "escrow",
        "other",
        "broker",
        "system",
      ],
      generation_status: ["queued", "running", "success", "failed"],
      output_type: ["docx_only", "docx_and_pdf"],
      participant_access_method: ["login", "magic_link"],
      participant_status: ["invited", "in_progress", "completed", "expired"],
      request_type: ["single_doc", "packet"],
    },
  },
} as const
