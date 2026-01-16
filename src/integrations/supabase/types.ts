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
      deal_field_values: {
        Row: {
          created_at: string
          deal_id: string
          field_key: string
          field_value: string | null
          id: string
          repeat_index: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          field_key: string
          field_value?: string | null
          id?: string
          repeat_index?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          field_key?: string
          field_value?: string | null
          id?: string
          repeat_index?: number | null
          updated_at?: string
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
          created_at: string
          data_type: Database["public"]["Enums"]["field_data_type"]
          default_value: string | null
          description: string | null
          field_key: string
          id: string
          is_calculated: boolean
          is_repeatable: boolean
          label: string
          section: Database["public"]["Enums"]["field_section"]
          updated_at: string
          validation_rule: string | null
        }
        Insert: {
          created_at?: string
          data_type?: Database["public"]["Enums"]["field_data_type"]
          default_value?: string | null
          description?: string | null
          field_key: string
          id?: string
          is_calculated?: boolean
          is_repeatable?: boolean
          label: string
          section: Database["public"]["Enums"]["field_section"]
          updated_at?: string
          validation_rule?: string | null
        }
        Update: {
          created_at?: string
          data_type?: Database["public"]["Enums"]["field_data_type"]
          default_value?: string | null
          description?: string | null
          field_key?: string
          id?: string
          is_calculated?: boolean
          is_repeatable?: boolean
          label?: string
          section?: Database["public"]["Enums"]["field_section"]
          updated_at?: string
          validation_rule?: string | null
        }
        Relationships: []
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
      generate_deal_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "csr"
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
      app_role: ["admin", "csr"],
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
      ],
    },
  },
} as const
