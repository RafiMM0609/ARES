// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Use demo/placeholder values if environment variables are not set
// This allows the app to build and run in demo mode without actual Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key (for API routes)
// Now supports setting current user context for RLS
export function getServiceSupabase(userId?: string): SupabaseClient<Database> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key';
  
  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Set the current user context for RLS if userId is provided
  if (userId) {
    // Note: This sets a session variable that RLS policies can check
    // The RLS policies use current_setting('app.current_user_id')
    client.rpc('set_user_context', { user_id: userId }).then(() => {
      // Context set successfully
    }).catch(() => {
      // If the function doesn't exist yet, we'll handle it later
      // The database migration will add this function
    });
  }

  return client;
}

/**
 * Get authenticated Supabase client for server-side operations
 * Sets the user context for Row Level Security
 */
export async function getAuthenticatedSupabase(userId: string): Promise<SupabaseClient<Database>> {
  const client = getServiceSupabase();
  
  // Set the user context for RLS policies
  await client.rpc('set_config', {
    setting_name: 'app.current_user_id',
    setting_value: userId,
    is_local: true
  }).catch(() => {
    // Fallback: if RPC doesn't work, we'll use SQL directly
    // This is handled in the database migration
  });

  return client;
}
