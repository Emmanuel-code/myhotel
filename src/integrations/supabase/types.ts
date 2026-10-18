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
      booking_history: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          booking_id: string
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          booking_id: string
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          booking_id?: string
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          checked_in_at: string | null
          checked_out_at: string | null
          confirmation_number: string
          created_at: string
          currency: string
          extras: Json
          extras_total: number
          guest_email: string | null
          guest_first_name: string | null
          guest_last_name: string | null
          guest_phone: string | null
          guests: number
          id: string
          nights: number
          payment_method: string | null
          room_category: string | null
          room_id: string
          room_image: string | null
          room_name: string
          room_total: number
          room_unit_id: string | null
          room_view: string | null
          special_requests: string | null
          status: string
          taxes: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in: string
          check_out: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          confirmation_number: string
          created_at?: string
          currency?: string
          extras?: Json
          extras_total?: number
          guest_email?: string | null
          guest_first_name?: string | null
          guest_last_name?: string | null
          guest_phone?: string | null
          guests?: number
          id?: string
          nights: number
          payment_method?: string | null
          room_category?: string | null
          room_id: string
          room_image?: string | null
          room_name: string
          room_total?: number
          room_unit_id?: string | null
          room_view?: string | null
          special_requests?: string | null
          status?: string
          taxes?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          confirmation_number?: string
          created_at?: string
          currency?: string
          extras?: Json
          extras_total?: number
          guest_email?: string | null
          guest_first_name?: string | null
          guest_last_name?: string | null
          guest_phone?: string | null
          guests?: number
          id?: string
          nights?: number
          payment_method?: string | null
          room_category?: string | null
          room_id?: string
          room_image?: string | null
          room_name?: string
          room_total?: number
          room_unit_id?: string | null
          room_view?: string | null
          special_requests?: string | null
          status?: string
          taxes?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          body: Json | null
          created_at: string
          hero_eyebrow: string | null
          hero_heading: string | null
          hero_subheading: string | null
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: Json | null
          created_at?: string
          hero_eyebrow?: string | null
          hero_heading?: string | null
          hero_subheading?: string | null
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: Json | null
          created_at?: string
          hero_eyebrow?: string | null
          hero_heading?: string | null
          hero_subheading?: string | null
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      concierge_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      housekeeping_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          notes: string | null
          priority: string
          room_unit_id: string | null
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          room_unit_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          room_unit_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_room_unit_id_fkey"
            columns: ["room_unit_id"]
            isOneToOne: false
            referencedRelation: "room_units"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string
          currency: string
          id: string
          invoice_number: string
          issued_at: string
          line_items: Json
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          currency?: string
          id?: string
          invoice_number: string
          issued_at?: string
          line_items?: Json
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          currency?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          line_items?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience_role: Database["public"]["Enums"]["app_role"] | null
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          audience_role?: Database["public"]["Enums"]["app_role"] | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          audience_role?: Database["public"]["Enums"]["app_role"] | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dietary_preferences: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          loyalty_points: number
          loyalty_tier: string
          phone: string | null
          pillow_preference: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dietary_preferences?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          loyalty_points?: number
          loyalty_tier?: string
          phone?: string | null
          pillow_preference?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dietary_preferences?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          loyalty_points?: number
          loyalty_tier?: string
          phone?: string | null
          pillow_preference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          audience: string | null
          code: string
          created_at: string
          description: string | null
          discount_pct: number
          ends_at: string | null
          id: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience?: string | null
          code: string
          created_at?: string
          description?: string | null
          discount_pct?: number
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: string | null
          code?: string
          created_at?: string
          description?: string | null
          discount_pct?: number
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_reservations: {
        Row: {
          created_at: string
          guest_email: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          party_size: number
          reservation_date: string
          reservation_time: string
          special_requests: string | null
          status: string
          updated_at: string
          user_id: string | null
          venue: string
        }
        Insert: {
          created_at?: string
          guest_email?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          party_size?: number
          reservation_date: string
          reservation_time: string
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          venue?: string
        }
        Update: {
          created_at?: string
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          party_size?: number
          reservation_date?: string
          reservation_time?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          venue?: string
        }
        Relationships: []
      }
      room_units: {
        Row: {
          created_at: string
          floor: number | null
          id: string
          notes: string | null
          room_id: string
          room_name: string
          status: string
          unit_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor?: number | null
          id?: string
          notes?: string | null
          room_id: string
          room_name: string
          status?: string
          unit_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor?: number | null
          id?: string
          notes?: string | null
          room_id?: string
          room_name?: string
          status?: string
          unit_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          assigned_name: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          notes: string | null
          role: Database["public"]["Enums"]["app_role"]
          shift_date: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_name?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          notes?: string | null
          role: Database["public"]["Enums"]["app_role"]
          shift_date: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_name?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          shift_date?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      spa_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          duration_minutes: number
          guest_email: string | null
          guest_name: string
          id: string
          notes: string | null
          price: number
          status: string
          therapist: string | null
          treatment: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          duration_minutes?: number
          guest_email?: string | null
          guest_name: string
          id?: string
          notes?: string | null
          price?: number
          status?: string
          therapist?: string | null
          treatment: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          duration_minutes?: number
          guest_email?: string | null
          guest_name?: string
          id?: string
          notes?: string | null
          price?: number
          status?: string
          therapist?: string | null
          treatment?: string
          updated_at?: string
          user_id?: string | null
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
      event_inquiries: {
        Row: {
          created_at: string
          estimated_guests: number | null
          event_type: string
          guest_email: string
          guest_name: string
          guest_phone: string | null
          id: string
          message: string | null
          preferred_date: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          estimated_guests?: number | null
          event_type: string
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          id?: string
          message?: string | null
          preferred_date?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          estimated_guests?: number | null
          event_type?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          id?: string
          message?: string | null
          preferred_date?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "owner"
        | "gm"
        | "front_desk"
        | "housekeeping"
        | "restaurant"
        | "spa"
        | "marketing"
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
      app_role: [
        "owner",
        "gm",
        "front_desk",
        "housekeeping",
        "restaurant",
        "spa",
        "marketing",
      ],
    },
  },
} as const
