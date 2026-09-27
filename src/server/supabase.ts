import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    '[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.'
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Validates connectivity to the Supabase database.
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  tableCount?: number;
}> {
  try {
    const { data, error } = await supabase.from('wards').select('id', { count: 'exact' });
    if (error) {
      return { success: false, message: error.message };
    }
    return {
      success: true,
      message: 'Supabase PostgreSQL connected successfully',
      tableCount: data?.length || 0,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed' };
  }
}

/**
 * Checks if Supabase connection is healthy and tables are created
 */
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  tablesExist: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.from('wards').select('id').limit(1);
    if (error) {
      return { connected: false, tablesExist: false, error: error.message };
    }
    return { connected: true, tablesExist: true };
  } catch (err: any) {
    return { connected: false, tablesExist: false, error: err?.message || 'Network error' };
  }
}
