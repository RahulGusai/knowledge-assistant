import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const supabaseUrl: string = 'YOUR_SUPABASE_URL';
const supabaseAnonKey: string = 'YOUR_SUPABASE_ANON_KEY';

// Check if credentials are configured
const isValidUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');
const isConfigured = 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  isValidUrl(supabaseUrl);

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const isSupabaseConfigured = isConfigured;
