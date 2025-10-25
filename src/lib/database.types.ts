// src/lib/database.types.ts
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
          email: string
          full_name: string | null
          user_type: 'client' | 'freelancer' | 'both'
          avatar_url: string | null
          bio: string | null
          country: string | null
          timezone: string | null
          wallet_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          user_type?: 'client' | 'freelancer' | 'both'
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          timezone?: string | null
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          user_type?: 'client' | 'freelancer' | 'both'
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          timezone?: string | null
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          created_at?: string
        }
      }
      freelancer_skills: {
        Row: {
          id: string
          freelancer_id: string
          skill_id: string
          proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          created_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          skill_id: string
          proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          created_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          skill_id?: string
          proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          client_id: string
          freelancer_id: string | null
          budget_amount: number | null
          budget_currency: string
          status: 'draft' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          deadline: string | null
          start_date: string | null
          completion_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          client_id: string
          freelancer_id?: string | null
          budget_amount?: number | null
          budget_currency?: string
          status?: 'draft' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          deadline?: string | null
          start_date?: string | null
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          client_id?: string
          freelancer_id?: string | null
          budget_amount?: number | null
          budget_currency?: string
          status?: 'draft' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          deadline?: string | null
          start_date?: string | null
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_milestones: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          amount: number
          status: 'pending' | 'in_progress' | 'completed' | 'approved'
          due_date: string | null
          completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          amount: number
          status?: 'pending' | 'in_progress' | 'completed' | 'approved'
          due_date?: string | null
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          amount?: number
          status?: 'pending' | 'in_progress' | 'completed' | 'approved'
          due_date?: string | null
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          project_id: string | null
          client_id: string
          freelancer_id: string
          amount: number
          currency: string
          status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue'
          issue_date: string
          due_date: string | null
          paid_date: string | null
          description: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          project_id?: string | null
          client_id: string
          freelancer_id: string
          amount: number
          currency?: string
          status?: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue'
          issue_date?: string
          due_date?: string | null
          paid_date?: string | null
          description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          project_id?: string | null
          client_id?: string
          freelancer_id?: string
          amount?: number
          currency?: string
          status?: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue'
          issue_date?: string
          due_date?: string | null
          paid_date?: string | null
          description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          total?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          payer_id: string
          payee_id: string
          amount: number
          currency: string
          payment_method: 'wallet' | 'bank_transfer' | 'crypto' | 'card'
          transaction_hash: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          payment_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          payer_id: string
          payee_id: string
          amount: number
          currency?: string
          payment_method?: 'wallet' | 'bank_transfer' | 'crypto' | 'card'
          transaction_hash?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          payment_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          payer_id?: string
          payee_id?: string
          amount?: number
          currency?: string
          payment_method?: 'wallet' | 'bank_transfer' | 'crypto' | 'card'
          transaction_hash?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          payment_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          project_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      generate_invoice_number: {
        Args: Record<string, never>
        Returns: string
      }
    }
  }
}
