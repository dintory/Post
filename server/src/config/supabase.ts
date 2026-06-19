import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hbqwsanncmfvbnvnwxgm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_uHaV-A4k6-jpvXNeWtOZBA_vwZQt1dz';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getSupabaseClient = (token?: string) => {
  if (!token) return supabase;
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
};
